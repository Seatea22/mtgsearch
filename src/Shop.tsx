import { GM_cookie } from "$";


export class TcgPlayerShop {
    name: string = "Unknown";
    id: string = "";
    productLine: string = "Magic: The Gathering";
    cartCookie: string = "StoreCart_PRODUCTION";
    cartId: string = "";

    assign(obj: object) {
        if (obj) {
            Object.assign(this, obj);
        } else {
            throw new Error('Invalid object provided to MtgShop assigner!');
        }
    }

    scrapeSellerInfo = (sellerInfoId: string) => {
        const sellerInfo = document.querySelector(sellerInfoId);
        if (!sellerInfo) {
            console.error("Seller info not found.");
            return null;
        }

        const sellerAttributes = sellerInfo.attributes;
        if (!sellerAttributes) {
            console.error("Seller attributes not found.");
            return null;
        }

        const storeName = sellerAttributes.getNamedItem("storename");
        const sellerId = sellerAttributes.getNamedItem("sellerkey");

        this.name = storeName?.value ? storeName.value.trim() : "Unknown Shop Name",
        this.id = sellerId?.value ? sellerId.value.trim() : "";
    }

    getStoreCartCookie = (hostname: string) => {
        console.log(hostname);
        GM_cookie.list({ name: this.cartCookie, domain: `.${hostname}` }, (cookies, error) => {
            console.log(cookies);
            if (error) {
                console.error(error);
            } else if (!cookies || cookies.length === 0) {
                console.error(cookies);
            } else {
                const cartValue = cookies[0].value;
                console.log(cartValue);
                if (!cartValue) {
                    console.error("Cart value is null!", cookies[0].value);
                    return;
                }

                const params = new URLSearchParams(cartValue);
                const ck = params.get('CK');
                this.cartId = ck !== null ? String(ck) : '';
            }
        });
    };
}
