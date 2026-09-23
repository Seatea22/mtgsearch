import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import TcgPlayerSearch from './MainModal';
import { SELLER_INFO_ID, TcgPlayerScriptConfig } from './SiteConfig';
import { waitForElm } from './UtilUI';



function Root() {
    const [config, setConfig] = React.useState<TcgPlayerScriptConfig | null>(null);

    const setupScriptConfig = async () => {
        const newConfig = new TcgPlayerScriptConfig();
        await newConfig.shopInfo.scrapeSellerInfo(SELLER_INFO_ID);
        await newConfig.userInfo.detectLogin();
        await newConfig.userInfo.getStoreCartCookie(newConfig.hostname);
        
        console.log(newConfig);
        return newConfig;
    }

    React.useEffect(() => {
        let lastPath = location.pathname;

        const load = async () => {
            const cfg = await setupScriptConfig();
            console.log(cfg);
            if (cfg.shopInfo?.id) setConfig(cfg);
        };

        waitForElm(SELLER_INFO_ID).then(load);

        const checkRoute = () => {
            if (location.pathname === lastPath) return;
            lastPath = location.pathname;
            waitForElm(SELLER_INFO_ID).then(load).catch(() => setConfig(null));
        };

        for (const method of ['pushState', 'replaceState'] as const) {
            const orig = history[method];
            history[method] = function (...args) {
                orig.apply(this, args);
                checkRoute();
            };
        }
        window.addEventListener('popstate', checkRoute);
    }, []);

    if (!config) return null;
    return <TcgPlayerSearch config={config} setConfig={setConfig} />;
}

const app = document.createElement('div');
document.body.prepend(app);
ReactDOM.createRoot(app).render(<React.StrictMode><Root /></React.StrictMode>);