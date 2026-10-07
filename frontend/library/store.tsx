"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PRODUCTS, getProduct, currentPrice } from "./products";
import { customerLogout, customerSession, updateCustomerProfile } from "./api/auth";
import { API_BASE_URL, ApiError } from "./api/client";
import { MOCK_API } from "./mock/config";
import { addToWishlist, createAddress, customerLogoutAll, deleteAddress, listAddresses, listMyNotifications, markMyNotificationsRead, mergeWishlist, removeFromWishlist, updateAddress, type CustomerNotification } from "./api/customer";
import { useProducts } from "./productsStore";
import { playDing, unlockAudio } from "./notificationSound";

const STORAGE_KEY = "cindyrella_customer_store";
const SOUND_KEY = "cindyrella_notification_sound";

// What survives a refresh — not activeModal, which is intentionally session-only.
type PersistedStore = {
    cart: CartMap;
    wishlist: number[];
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
    return currentPrice(size ?? p);
}

type StoreValue = {
    cart: CartMap;
    cartCount: number;
    cartTotal: number;
    addToCart: (id: number, qty?: number, sizeId?: string | null) => void;
    changeQty: (key: string, delta: number) => void;
    removeLine: (key: string) => void;
    removeLines: (keys: string[]) => void;
    clearCart: () => void;
    // The bag lines the customer ticked in the cart, carried to the checkout page.
    checkoutKeys: string[];
    setCheckoutKeys: (keys: string[]) => void;

    wishlist: number[];
    toggleWishlist: (id: number) => void;

    addresses: Address[];
    // Saved on the server for signed-in customers (so they follow the person to any device).
    addAddress: (label: string, text: string) => Promise<void>;
    editAddress: (id: number, label: string, text: string) => Promise<void>;
    removeAddress: (id: number) => Promise<void>;
    setDefaultAddress: (id: number) => Promise<void>;
    checkoutAddress: Address | null;
    selectCheckoutAddress: (id: number) => void;

    // Bumps when the product catalogue changes, so any component using useStore() re-renders with fresh PRODUCTS/getProduct data.
    catalogVersion: number;

    isLoggedIn: boolean;
    notifications: CustomerNotification[];
    unreadNotifications: number;
    // Bumps whenever a notification arrives live, so a page showing its own copy of the list can reload it.
    notificationVersion: number;
    soundEnabled: boolean;
    setSoundEnabled: (on: boolean) => void;
    // Notifications that just arrived, shown as pop-ups in the corner until dismissed or faded out.
    liveNotifications: CustomerNotification[];
    dismissLiveNotification: (id: number) => void;
    markNotificationRead: (id: number) => void;
    markAllNotificationsRead: () => void;
    // False until the first sign-in check finishes, so pages can tell "not signed in" from "still checking".
    sessionChecked: boolean;
    customerName: string;
    customerEmail: string;
    customerAvatar: string;
    signIn: (customer: { name: string; email: string; avatarUrl?: string | null }) => void;
    // Saves to the server, then updates the signed-in customer here. Resolves true on success.
    updateProfile: (patch: { name?: string; avatarUrl?: string | null }) => Promise<boolean>;
    signOut: () => void;
    // Ends every login of this customer on every device, including this one.
    signOutEverywhere: () => Promise<void>;

    showToast: (type: "success" | "error", message: string) => void;

    activeModal: ModalKey | null;
    openModal: (key: ModalKey) => void;
    closeModal: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const { version: catalogVersion } = useProducts();
    const [cart, setCart] = useState<CartMap>({});
    const [checkoutKeys, setCheckoutKeys] = useState<string[]>([]);
    const [wishlist, setWishlist] = useState<number[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [checkoutAddressId, setCheckoutAddressId] = useState<number | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [sessionChecked, setSessionChecked] = useState(false);
    const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [liveNotifications, setLiveNotifications] = useState<CustomerNotification[]>([]);
    const [notificationVersion, setNotificationVersion] = useState(0);
    const [soundEnabled, setSoundEnabledState] = useState(true);
    const soundRef = useRef(true);

    // The sound preference lives in this browser; the first click/tap/keypress also unlocks audio so later dings can play.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        try {
            if (localStorage.getItem(SOUND_KEY) === "off") {
                soundRef.current = false;
                setSoundEnabledState(false);
            }
        } catch {
            // Storage blocked: keep the default (sound on).
        }
        const unlock = () => {
            unlockAudio();
            window.removeEventListener("pointerdown", unlock);
            window.removeEventListener("keydown", unlock);
        };
        window.addEventListener("pointerdown", unlock);
        window.addEventListener("keydown", unlock);
        return () => {
            window.removeEventListener("pointerdown", unlock);
            window.removeEventListener("keydown", unlock);
        };
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */

    const setSoundEnabled = useCallback((on: boolean) => {
        soundRef.current = on;
        setSoundEnabledState(on);
        try {
            localStorage.setItem(SOUND_KEY, on ? "on" : "off");
        } catch {
            // Storage blocked: the choice lasts until the page is closed.
        }
    }, []);
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
            })
            .finally(() => setSessionChecked(true));
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Once signed in, the server's copy takes over: saved addresses are loaded, and whatever wishlist the browser held as a
    // visitor is merged into the customer's own (nothing saved before signing in is lost).
    useEffect(() => {
        if (!isLoggedIn) return;
        let alive = true;
        let local: number[] = [];
        try {
            local = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").wishlist ?? [];
        } catch {
            // Unreadable storage: just use the server's list.
        }
        mergeWishlist(local)
            .then((ids) => alive && setWishlist(ids))
            .catch(() => {});
        listAddresses()
            .then((list) => alive && setAddresses(list))
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [isLoggedIn]);

    // The bell is refreshed on sign-in, every minute, and when the tab regains focus.
    useEffect(() => {
        if (!isLoggedIn) return;
        let alive = true;
        const load = () =>
            listMyNotifications()
                .then((r) => {
                    if (!alive) return;
                    setNotifications(r.notifications);
                    setUnreadNotifications(r.unread);
                })
                .catch(() => {});
        void load();
        // New ones arrive the moment they are created (server-sent events); the refresh below is only a safety net.
        // No live stream in mock mode; the periodic refresh below still runs.
        const source = MOCK_API ? null : new EventSource(`${API_BASE_URL}/my/notifications/stream`, { withCredentials: true });
        source?.addEventListener("notification", (e) => {
            if (!alive) return;
            const n = JSON.parse((e as MessageEvent<string>).data) as CustomerNotification;
            setNotifications((list) => [n, ...list.filter((x) => x.id !== n.id)]);
            setUnreadNotifications((c) => c + 1);
            setNotificationVersion((v) => v + 1);
            setLiveNotifications((list) => [n, ...list.filter((x) => x.id !== n.id)].slice(0, 3));
            if (soundRef.current) playDing();
        });
        // A dropped connection reconnects by itself; reload on reconnect to pick up anything sent in the gap.
        let opened = false;
        if (source) {
            source.onopen = () => {
                if (opened) void load();
                opened = true;
            };
        }
        const timer = setInterval(load, 60_000);
        const onFocus = () => void load();
        window.addEventListener("focus", onFocus);
        return () => {
            alive = false;
            source?.close();
            clearInterval(timer);
            window.removeEventListener("focus", onFocus);
        };
    }, [isLoggedIn]);

    const dismissLiveNotification = useCallback((id: number) => {
        setLiveNotifications((list) => list.filter((n) => n.id !== id));
    }, []);

    const markNotificationRead = useCallback((id: number) => {
        setNotifications((list) => list.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n)));
        setUnreadNotifications((c) => Math.max(0, c - 1));
        markMyNotificationsRead([id]).catch(() => {});
    }, []);

    const markAllNotificationsRead = useCallback(() => {
        setNotifications((list) => list.map((n) => ({ ...n, read: true })));
        setUnreadNotifications(0);
        markMyNotificationsRead().catch(() => {});
    }, []);

    // Persists on every change — cheap to over-write each commit; diffing isn't worth it for this little state.
    useEffect(() => {
        if (!hydrated) return; // Writing defaults before hydration would clobber saved data.
        try {
            const toSave: PersistedStore = {
                cart,
                wishlist,
                checkoutAddressId,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch {
            // Private-browsing/storage-full — losing persistence is better than crashing the app.
        }
    }, [hydrated, cart, wishlist, checkoutAddressId]);

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

    const removeLines = useCallback((keys: string[]) => {
        setCart((c) => {
            const copy = { ...c };
            for (const k of keys) delete copy[k];
            return copy;
        });
    }, []);

    const clearCart = useCallback(() => setCart({}), []);

    const toggleWishlist = useCallback(
        (id: number) => {
            const p = getProduct(id);
            const idx = wishlist.indexOf(id);
            const had = idx > -1;
            setWishlist(had ? wishlist.filter((x) => x !== id) : [...wishlist, id]);
            showToast("success", had ? `Removed "${p?.title ?? "item"}" from wishlist.` : `Saved "${p?.title ?? "item"}" to your wishlist.`);
            if (isLoggedIn) {
                (had ? removeFromWishlist(id) : addToWishlist(id)).catch(() => {
                    // Put it back the way it was and say so.
                    setWishlist((w) => (had ? [...w, id] : w.filter((x) => x !== id)));
                    showToast("error", "Couldn't save that to your account. Please try again.");
                });
            }
        },
        [wishlist, showToast, isLoggedIn]
    );

    const addressError = (err: unknown) => showToast("error", err instanceof ApiError ? err.message : "Couldn't save your address. Please try again.");

    // Every change is made on the server and then the list is re-read, so what's shown is always what's saved.
    const addAddress = useCallback(
        async (label: string, text: string) => {
            try {
                await createAddress({ label, text });
                setAddresses(await listAddresses());
            } catch (err) {
                addressError(err);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- addressError only closes over showToast
        [showToast]
    );

    const editAddress = useCallback(
        async (id: number, label: string, text: string) => {
            try {
                await updateAddress(id, { label, text });
                setAddresses(await listAddresses());
            } catch (err) {
                addressError(err);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- addressError only closes over showToast
        [showToast]
    );

    const removeAddress = useCallback(
        async (id: number) => {
            try {
                await deleteAddress(id);
                setAddresses(await listAddresses());
            } catch (err) {
                addressError(err);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- addressError only closes over showToast
        [showToast]
    );

    const setDefaultAddress = useCallback(
        async (id: number) => {
            try {
                await updateAddress(id, { isDefault: true });
                setAddresses(await listAddresses());
            } catch (err) {
                addressError(err);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- addressError only closes over showToast
        [showToast]
    );

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

    // Forget everything personal in this browser: a shared computer shouldn't keep the last customer's addresses or wishlist.
    const forgetCustomer = useCallback(() => {
        setIsLoggedIn(false);
        setCustomerName("");
        setCustomerEmail("");
        setCustomerAvatar("");
        setAddresses([]);
        setWishlist([]);
        setCheckoutAddressId(null);
        setNotifications([]);
        setUnreadNotifications(0);
        setLiveNotifications([]);
    }, []);

    const signOut = useCallback(() => {
        customerLogout().catch(() => {});
        forgetCustomer();
        showToast("success", "Signed out.");
    }, [forgetCustomer, showToast]);

    const signOutEverywhere = useCallback(async () => {
        try {
            await customerLogoutAll();
            forgetCustomer();
            showToast("success", "Signed out of all devices.");
        } catch {
            showToast("error", "Couldn't sign you out everywhere. Please try again.");
        }
    }, [forgetCustomer, showToast]);

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
        removeLines,
        clearCart,
        checkoutKeys,
        setCheckoutKeys,
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
        notifications,
        unreadNotifications,
        notificationVersion,
        soundEnabled,
        setSoundEnabled,
        liveNotifications,
        dismissLiveNotification,
        markNotificationRead,
        markAllNotificationsRead,
        sessionChecked,
        customerName,
        customerEmail,
        customerAvatar,
        updateProfile,
        signIn,
        signOutEverywhere,
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
