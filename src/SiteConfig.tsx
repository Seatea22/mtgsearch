import { TcgPlayerApi } from "./PlatformApi";
import { SearchSettings } from "./SearchPanel";
import { TcgPlayerShop } from "./Shop";
import { TcgPlayerUser } from "./User";

export const SELLER_INFO_ID: string = ".seller-routes";

export class TcgPlayerScriptConfig {
    hostname: string = 'tcgplayer.com';
    
    shopInfo: TcgPlayerShop = new TcgPlayerShop();
    userInfo: TcgPlayerUser = new TcgPlayerUser();
    searchApi: TcgPlayerApi = new TcgPlayerApi(this.shopInfo, this.userInfo);
    
    searchSettings = new SearchSettings();

    constructor(cfg: TcgPlayerScriptConfig | null = null) {
        if (cfg) Object.assign(this, cfg);
    }
}

export interface ScriptConfigProps {
    config: TcgPlayerScriptConfig;
    setConfig: React.Dispatch<React.SetStateAction<TcgPlayerScriptConfig | null>>;
}