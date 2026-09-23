import { GM_cookie } from "$";


export class TcgPlayerShop {
    name: string = "Unknown";
    id: string = "";
    productLine: string = "Magic: The Gathering";

    assign(obj: object) {
        if (obj) {
            Object.assign(this, obj);
        } else {
            throw new Error('Invalid object provided to MtgShop assigner!');
        }
    }

    scrapeSellerInfo = async (sellerInfoId: string) => {
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
}
