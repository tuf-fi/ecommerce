"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import {
    AdminNotification,
    AdminOrder,
    AdminOrderStatus,
    AdminProduct,
    NavMenuItem,
    StaffMember,
    StockLogEntry,
} from "./admin/types";
import { ADMIN_PRODUCTS, stockStatus } from "./admin/products";
import { ADMIN_ORDERS } from "./admin/orders";
import { STAFF } from "./admin/staff";
import { NOTIFICATIONS } from "./admin/notifications";
import { NAV_MENU } from "./admin/content";

const SESSION_KEY = "cindyrella_admin_session";

type AdminStoreValue = {
    // Auth (placeholder only)
    // TODO: replace with real admin auth (JWT + httpOnly session, role check) once the backend exists.
    isAdminLoggedIn: boolean;
    authChecked: boolean;
    adminName: string;
    login: (email: string, password: string) => boolean;
    logout: () => void;

    // Products / inventory
    products: AdminProduct[];
    stockLog: StockLogEntry[];
    addProduct: (input: Omit<AdminProduct, "id">) => void;
    updateProduct: (id: number, patch: Partial<Omit<AdminProduct, "id">>) => void;
    deleteProduct: (id: number) => void;

    // Orders
    orders: AdminOrder[];
    updateOrderStatus: (orderNo: string, status: AdminOrderStatus) => void;

    // Staff
    staff: StaffMember[];
    addStaff: (input: Omit<StaffMember, "id">) => void;
    updateStaff: (id: number, patch: Partial<Omit<StaffMember, "id">>) => void;
    deleteStaff: (id: number) => void;

    // Notifications
    notifications: AdminNotification[];
    markNotificationRead: (id: number) => void;
    markAllNotificationsRead: () => void;

    // Navigation menu
    navMenu: NavMenuItem[];
    addNavItem: (input: Omit<NavMenuItem, "id">) => void;
    updateNavItem: (id: number, patch: Partial<Omit<NavMenuItem, "id">>) => void;
    deleteNavItem: (id: number) => void;
    moveNavItem: (id: number, direction: "up" | "down") => void;
};

const AdminStoreContext = createContext<AdminStoreValue | null>(null);

function nextId<T extends { id: number }>(list: T[]): number {
    return list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [adminName, setAdminName] = useState("");

    // One-time read of a browser-only API at mount to hydrate the session —
    // there's no way to know this before the client mounts, so this can't be
    // expressed as a derived/lazy-initial value the way most effects here are.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        const saved = window.localStorage.getItem(SESSION_KEY);
        if (saved) {
            setAdminName(saved);
            setIsAdminLoggedIn(true);
        }
        setAuthChecked(true);
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */

    const login = useCallback((email: string, password: string) => {
        if (!email.trim() || !password.trim()) return false;
        const name = email.split("@")[0].replace(/[._]/g, " ");
        const display = name.charAt(0).toUpperCase() + name.slice(1);
        window.localStorage.setItem(SESSION_KEY, display);
        setAdminName(display);
        setIsAdminLoggedIn(true);
        return true;
    }, []);

    const logout = useCallback(() => {
        window.localStorage.removeItem(SESSION_KEY);
        setIsAdminLoggedIn(false);
        setAdminName("");
        toast.success("Logged out.");
    }, []);

    const [products, setProducts] = useState<AdminProduct[]>(ADMIN_PRODUCTS);
    const [stockLog, setStockLog] = useState<StockLogEntry[]>([]);

    const logStock = useCallback((entry: Omit<StockLogEntry, "id" | "time">) => {
        setStockLog((log) => [{ id: nextId(log), time: "Just now", ...entry }, ...log]);
    }, []);

    const addProduct = useCallback(
        (input: Omit<AdminProduct, "id">) => {
            const product: AdminProduct = { ...input, id: nextId(products) };
            setProducts((p) => [product, ...p]);
            logStock({ type: "in", text: `${product.name} — added to catalogue (+${product.stock} units)` });
            toast.success(`"${product.name}" added to inventory.`);
        },
        [products, logStock]
    );

    const updateProduct = useCallback(
        (id: number, patch: Partial<Omit<AdminProduct, "id">>) => {
            setProducts((prev) => {
                const idx = prev.findIndex((p) => p.id === id);
                if (idx < 0) return prev;
                const old = prev[idx];
                const updated: AdminProduct = { ...old, ...patch };
                const next = [...prev];
                next[idx] = updated;
                if (updated.stock > old.stock) {
                    logStock({ type: "in", text: `${updated.name} — received new batch (+${updated.stock - old.stock} units)` });
                } else if (updated.stock < old.stock) {
                    logStock({ type: "out", text: `${updated.name} — stock reduced (-${old.stock - updated.stock} units)` });
                } else {
                    logStock({ type: "adj", text: `${updated.name} — details updated` });
                }
                return next;
            });
            toast.success("Product updated.");
        },
        [logStock]
    );

    const deleteProduct = useCallback(
        (id: number) => {
            setProducts((prev) => {
                const target = prev.find((p) => p.id === id);
                if (target) logStock({ type: "out", text: `${target.name} — removed from catalogue` });
                return prev.filter((p) => p.id !== id);
            });
            toast.success("Product removed.");
        },
        [logStock]
    );

    const [orders, setOrders] = useState<AdminOrder[]>(ADMIN_ORDERS);

    const updateOrderStatus = useCallback((orderNo: string, status: AdminOrderStatus) => {
        setOrders((prev) => prev.map((o) => (o.no === orderNo ? { ...o, status } : o)));
        toast.success(`Order ${orderNo} marked as ${status}.`);
    }, []);

    const [staff, setStaff] = useState<StaffMember[]>(STAFF);

    const addStaff = useCallback(
        (input: Omit<StaffMember, "id">) => {
            setStaff((s) => [...s, { ...input, id: nextId(s) }]);
            toast.success(`"${input.name}" added to staff.`);
        },
        []
    );

    const updateStaff = useCallback((id: number, patch: Partial<Omit<StaffMember, "id">>) => {
        setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
        toast.success("Staff account updated.");
    }, []);

    const deleteStaff = useCallback((id: number) => {
        setStaff((prev) => prev.filter((s) => s.id !== id));
        toast.success("Staff account removed.");
    }, []);

    const [notifications, setNotifications] = useState<AdminNotification[]>(NOTIFICATIONS);

    const markNotificationRead = useCallback((id: number) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }, []);

    const markAllNotificationsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const [navMenu, setNavMenu] = useState<NavMenuItem[]>(NAV_MENU);

    const addNavItem = useCallback((input: Omit<NavMenuItem, "id">) => {
        setNavMenu((n) => [...n, { ...input, id: nextId(n) }]);
        toast.success("Menu item added.");
    }, []);

    const updateNavItem = useCallback((id: number, patch: Partial<Omit<NavMenuItem, "id">>) => {
        setNavMenu((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
        toast.success("Menu item updated.");
    }, []);

    const deleteNavItem = useCallback((id: number) => {
        setNavMenu((prev) => prev.filter((n) => n.id !== id));
        toast.success("Menu item removed.");
    }, []);

    const moveNavItem = useCallback((id: number, direction: "up" | "down") => {
        setNavMenu((prev) => {
            const idx = prev.findIndex((n) => n.id === id);
            const swapWith = direction === "up" ? idx - 1 : idx + 1;
            if (idx < 0 || swapWith < 0 || swapWith >= prev.length) return prev;
            const next = [...prev];
            [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
            return next;
        });
    }, []);

    const value: AdminStoreValue = {
        isAdminLoggedIn,
        authChecked,
        adminName,
        login,
        logout,
        products,
        stockLog,
        addProduct,
        updateProduct,
        deleteProduct,
        orders,
        updateOrderStatus,
        staff,
        addStaff,
        updateStaff,
        deleteStaff,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        navMenu,
        addNavItem,
        updateNavItem,
        deleteNavItem,
        moveNavItem,
    };

    return <AdminStoreContext.Provider value={value}>{children}</AdminStoreContext.Provider>;
}

export function useAdminStore() {
    const ctx = useContext(AdminStoreContext);
    if (!ctx) throw new Error("useAdminStore must be used within an AdminProvider");
    return ctx;
}

export { stockStatus };
