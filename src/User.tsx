import { GM_cookie } from "$";

export function getCartId() {
    GM_cookie.list({name: "StoreCart_PRODUCTION"})
}