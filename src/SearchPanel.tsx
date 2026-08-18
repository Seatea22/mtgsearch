import { useRef, useState } from "react";
import { Card, CardListProps } from "./Card";
import './assets/search.css';
import { TerminalLine, TerminalLineType, TerminalOutput } from "./OutputTerminal";
import { Button } from "reactstrap";
import { TcgPlayerApi } from "./PlatformApi";

export class SearchSettings {
    maxMargin: number = 1.00;
    marginPercent: number = 0.5;
    comparisonRatio: number = 0.9;
    sleepTime: number = 0.1;
}

export interface SearchPanelProps extends CardListProps {
    searchSettings: SearchSettings;
    searchApi: TcgPlayerApi;
}

interface Listing {
    sellerKey: string;
    sellerPrice: number;
    condition: string;
    printing: string;
    productConditionId: string;
}

interface ProductResult {
    productName: string;
    productLineName: string;
    setName: string;
    marketPrice: number;
    listings: Listing[];
}

// Shape actually returned by the search API: results[0].results is the list of matching products.
interface RawSearchResult {
    results: Array<{ totalResults: number; results: ProductResult[] }>;
}

// Shape actually accumulated while searching — distinct from RawSearchResult, which the
// original code mistakenly reused for both.
interface FoundCard {
    name: string;
    listing: Listing;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ cards, setCards, searchSettings, searchApi }) => {
    const [outputLines, setOutputLines] = useState<TerminalLine[]>([]);
    const [searching, setSearching] = useState<boolean>(false);

    // A ref mirrors `searching` so the in-flight loop can check the *current* value
    // synchronously. State updates don't apply until the next render, so checking
    // `searching` directly inside an already-running async function reads a stale value.
    const searchingRef = useRef(false);

    const addOutputLine = (msg: string, type: TerminalLineType) => {
        // Functional update form: always applies on top of the latest state, regardless
        // of which render's closure this function happened to be called from. Fixes lines
        // being dropped when called repeatedly across awaits.
        setOutputLines((prev) => [
            ...prev,
            { id: crypto.randomUUID(), text: msg, type },
        ]);
    };

    const clearOutput = () => setOutputLines([]);

    const sleep = () => new Promise((resolve) => setTimeout(resolve, 100 * searchSettings.sleepTime));

    const iterateSearch = async (): Promise<FoundCard[]> => {
        const finalResults: FoundCard[] = [];
        for (const card of cards) {
            if (!searchingRef.current) {
                return finalResults;
            }

            addOutputLine(`Searching for ${card.name}`, 'info');

            try {
                const apiResult = await searchApi.fetchCardData(card.name);
                if (apiResult) {
                    const result = checkHasCard(card, apiResult, searchApi.shopInfo.id);
                    if (result.valid && result.listing) {
                        finalResults.push({ name: card.name, listing: result.listing });
                        addOutputLine(`${card.name} (FOUND)`, 'success');
                    } else {
                        addOutputLine(`${card.name} (NOT FOUND)`, 'error');
                    }
                } else {
                    addOutputLine(`${card.name} (ERROR)`, 'error');
                }
            } catch (err) {
                console.error(err);
                addOutputLine(`${card.name} (ERROR)`, 'error');
            }

            await sleep();
        }
        return finalResults;
    };

    const addAllToCart = async (results: FoundCard[]) => {
        for (const result of results) {
            const conditionId = result.listing.productConditionId;
            const price = result.listing.sellerPrice;
            const success = await searchApi.addToCart(conditionId, price, result.name);
            if (!success) {
                addOutputLine(`Failed to add ${result.name} to the cart!`, 'error');
            } else {
                addOutputLine(`Successfully added ${result.name} to the cart!`, 'success');
            }
        }
        addOutputLine("Adding to cart finished!", 'info');
    };

    const runSearch = async () => {
        searchingRef.current = true;
        setSearching(true);

        const results = await iterateSearch();

        searchingRef.current = false;
        setSearching(false);

        if (!results || results.length === 0) {
            confirm("Found no results!");
            return;
        }

        if (!confirm(`Would you like to add the following items to the cart?\n\n${results.map(r => r.name).join('\n')}`)) {
            return;
        }

        await addAllToCart(results);
    };

    const handleSearchClick = async () => {
        if (searchingRef.current) {
            searchingRef.current = false;
            setSearching(false);
            return;
        }

        await runSearch();
    };

    const isValidValue = (paramName: string, value: unknown, type: "array" | "string" | "number" | "object" | null = null) => {
        if (value === null || value === undefined) {
            console.error(`"${paramName}" is null!`);
            return false;
        }

        if (type === "array") {
            if (!Array.isArray(value)) {
                console.error(`${paramName} must be an array!`);
                return false;
            }
            return true;
        }

        if (type !== null && typeof value !== type) {
            console.error(`${paramName} is not a ${type}!`);
            return false;
        }

        return true;
    };

    const validateResultFormat = (searchResult: RawSearchResult, cardName: string): { valid: boolean; results: ProductResult[] } => {
        const invalidResult = { valid: false, results: [] as ProductResult[] };

        if (!isValidValue("searchResult", searchResult)) return invalidResult;
        if (!isValidValue("searchResult.results", searchResult.results, "array")) return invalidResult;

        const nestedResults = searchResult.results[0];
        if (!isValidValue("nestedResults", nestedResults, "object")) return invalidResult;

        if (nestedResults.totalResults <= 0) {
            console.log("No listings found for card: " + cardName);
            return invalidResult;
        }

        const listings = nestedResults.results;
        if (!isValidValue("listings", listings, "array")) return invalidResult;

        if (listings.length <= 0) {
            console.log("No nested results found for card: " + cardName);
            return invalidResult;
        }

        return { valid: true, results: listings };
    };

    const validListing = (cardData: Card, listing: Listing, sellerId: string): boolean => {
        const cardName = cardData.name;

        if (!isValidValue("listing", listing, "object")) return false;
        if (!isValidValue("sellerKey", listing.sellerKey, "string")) return false;
        if (!isValidValue("sellerPrice", listing.sellerPrice, "number")) return false;
        if (!isValidValue("condition", listing.condition, "string")) return false;

        if (listing.sellerKey !== sellerId) {
            console.log("Listing seller key does not match for card: " + cardName);
            return false;
        }

        const conditionsLower = cardData.allowedConditions.map((cond) => cond.toLowerCase());
        const printingsLower = cardData.allowedPrintings.map((cond) => cond.toLowerCase());

        if (!conditionsLower.includes(listing.condition.toLowerCase())) {
            console.log("Listing condition not available for card: " + cardName + ". Condition: " + listing.condition);
            return false;
        }

        if (!printingsLower.includes(listing.printing.toLowerCase())) {
            console.log("Printing(s) not available for card: " + cardName + ". Printing: " + listing.printing);
            return false;
        }

        return true;
    };

    const priceMarginCalculation = (maxPrice: number, strictPrice: boolean): number => {
        if (strictPrice) {
            return maxPrice;
        }

        let marginFromMaxPrice = maxPrice * searchSettings.marginPercent;
        if (marginFromMaxPrice > searchSettings.maxMargin) {
            marginFromMaxPrice = searchSettings.maxMargin;
        }
        return maxPrice + marginFromMaxPrice;
    };

    const validMarketRatio = (marketPrice: number, listedPrice: number, useRatio: boolean): boolean => {
        if (!useRatio) {
            return true;
        }

        const calculatedRatio = marketPrice / listedPrice;
        return calculatedRatio >= searchSettings.comparisonRatio;
    };

    const checkHasCard = (card: Card, searchResult: RawSearchResult, sellerId: string): { valid: boolean; listing?: Listing } => {
        const cardName = card.name;
        const validation = validateResultFormat(searchResult, cardName);
        if (!validation.valid) {
            console.log("Validation failed for card: " + cardName);
            return { valid: false };
        }

        for (const result of validation.results) {
            if (!result.productName.toLowerCase().includes(cardName.toLowerCase())) {
                console.log(`Product name does not match card name for card: ${cardName}. Product name: ${result.productName}`);
                continue;
            }

            if (result.productLineName !== searchApi.shopInfo.productLine) {
                console.log(`Result is not of the same product line: ${searchApi.shopInfo.productLine}`);
                continue;
            }

            if (card.collections.length > 0 && !card.collections.includes(result.setName)) {
                console.log(`No matching collections for ${cardName}.`);
                continue;
            }

            let bestListing: Listing | null = null;
            for (const listing of result.listings) {
                if (!validListing(card, listing, sellerId)) {
                    continue;
                }

                if (
                    listing.sellerPrice > priceMarginCalculation(card.maxPrice, card.flexible) ||
                    !validMarketRatio(result.marketPrice, listing.sellerPrice, card.relative)
                ) {
                    continue;
                }

                if (!bestListing) {
                    bestListing = listing;
                } else if (card.cheapest) {
                    if (listing.sellerPrice < bestListing.sellerPrice) {
                        bestListing = listing;
                    }
                } else if (listing.sellerPrice > bestListing.sellerPrice) {
                    bestListing = listing;
                }
            }

            if (bestListing) {
                console.log("Card found: " + cardName);
                return { valid: true, listing: bestListing };
            }
        }
        console.log("Card not found or price too high: " + cardName);
        return { valid: false };
    };

    return (
        <div className="panel">
            <div className="output">
                <TerminalOutput lines={outputLines} />
            </div>
            <div className="values">

            </div>
            <div className="buttons center">
                <Button onClick={handleSearchClick}>{searching ? "Stop Search" : "Start Search"}</Button>
                <Button color="secondary" onClick={clearOutput} disabled={searching}>Clear Output</Button>
            </div>
        </div>
    );
}