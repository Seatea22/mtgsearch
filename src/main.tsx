import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { TcgPlayerShop } from './Shop';
import TcgPlayerSearch from './SearchModal';

const SELLER_ROTUES = ".seller-routes";
let currentPageShopInfo: TcgPlayerShop | null = null;

function waitForElm(selector: string) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function scrapeSellerInfo(): TcgPlayerShop | null {
    const sellerInfo = document.querySelector(SELLER_ROTUES);
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

    return {
      name: storeName?.value ? storeName.value.trim() : "Unknown Shop Name",
      id: sellerId?.value ? sellerId.value.trim() : null
    };
}

await waitForElm(SELLER_ROTUES).then(async () => {
  ReactDOM.createRoot(
    ( () => {
        currentPageShopInfo = scrapeSellerInfo();
        
        if (!currentPageShopInfo) throw new Error(`Shop info is null!`);
        if (!currentPageShopInfo.id) throw new Error(`There was an error getting the shop ID!`);
      
        const app = document.createElement('div');
        document.body.prepend(app);
        return app;
      })(),
    ).render(
    <React.StrictMode>
      <TcgPlayerSearch name={currentPageShopInfo.name} id={currentPageShopInfo.id}/>
    </React.StrictMode>,
  );
});
