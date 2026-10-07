// A discount code applied at checkout is remembered for the tab, so the cart's "Saved" line can reflect it too.
const KEY = "cindyrella_checkout_voucher";

export function getCheckoutVoucher(): string {
    try {
        return sessionStorage.getItem(KEY) ?? "";
    } catch {
        return "";
    }
}

export function setCheckoutVoucher(code: string) {
    try {
        if (code) sessionStorage.setItem(KEY, code);
        else sessionStorage.removeItem(KEY);
    } catch {
        // Storage blocked: the code just isn't remembered between pages.
    }
}
