import { TcgPlayerShop } from "./Shop";

export class TcgPlayerApi {
    algorithm: string = "revenue_dismax";
    shippingCountry: string = "US";
    shopInfo: TcgPlayerShop;

    constructor(shopInfo: TcgPlayerShop) {
        this.shopInfo = shopInfo;
    }

    
    #getCardUrl = (cardName: string) => {
        return `https://mp-search-api.tcgplayer.com/v1/search/request?q=${encodeURIComponent(cardName)}&isList=true`;
    }

    fetchCardData = (async (cardName: string) => {
        try {
            const response = await fetch(this.#getCardUrl(cardName), {
                method: "POST",
                credentials: "include",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(this.#constructCardRequestPayload())
        });
            const responseData = await response.json();
            console.log("Fetched data for card: " + cardName, responseData);
            return responseData;
        } catch (error) {
            console.error("Error fetching card data:", error);
            return null;
        }
    });

    #constructCardRequestPayload = () => {
        return {
            "algorithm": "revenue_dismax",
            "from": 0,
            "size": 24,
            "filters": { "term": {}, "range": {}, "match": {} },
            "listingSearch": {
                "context": { "cart": {} }, "filters": { "term": { "sellerStatus": "Live", "channelId": 0, "sellerKey": [this.shopInfo.id] }, "range": { "quantity": { "gte": 1 } }, "exclude": { "channelExclusion": 0 } }
            }, "context": { "shippingCountry": "US", "cart": {}, "userProfile": {} }, "settings": { "useFuzzySearch": true }, "sort": {}
        };
    }

    addToCart = (async (condId: string, price: number, itemName: string, quantity = 1) => {
        if (!this.shopInfo) {
            console.error("Shop info is null!");
            return false;
        }
        
        const requestBody = {
            "sku": condId,
            "sellerKey": this.shopInfo.id,
            "channelId": 0,
            "requestedQuantity": quantity,
            "price": price,
            "isDirect": false,
            "countryCode": "US"
        };

        try {
            const response = await fetch(`https://mpgateway.tcgplayer.com/v1/cart/${this.shopInfo.cartId}/item/add`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });
            const responseData = await response.json();

            if (!responseData) {
                console.error("Empty response payload!");
                return false;
            }

            if (responseData.errors.length == 0) {
                return true;
            } else {
                console.error(`Error trying to add ${itemName} to cart: ${responseData.errors[0].message}`);
                return false;
            }
        } catch (error) {
            console.error(`Failed to add ${itemName} to the cart!`, error);
            return false;
        }
    });
}
