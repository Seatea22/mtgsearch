import { GM_cookie } from "$";
import { waitForElm } from "./UtilUI";


const ACCOUNT_SPECIFIER = "accountMenuUserName";
const CART_LOGGED_OUT = "anonymouscart";
const CART_LOGGED_IN = "usercart"; 

export class TcgPlayerUser {
    mfprev: number = 5489;
    cartCookie: string = "StoreCart_PRODUCTION";

    loggedIn: boolean = false;
    cartType: string = CART_LOGGED_OUT;
    cartId: string = "";


    detectLogin = (async () => {
        console.log("Detecting login...");
        const dataAID = `[data-aid="${ACCOUNT_SPECIFIER}"]`;
        try {
                await waitForElm(dataAID, 2000).then(async () => {
                const info = document.querySelector(dataAID);
                if (info) {
                    this.loggedIn = true;
                    this.cartType = CART_LOGGED_IN;
                }
            });
        } catch {}
        console.log(this.loggedIn, this.cartType);
    });

    getStoreCartCookie = async (hostname: string) => {
        GM_cookie.list({ name: this.cartCookie, domain: `.${hostname}` }, async (cookies, error) => {
            if (error) {
                console.error(error);
            } else if (!cookies || cookies.length === 0) {
                // Create cookie
                try {
                    const response = await fetch(`https://mpgateway.tcgplayer.com/v1/cart/create/${this.cartType}?mpfev=5489`, {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        }
                    });
                    const responseData = await response.json();

                    if (!responseData?.results || responseData.results.length == 0) {
                        console.error("Empty response payload!");
                        return;
                    }

                    if (!responseData.results[0].cartKey) {
                        console.error("Cart key failed to create!");
                        return;
                    }

                    this.cartId = responseData.results[0].cartKey;
                    console.log("Created", this.cartId);
                } catch (error) {
                    console.error(error);
                    return;
                }
            } else {
                const cartValue = cookies[0].value;
                if (!cartValue) {
                    console.error("Cart value is null!", cookies[0].value);
                    return;
                }

                const params = new URLSearchParams(cartValue);
                const ck = params.get('CK');
                this.cartId = ck !== null ? String(ck) : '';
                console.log("Found", this.cartId);
                console.log(this);
            }
        });
    };
}
