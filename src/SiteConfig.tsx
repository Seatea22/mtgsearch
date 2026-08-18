import { TcgPlayerApi } from "./PlatformApi";
import { SearchSettings } from "./SearchPanel";
import { TcgPlayerShop } from "./Shop";

export class TcgPlayerScriptConfig {
    hostname: string = 'tcgplayer.com';
    sellerInfoId: string = ".seller-routes";

    shopInfo: TcgPlayerShop = new TcgPlayerShop();
    searchApi: TcgPlayerApi = new TcgPlayerApi(this.shopInfo);
    

    searchSettings = new SearchSettings();

    constructor() {
        this.shopInfo.getStoreCartCookie(this.hostname);
    }
}

export interface ScriptConfigProps {
    config: TcgPlayerScriptConfig;
}