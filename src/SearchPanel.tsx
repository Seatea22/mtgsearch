import { useEffect, useRef, useState } from "react";
import { Card, CardListProps } from "./Card";
import './assets/search.css';
import { TerminalLine, TerminalLineType, TerminalOutput } from "./OutputTerminal";
import { Button, Input, Label } from "reactstrap";
import { TcgPlayerApi } from "./PlatformApi";
import { DataSection } from "./DataSection";
import { TcgPlayerShop } from "./Shop";

export class SearchSettings {
    [key: string]: any;

    // CHANGE THIS IF YOU WANT TO SEARCH FOR ART CARDS
    ignoreArtCards: boolean = true;

    maxMargin: number = 1.00;
    marginPercent: number = 0.5;
    comparisonRatio: number = 0.9;
    sleepTime: number = 0.1;

    constructor(settings: SearchSettings | null = null) {
        if (settings) Object.assign(this, settings);
    }
}

interface SettingChangeProps {
    settingName: string;
    displayLabel: string;
    currentSettings: SearchSettings;
    setSearchSettings: (settings: SearchSettings) => void;
}


const SettingChangeSection: React.FC<SettingChangeProps> = ({ settingName, displayLabel, currentSettings, setSearchSettings }) => {
    const startingValue = currentSettings[settingName];
    const [value, setValue] = useState<string>(String(startingValue));
    

    useEffect(() => {
        setValue(String(currentSettings[settingName]));
    }, [currentSettings, settingName]);

    const commit = () => {
        const parsed = Number(value);
        if (Number.isNaN(parsed) || value.trim() === '') {
            setValue(startingValue);
            return;
        }

        const newSettings = new SearchSettings(currentSettings);
        newSettings[settingName] = parsed;
        setSearchSettings(newSettings);                  
    }

    return (
        <div style={{padding: '20px'}}>
            <Label for={`change-${settingName.toLowerCase()}`}>{displayLabel}</Label>
            <Input 
                id={`change-${settingName.toLowerCase()}`} 
                value={value}
                type="text"
                onChange={(e) => setValue(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        (e.target as HTMLInputElement).blur();
                    }
                }}
        />
        </div>
    );
}

export interface SearchPanelProps extends CardListProps {
    searchSettings: SearchSettings;
    setSearchSettings: (newSettings: SearchSettings) => void;
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

interface FoundCard {
    name: string;
    listing: Listing;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ cards, setCards, searchSettings, setSearchSettings, searchApi }) => {
    const [outputLines, setOutputLines] = useState<TerminalLine[]>([]);
    const [searching, setSearching] = useState<boolean>(false);

    const searchingRef = useRef(false);

    const addOutputLine = (msg: string, type: TerminalLineType) => {
        setOutputLines((prev) => [
            ...prev,
            { id: crypto.randomUUID(), text: msg, type },
        ]);
    };

    const clearOutput = () => setOutputLines([]);

    const sleep = () => new Promise((resolve) => setTimeout(resolve, 100 * searchSettings.sleepTime));

    const iterateSearch = async (): Promise<FoundCard[]> => {
        console.log(searchApi.shopInfo);
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
                        addOutputLine(`Found ${card.name}!`, 'success');
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
            addOutputLine(`"${paramName}" is null!`, 'error');
            return false;
        }

        if (type === "array") {
            if (!Array.isArray(value)) {
                addOutputLine(`${paramName} must be an array!`, 'error');
                return false;
            }
            return true;
        }

        if (type !== null && typeof value !== type) {
            addOutputLine(`${paramName} is not a ${type}!`, 'error');
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
            addOutputLine(`No listings found for card: ${cardName}`, 'error');
            return invalidResult;
        }

        const listings = nestedResults.results;
        if (!isValidValue("listings", listings, "array")) return invalidResult;

        if (listings.length <= 0) {
            addOutputLine(`No nested results found for card: ${cardName}`, 'error');
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
            addOutputLine(`Listing seller key does not match for card: ${cardName}`, 'error');
            return false;
        }

        const conditionsLower = cardData.allowedConditions.map((cond) => cond.toLowerCase());
        const printingsLower = cardData.allowedPrintings.map((cond) => cond.toLowerCase());

        if (!conditionsLower.includes(listing.condition.toLowerCase())) {
            addOutputLine(`Listing condition not available for card: ${cardName}. Condition: ${listing.condition}`, 'error');
            return false;
        }

        if (!printingsLower.includes(listing.printing.toLowerCase())) {
            addOutputLine(`Printing(s) not available for card: ${cardName}. Printing: ${listing.printing}`, 'error');
            return false;
        }

        return true;
    };

    const priceMarginCalculation = (maxPrice: number, flexible: boolean): number => {
        if (!flexible) {
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

        const calculatedRatio = Math.ceil((marketPrice / listedPrice) * 100) / 100;
        return calculatedRatio >= searchSettings.comparisonRatio;
    };

    const checkHasCard = (card: Card, searchResult: RawSearchResult, sellerId: string): { valid: boolean; listing?: Listing } => {
        const cardName = card.name;
        const validation = validateResultFormat(searchResult, cardName);
        if (!validation.valid) {
            return { valid: false };
        }

        for (const result of validation.results) {
            if (!result.productName.toLowerCase().includes(cardName.toLowerCase())) {
                addOutputLine(`Product name does not match card name for card: ${cardName}. Product name: ${result.productName}`, 'warn');
                continue;
            }

            if (searchSettings.ignoreArtCards && result.productName.toLowerCase().includes('art card')) {
                addOutputLine(`Art card ignored!. Product name: ${result.productName}`, 'warn');
                continue;
            }

            if (result.productLineName !== searchApi.shopInfo.productLine) {
                addOutputLine(`Result is not of the same product line: ${searchApi.shopInfo.productLine}`, 'error');
                continue;
            }

            if (card.collections.length > 0 && !card.collections.includes(result.setName)) {
                addOutputLine(`No matching collections for ${cardName}.`, 'error');
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
                return { valid: true, listing: bestListing };
            }
        }
        addOutputLine(`Card not found or price too high: ${cardName}`, 'error');
        return { valid: false };
    };

    return (
        <div className="panel">
            <div className="panel-output">
                <TerminalOutput lines={outputLines} height="50vh" />
            </div>

            <div className="panel-input">
                <SettingChangeSection
                    settingName="maxMargin"
                    displayLabel="Max Margin:"
                    currentSettings={searchSettings}
                    setSearchSettings={setSearchSettings}
                />
                <SettingChangeSection
                    settingName="marginPercent"
                    displayLabel="Margin Percent:"
                    currentSettings={searchSettings}
                    setSearchSettings={setSearchSettings}
                />
                <SettingChangeSection
                    settingName="comparisonRatio"
                    displayLabel="Comparison Ratio:"
                    currentSettings={searchSettings}
                    setSearchSettings={setSearchSettings}
                />
                <div className="center">
                    <Button onClick={handleSearchClick}>{searching ? "Stop Search" : "Start Search"}</Button>
                    <Button color="secondary" onClick={clearOutput} disabled={searching}>Clear Output</Button>
                </div>
            </div>
            
        </div>
    );
}