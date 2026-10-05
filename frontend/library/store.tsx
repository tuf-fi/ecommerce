"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PRODUCTS, getProduct } from "./products";
import { customerLogout, customerSession, updateCustomerProfile } from "./api/auth";
import { ApiError } from "./api/client";
import { useProducts } from "./productsStore";

const STORAGE_KEY = "cindyrella_customer_store";

// What survives a refresh — not activeModal, which is intentionally session-only.
type PersistedStore = {
    cart: CartMap;
    wishlist: number[];
    addresses: Address[];
    checkoutAddressId: number | null;
};

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
    clearCart: () => void;

    wishlist: number[];
    toggleWishlist: (id: number) => void;

    addresses: Address[];
    addAddress: (label: string, text: string) => void;
    editAddress: (id: number, label: string, text: string) => void;
    removeAddress: (id: number) => void;
    setDefaultAddress: (id: number) => void;
    checkoutAddress: Address | null;
    selectCheckoutAddress: (id: number) => void;

    // Bumps when the product catalogue changes, so any component using useStore() re-renders with fresh PRODUCTS/getProduct data.
    catalogVersion: number;

    isLoggedIn: boolean;
    customerName: string;
    customerEmail: string;
    customerAvatar: string;
    signIn: (customer: { name: string; email: string; avatarUrl?: string | null }) => void;
    // Saves to the server, then updates the signed-in customer here. Resolves true on success.
    updateProfile: (patch: { name?: string; avatarUrl?: string | null }) => Promise<boolean>;
    signOut: () => void;

    showToast: (type: "success" | "error", message: string) => void;

    activeModal: ModalKey | null;
    openModal: (key: ModalKey) => void;
    closeModal: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const { version: catalogVersion } = useProducts();
    const [cart, setCart] = useState<CartMap>({});
    const [wishlist, setWishlist] = useState<number[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [checkoutAddressId, setCheckoutAddressId] = useState<number | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerAvatar, setCustomerAvatar] = useState("");
    const [activeModal, setActiveModal] = useState<ModalKey | null>(null);

    const showToast = useCallback((type: "success" | "error", message: string) => {
        if (type === "success") toast.success(message);
        else toast.error(message);
    }, []);

    const openModal = useCallback((key: ModalKey) => {
        setActiveModal(key);
    }, []);

    const closeModal = useCallback(() => {
        setActiveModal(null);
    }, []);

    // One-time hydration of a browser-only API at mount — can't be a derived/lazy-initial value (mirrors adminStore.tsx).
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const saved = JSON.parse(raw) as Partial<PersistedStore>;
                if (saved.cart) setCart(saved.cart);
                if (saved.wishlist) setWishlist(saved.wishlist);
                // Browsers that saved the old built-in demo address (it was never a customer's own) drop it here.
                if (saved.addresses) setAddresses(saved.addresses.filter((a) => !a.text.startsWith("221B Kalayaan Ave")));
                if (saved.checkoutAddressId !== undefined) setCheckoutAddressId(saved.checkoutAddressId);
            }
        } catch {
            // Corrupt/foreign localStorage value — start from the plain defaults already in state.
        }
        setHydrated(true);
    }, []);

    // The httpOnly cookie is the source of truth for sign-in; nothing auth-related is read from localStorage.
    useEffect(() => {
        customerSession()
            .then(({ customer }) => {
                setCustomerName(customer.name);
                setCustomerEmail(customer.email);
                setCustomerAvatar(customer.avatarUrl ?? "");
                setIsLoggedIn(true);
            })
            .catch(() => {
                // Not signed in (401) or API unreachable — stay signed out.
            });
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Persists on every change — cheap to over-write each commit; diffing isn't worth it for this little state.
    useEffect(() => {
        if (!hydrated) return; // Writing defaults before hydration would clobber saved data.
        try {
            const toSave: PersistedStore = {
                cart,
                wishlist,
                addresses,
                checkoutAddressId,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch {
            // Private-browsing/storage-full — losing persistence is better than crashing the app.
        }
    }, [hydrated, cart, wishlist, addresses, checkoutAddressId]);

    const addToCart = useCallback(
        (id: number, qty: number = 1, sizeId: string | null = null) => {
            const p = getProduct(id);
            if (!p) return;
            const size = sizeId ? p.sizes?.find((s) => s.id === sizeId) : undefined;
            if (sizeId && !size) return;
            const key = cartKey(id, sizeId);
            const current = cart[key]?.qty || 0;
            // Summed across every size variant of this product, not just the one being added, or the cap resets per size.
            // The server re-checks stock at checkout; this just stops the bag from filling with units that can't be bought.
            const available = size ? size.stock : p.sizes?.length ? 0 : p.stock;
            if (current + qty > available) {
                showToast("error", available <= 0 ? `"${p.title}" is out of stock.` : `Only ${available} of "${p.title}"${size ? ` (${size.label})` : ""} left.`);
                return;
            }
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
        [cart, showToast]
    );

    const changeQty = useCallback(
        (key: string, delta: number) => {
            setCart((c) => {
                const line = c[key];
                if (!line) return c;
                const nextQty = line.qty + delta;
                if (nextQty <= 0) {
                    const copy = { ...c };
                    delete copy[key];
                    return copy;
                }
                // Same per-product cap as addToCart, summed across every size variant, so the stepper can't be used to bypass it.
                if (delta > 0) {
                    const p = getProduct(line.productId);
                    const size = line.sizeId ? p?.sizes?.find((s) => s.id === line.sizeId) : undefined;
                    const available = size ? size.stock : p?.sizes?.length ? 0 : (p?.stock ?? 0);
                    if (nextQty > available) {
                        showToast("error", `Only ${available} of "${p?.title ?? "this item"}" left.`);
                        return c;
                    }
                    const currentForProduct = Object.values(c)
                        .filter((l) => l.productId === line.productId)
                        .reduce((sum, l) => sum + l.qty, 0);
                    if (currentForProduct + delta > MAX_PER_ITEM) {
                        showToast("error", `Only ${MAX_PER_ITEM} of "${p?.title ?? "this item"}" allowed per order.`);
                        return c;
                    }
                }
                return { ...c, [key]: { ...line, qty: nextQty } };
            });
        },
        [showToast]
    );

    const removeLine = useCallback((key: string) => {
        setCart((c) => {
            const copy = { ...c };
            delete copy[key];
            return copy;
        });
    }, []);

    const clearCart = useCallback(() => setCart({}), []);

    const toggleWishlist = useCallback(
        (id: number) => {
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
        [wishlist, showToast]
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
        ({ name, email, avatarUrl }: { name: string; email: string; avatarUrl?: string | null }) => {
            setCustomerName(name);
            setCustomerEmail(email);
            setCustomerAvatar(avatarUrl ?? "");
            setIsLoggedIn(true);
            setActiveModal(null);
            showToast("success", `Welcome, ${name}!`);
        },
        [showToast]
    );

    const signOut = useCallback(() => {
        customerLogout().catch(() => {});
        setIsLoggedIn(false);
        setCustomerName("");
        setCustomerEmail("");
        setCustomerAvatar("");
        showToast("success", "Signed out.");
    }, [showToast]);

    const updateProfile = useCallback(
        async (patch: { name?: string; avatarUrl?: string | null }) => {
            try {
                const { customer } = await updateCustomerProfile(patch);
                setCustomerName(customer.name);
                setCustomerAvatar(customer.avatarUrl ?? "");
                return true;
            } catch (err) {
                showToast("error", err instanceof ApiError ? err.message : "Couldn't save your profile. Please try again.");
                return false;
            }
        },
        [showToast]
    );

    const checkoutAddress = useMemo(() => {
        const selected = addresses.find((a) => a.id === checkoutAddressId);
        if (selected) return selected;
        return addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
    }, [addresses, checkoutAddressId]);

    const cartCount = useMemo(() => Object.values(cart).reduce((sum, line) => sum + line.qty, 0), [cart]);
    // Not memoized: unit prices come from the live catalogue, which changes outside React state.
    const cartTotal = Object.values(cart).reduce((sum, line) => sum + lineUnitPrice(line) * line.qty, 0);

    const value: StoreValue = {
        cart,
        cartCount,
        cartTotal,
        addToCart,
        changeQty,
        removeLine,
        clearCart,
        wishlist,
        toggleWishlist,
        addresses,
        addAddress,
        editAddress,
        removeAddress,
        setDefaultAddress,
        checkoutAddress,
        selectCheckoutAddress,
        catalogVersion,
        isLoggedIn,
        customerName,
        customerEmail,
        customerAvatar,
        updateProfile,
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
