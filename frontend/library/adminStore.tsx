"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import {
    AdminNotification,
    AdminOrder,
    AdminOrderStatus,
    AdminProduct,
    AdminUser,
    StaffMember,
    StockLogEntry,
} from "./admin/types";
import {
    ADMIN_PRODUCTS,
    stockStatus,
    productStock,
    productStockStatus,
    productPriceRange,
    isExpiringSoon,
    daysUntilExpiry,
    EXPIRY_WARNING_DAYS,
} from "./admin/products";
import { ADMIN_ORDERS } from "./admin/orders";
import { STAFF } from "./admin/staff";
import { ADMIN_USERS } from "./admin/users";
import { NOTIFICATIONS } from "./admin/notifications";

const SESSION_KEY = "cindyrella_admin_session";

// Shared by AdminSidebar, the panel layout, and the settings sub-nav layout —
// all three position themselves relative to the sidebar's current width, so
// there's exactly one place that width can be defined.
export const SIDEBAR_WIDTH_EXPANDED = 240;
export const SIDEBAR_WIDTH_COLLAPSED = 68;

// Mirrors the localStorage session into a cookie of the same name — Proxy
// (frontend/proxy.ts) gates /admin/* routes on this cookie, since Proxy runs
// on the server and has no access to localStorage. A 7-day expiry so a
// long-idle browser tab naturally falls back to requiring login again;
// re-set on every load (see the hydration effect below) so an active session
// never silently expires out from under a signed-in admin.
function setSessionCookie(value: string) {
    document.cookie = `${SESSION_KEY}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

function clearSessionCookie() {
    document.cookie = `${SESSION_KEY}=; path=/; max-age=0`;
}

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
    bulkDeleteProducts: (ids: number[]) => void;

    // Orders
    orders: AdminOrder[];
    updateOrderStatus: (orderNo: string, status: AdminOrderStatus) => void;
    bulkUpdateOrderStatus: (orderNos: string[], status: AdminOrderStatus) => void;

    // Staff
    staff: StaffMember[];
    addStaff: (input: Omit<StaffMember, "id">) => void;
    updateStaff: (id: number, patch: Partial<Omit<StaffMember, "id">>) => void;
    deleteStaff: (id: number) => void;
    // Returns how many were actually removed vs. blocked (last-Administrator
    // guard), so the caller can report a specific outcome instead of the
    // single toast this function already fires for the common case.
    bulkDeleteStaff: (ids: number[]) => { removed: number; blocked: number };

    // Registered storefront customers
    users: AdminUser[];

    // Notifications
    notifications: AdminNotification[];
    markNotificationRead: (id: number) => void;
    markAllNotificationsRead: () => void;

    // Sidebar UI state — a per-session preference, not persisted content.
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;

    // Off-canvas sidebar drawer on narrow viewports — always starts closed,
    // independent of `sidebarCollapsed` (which only applies to the desktop
    // fixed-width sidebar).
    mobileSidebarOpen: boolean;
    openMobileSidebar: () => void;
    closeMobileSidebar: () => void;
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
            setSessionCookie(saved);
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
        setSessionCookie(display);
        setAdminName(display);
        setIsAdminLoggedIn(true);
        return true;
    }, []);

    const logout = useCallback(() => {
        window.localStorage.removeItem(SESSION_KEY);
        clearSessionCookie();
        setIsAdminLoggedIn(false);
        setAdminName("");
        toast.success("Logged out.");
    }, []);

    const [products, setProducts] = useState<AdminProduct[]>(ADMIN_PRODUCTS);
    const [stockLog, setStockLog] = useState<StockLogEntry[]>([]);

    const logStock = useCallback(
        (entry: Omit<StockLogEntry, "id" | "time" | "actor">) => {
            setStockLog((log) => [
                {
                    id: nextId(log),
                    time: new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
                    actor: adminName || "System",
                    ...entry,
                },
                ...log,
            ]);
        },
        [adminName]
    );

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
            const old = products.find((p) => p.id === id);
            if (!old) return;
            const updated: AdminProduct = { ...old, ...patch };
            setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
            if (updated.stock > old.stock) {
                logStock({ type: "in", text: `${updated.name} — received new batch (+${updated.stock - old.stock} units)` });
            } else if (updated.stock < old.stock) {
                logStock({ type: "out", text: `${updated.name} — stock reduced (-${old.stock - updated.stock} units)` });
            } else {
                logStock({ type: "adj", text: `${updated.name} — details updated` });
            }
            toast.success("Product updated.");
        },
        [products, logStock]
    );

    const deleteProduct = useCallback(
        (id: number) => {
            const target = products.find((p) => p.id === id);
            setProducts((prev) => prev.filter((p) => p.id !== id));
            if (target) logStock({ type: "out", text: `${target.name} — removed from catalogue` });
            toast.success("Product removed.");
        },
        [products, logStock]
    );

    const bulkDeleteProducts = useCallback(
        (ids: number[]) => {
            const idSet = new Set(ids);
            const targets = products.filter((p) => idSet.has(p.id));
            if (targets.length === 0) return;
            setProducts((prev) => prev.filter((p) => !idSet.has(p.id)));
            for (const t of targets) logStock({ type: "out", text: `${t.name} — removed from catalogue` });
            toast.success(`${targets.length} product${targets.length === 1 ? "" : "s"} removed.`);
        },
        [products, logStock]
    );

    const [orders, setOrders] = useState<AdminOrder[]>(ADMIN_ORDERS);

    const updateOrderStatus = useCallback((orderNo: string, status: AdminOrderStatus) => {
        setOrders((prev) => prev.map((o) => (o.no === orderNo ? { ...o, status } : o)));
        toast.success(`Order ${orderNo} marked as ${status}.`);
    }, []);

    const bulkUpdateOrderStatus = useCallback((orderNos: string[], status: AdminOrderStatus) => {
        if (orderNos.length === 0) return;
        const noSet = new Set(orderNos);
        setOrders((prev) => prev.map((o) => (noSet.has(o.no) ? { ...o, status } : o)));
        toast.success(`${orderNos.length} order${orderNos.length === 1 ? "" : "s"} marked as ${status}.`);
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

    const deleteStaff = useCallback(
        (id: number) => {
            const target = staff.find((s) => s.id === id);
            if (!target) return;
            // Guard the last remaining Administrator — losing every admin
            // account would lock the whole panel out with no one left who
            // can grant access back. Mirrors StaffPage's own pre-check (which
            // is what actually stops the ConfirmModal from opening); this is
            // a second line of defense in case deleteStaff is ever called
            // from somewhere else.
            const remainingAdmins = staff.filter((s) => s.role === "Administrator").length;
            if (target.role === "Administrator" && remainingAdmins <= 1) {
                toast.error(`"${target.name}" is the last Administrator and can't be removed.`);
                return;
            }
            setStaff((prev) => prev.filter((s) => s.id !== id));
            toast.success("Staff account removed.");
        },
        [staff]
    );

    const bulkDeleteStaff = useCallback(
        (ids: number[]) => {
            const idSet = new Set(ids);
            const targets = staff.filter((s) => idSet.has(s.id));
            // Same last-Administrator guard as deleteStaff, applied in order so a
            // batch that includes every Administrator still leaves exactly one.
            let remainingAdmins = staff.filter((s) => s.role === "Administrator").length;
            const removed: StaffMember[] = [];
            const blocked: StaffMember[] = [];
            for (const target of targets) {
                if (target.role === "Administrator" && remainingAdmins <= 1) {
                    blocked.push(target);
                    continue;
                }
                if (target.role === "Administrator") remainingAdmins -= 1;
                removed.push(target);
            }
            if (removed.length > 0) {
                const removedIds = new Set(removed.map((r) => r.id));
                setStaff((prev) => prev.filter((s) => !removedIds.has(s.id)));
            }
            if (removed.length > 0 && blocked.length === 0) {
                toast.success(`${removed.length} staff account${removed.length === 1 ? "" : "s"} removed.`);
            } else if (removed.length > 0 && blocked.length > 0) {
                toast.success(`${removed.length} removed; ${blocked.length} kept (last Administrator can't be removed).`);
            } else if (blocked.length > 0) {
                toast.error(`Can't remove the last Administrator${blocked.length > 1 ? "s" : ""}.`);
            }
            return { removed: removed.length, blocked: blocked.length };
        },
        [staff]
    );

    // Read-only for now — the panel only reports on signups; account CRUD
    // belongs to the customer-facing auth system, not the admin store.
    const [users] = useState<AdminUser[]>(ADMIN_USERS);

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const toggleSidebar = useCallback(() => setSidebarCollapsed((c) => !c), []);

    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const openMobileSidebar = useCallback(() => setMobileSidebarOpen(true), []);
    const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

    const [notifications, setNotifications] = useState<AdminNotification[]>(NOTIFICATIONS);

    const markNotificationRead = useCallback((id: number) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }, []);

    const markAllNotificationsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
        bulkDeleteProducts,
        orders,
        updateOrderStatus,
        bulkUpdateOrderStatus,
        staff,
        addStaff,
        updateStaff,
        deleteStaff,
        bulkDeleteStaff,
        users,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        sidebarCollapsed,
        toggleSidebar,
        mobileSidebarOpen,
        openMobileSidebar,
        closeMobileSidebar,
    };

    return <AdminStoreContext.Provider value={value}>{children}</AdminStoreContext.Provider>;
}

export function useAdminStore() {
    const ctx = useContext(AdminStoreContext);
    if (!ctx) throw new Error("useAdminStore must be used within an AdminProvider");
    return ctx;
}

export { stockStatus, productStock, productStockStatus, productPriceRange, isExpiringSoon, daysUntilExpiry, EXPIRY_WARNING_DAYS };
