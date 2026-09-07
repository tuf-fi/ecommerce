"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import { PRODUCTS, getProduct } from "./products";

export type ModalKey =
    | "login"
    | "welcome"
    | "quiz";

export type Address = { id: number; label: string; text: string; isDefault: boolean };

export type CartLine = { productId: number; sizeId: string | null; qty: number };
type CartMap = Record<string, CartLine>;

const MAX_PER_ITEM = 6;

export function cartKey(id: number, sizeId?: string | null) {
    return sizeId ? `${id}::${sizeId}` : String(id);
}

export function lineUnitPrice(line: CartLine): number {
    const p = getProduct(line.productId);
    if (!p) return 0;
    const size = line.sizeId ? p.sizes?.find((s) => s.id === line.sizeId) : undefined;
    return size ? size.price : p.price;
}

type StoreValue = {
    cart: CartMap;
    cartCount: number;
    cartTotal: number;
    addToCart: (id: number, qty?: number, sizeId?: string | null) => void;
    changeQty: (key: string, delta: number) => void;
    removeLine: (key: string) => void;

    wishlist: number[];
    toggleWishlist: (id: number) => void;

    addresses: Address[];
    addAddress: (label: string, text: string) => void;
    editAddress: (id: number, label: string, text: string) => void;
    removeAddress: (id: number) => void;
    setDefaultAddress: (id: number) => void;
    checkoutAddress: Address | null;
    selectCheckoutAddress: (id: number) => void;

    isLoggedIn: boolean;
    customerName: string;
    customerEmail: string;
    signIn: (email: string) => void;
    signOut: () => void;

    showToast: (type: "success" | "error", message: string) => void;

    activeModal: ModalKey | null;
    openModal: (key: ModalKey) => void;
    closeModal: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartMap>({});
    const [wishlist, setWishlist] = useState<number[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([
        { id: 1, label: "Home", text: "221B Kalayaan Ave, Quezon City, Metro Manila", isDefault: true },
    ]);
    const [checkoutAddressId, setCheckoutAddressId] = useState<number | null>(1);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [activeModal, setActiveModal] = useState<ModalKey | null>(null);

    const showToast = useCallback((type: "success" | "error", message: string) => {
        if (type === "success") toast.success(message);
        else toast.error(message);
    }, []);

    const openModal = useCallback((key: ModalKey) => {
        setActiveModal(key);
    }, []);

    const closeModal = useCallback(() => setActiveModal(null), []);

    const addToCart = useCallback(
        (id: number, qty: number = 1, sizeId: string | null = null) => {
            if (!isLoggedIn) {
                openModal("login");
                showToast("error", "Sign in to add items to your bag.");
                return;
            }
            const p = getProduct(id);
            if (!p) return;
            const size = sizeId ? p.sizes?.find((s) => s.id === sizeId) : undefined;
            if (sizeId && !size) return;
            const key = cartKey(id, sizeId);
            const current = cart[key]?.qty || 0;
            // Summed across every size variant of this product, not just the
            // one being added to — otherwise the cap resets per size and a
            // multi-size product can exceed it in total.
            const currentForProduct = Object.values(cart)
                .filter((line) => line.productId === id)
                .reduce((sum, line) => sum + line.qty, 0);
            if (currentForProduct + qty > MAX_PER_ITEM) {
                showToast("error", `Only ${MAX_PER_ITEM} of "${p.title}" allowed per order.`);
                return;
            }
            setCart({ ...cart, [key]: { productId: id, sizeId, qty: current + qty } });
            showToast("success", `Added "${p.title}"${size ? ` (${size.label})` : ""} to your bag.`);
        },
        [cart, isLoggedIn, openModal, showToast]
    );

    const changeQty = useCallback((key: string, delta: number) => {
        setCart((c) => {
            const line = c[key];
            if (!line) return c;
            const nextQty = line.qty + delta;
            const copy = { ...c };
            if (nextQty <= 0) delete copy[key];
            else copy[key] = { ...line, qty: nextQty };
            return copy;
        });
    }, []);

    const removeLine = useCallback((key: string) => {
        setCart((c) => {
            const copy = { ...c };
            delete copy[key];
            return copy;
        });
    }, []);

    const toggleWishlist = useCallback(
        (id: number) => {
            if (!isLoggedIn) {
                openModal("login");
                showToast("error", "Sign in to save items to your wishlist.");
                return;
            }
            const p = getProduct(id);
            const idx = wishlist.indexOf(id);
            if (idx > -1) {
                setWishlist(wishlist.filter((x) => x !== id));
                showToast("success", `Removed "${p?.title ?? "item"}" from wishlist.`);
            } else {
                setWishlist([...wishlist, id]);
                showToast("success", `Saved "${p?.title ?? "item"}" to your wishlist.`);
            }
        },
        [wishlist, isLoggedIn, openModal, showToast]
    );

    const addAddress = useCallback((label: string, text: string) => {
        setAddresses((a) => [...a, { id: Date.now(), label, text, isDefault: a.length === 0 }]);
    }, []);

    const editAddress = useCallback((id: number, label: string, text: string) => {
        setAddresses((a) => a.map((x) => (x.id === id ? { ...x, label, text } : x)));
    }, []);

    const removeAddress = useCallback((id: number) => {
        setAddresses((a) => {
            const removingDefault = a.find((x) => x.id === id)?.isDefault;
            const next = a.filter((x) => x.id !== id);
            if (removingDefault && next.length > 0 && !next.some((x) => x.isDefault)) {
                next[0] = { ...next[0], isDefault: true };
            }
            return next;
        });
    }, []);

    const setDefaultAddress = useCallback((id: number) => {
        setAddresses((a) => a.map((x) => ({ ...x, isDefault: x.id === id })));
    }, []);

    const selectCheckoutAddress = useCallback((id: number) => {
        setCheckoutAddressId(id);
    }, []);

    const signIn = useCallback(
        (email: string) => {
            const name = email ? email.split("@")[0] : "Guest";
            setCustomerName(name);
            setCustomerEmail(email);
            setIsLoggedIn(true);
            // TODO: replace with real auth (JWT + httpOnly cookies) against the backend API.
            setActiveModal(null);
            showToast("success", `Welcome, ${name}!`);
        },
        [showToast]
    );

    const signOut = useCallback(() => {
        setIsLoggedIn(false);
        setCustomerName("");
        setCustomerEmail("");
        showToast("success", "Signed out.");
    }, [showToast]);

    const checkoutAddress = useMemo(() => {
        const selected = addresses.find((a) => a.id === checkoutAddressId);
        if (selected) return selected;
        return addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
    }, [addresses, checkoutAddressId]);

    const cartCount = useMemo(() => Object.values(cart).reduce((sum, line) => sum + line.qty, 0), [cart]);
    const cartTotal = useMemo(
        () => Object.values(cart).reduce((sum, line) => sum + lineUnitPrice(line) * line.qty, 0),
        [cart]
    );

    const value: StoreValue = {
        cart,
        cartCount,
        cartTotal,
        addToCart,
        changeQty,
        removeLine,
        wishlist,
        toggleWishlist,
        addresses,
        addAddress,
        editAddress,
        removeAddress,
        setDefaultAddress,
        checkoutAddress,
        selectCheckoutAddress,
        isLoggedIn,
        customerName,
        customerEmail,
        signIn,
        signOut,
        showToast,
        activeModal,
        openModal,
        closeModal,
    };

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error("useStore must be used within a StoreProvider");
    return ctx;
}

export { PRODUCTS };
