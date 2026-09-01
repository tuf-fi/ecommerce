"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import { PRODUCTS, getProduct } from "./products";

export type ModalKey =
    | "product"
    | "login"
    | "welcome"
    | "quiz";

export type Address = { id: number; label: string; text: string; isDefault: boolean };

type CartMap = Record<number, number>;

const MAX_PER_ITEM = 6;

type StoreValue = {
    cart: CartMap;
    cartCount: number;
    cartTotal: number;
    addToCart: (id: number, qty?: number) => void;
    changeQty: (id: number, delta: number) => void;
    removeLine: (id: number) => void;

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
    activeProductId: number | null;
    openModal: (key: ModalKey, productId?: number) => void;
    closeModal: () => void;
    openProduct: (id: number) => void;
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
    const [activeProductId, setActiveProductId] = useState<number | null>(null);

    const showToast = useCallback((type: "success" | "error", message: string) => {
        if (type === "success") toast.success(message);
        else toast.error(message);
    }, []);

    const openModal = useCallback((key: ModalKey, productId?: number) => {
        setActiveModal(key);
        if (productId !== undefined) setActiveProductId(productId);
    }, []);

    const closeModal = useCallback(() => setActiveModal(null), []);

    const openProduct = useCallback((id: number) => {
        setActiveProductId(id);
        setActiveModal("product");
    }, []);

    const addToCart = useCallback(
        (id: number, qty: number = 1) => {
            if (!isLoggedIn) {
                openModal("login");
                showToast("error", "Sign in to add items to your bag.");
                return;
            }
            const p = getProduct(id);
            if (!p) return;
            const current = cart[id] || 0;
            if (current + qty > MAX_PER_ITEM) {
                showToast("error", `Only ${MAX_PER_ITEM} of "${p.title}" allowed per order.`);
                return;
            }
            setCart({ ...cart, [id]: current + qty });
            showToast("success", `Added "${p.title}" to your bag.`);
        },
        [cart, isLoggedIn, openModal, showToast]
    );

    const changeQty = useCallback((id: number, delta: number) => {
        setCart((c) => {
            const next = (c[id] || 0) + delta;
            const copy = { ...c };
            if (next <= 0) delete copy[id];
            else copy[id] = next;
            return copy;
        });
    }, []);

    const removeLine = useCallback((id: number) => {
        setCart((c) => {
            const copy = { ...c };
            delete copy[id];
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

    const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);
    const cartTotal = useMemo(
        () => Object.entries(cart).reduce((sum, [id, qty]) => sum + (getProduct(Number(id))?.price ?? 0) * qty, 0),
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
        activeProductId,
        openModal,
        closeModal,
        openProduct,
    };

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error("useStore must be used within a StoreProvider");
    return ctx;
}

export { PRODUCTS };
