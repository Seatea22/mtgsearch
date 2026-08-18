import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { TcgPlayerShop } from './Shop';
import TcgPlayerSearch from './MainModal';
import { TcgPlayerScriptConfig } from './SiteConfig';

const scriptConfig = new TcgPlayerScriptConfig();

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

await waitForElm(scriptConfig.sellerInfoId).then(async () => {
    scriptConfig.shopInfo.scrapeSellerInfo(scriptConfig.sellerInfoId);
    console.log(scriptConfig);

    ReactDOM.createRoot(
        ( () => {
            
            
            if (!scriptConfig.shopInfo) throw new Error(`Shop info is null!`);
            if (!scriptConfig.shopInfo.id) throw new Error(`There was an error getting the shop ID!`);
        
            const app = document.createElement('div');
            document.body.prepend(app);
            return app;
        })(),
        ).render(
        <React.StrictMode>
            <TcgPlayerSearch config={scriptConfig}/>
        </React.StrictMode>,
    );
});