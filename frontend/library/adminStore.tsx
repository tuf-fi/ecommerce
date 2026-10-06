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
    stockStatus,
    productStock,
    productStockStatus,
    productPriceRange,
    isExpiringSoon,
    daysUntilExpiry,
    EXPIRY_WARNING_DAYS,
} from "./admin/products";
import { importOrderStatuses, listAllOrders, recordRefund, reviewPaymentProof, setOrderStatus, toAdminOrder } from "./api/orders";
import { adminLoginTwoFactor } from "./api/auth";
import { createStaff, deleteStaff as deleteStaffById, listCustomers, listNotifications, listStaff, markNotificationsRead, StaffInput, StaffPatch, updateStaff as updateStaffById } from "./api/admin";
import { adminLogin, adminLogout, adminSession, SessionStaff } from "./api/auth";
import {
    adjustStock,
    createProduct,
    deleteProductById,
    listAdminProducts,
    listStockLog,
    ProductPayload,
    StockReason,
    toAdminProduct,
    updateProductDetails,
} from "./api/products";
import { ApiError } from "./api/client";
import { useProducts } from "./productsStore";
import { errorMessage, isServerId, isUnsavedPhoto, persistableImage, sizesPayload, toCreatePayload } from "./adminStoreProducts";

// Shared by AdminSidebar, the panel layout, and the settings sub-nav — one place the sidebar width can be defined.
export const SIDEBAR_WIDTH_EXPANDED = 240;
export const SIDEBAR_WIDTH_COLLAPSED = 68;

// ContentEditorShell's own fixed rail width (expanded/collapsed) — reserved locally via CSS margin, not coordinated through this store.
export const CONTENT_PANEL_WIDTH_EXPANDED = 360;
export const CONTENT_PANEL_WIDTH_COLLAPSED = 56;

// Kept alongside the sidebar/panel widths so every fixed-position admin layout measurement lives in one place; Settings' sub-nav uses this too.
export const SETTINGS_NAV_WIDTH = 264;
// Clears AdminTopbar's rendered height so a layout below it (Settings' fixed sub-nav) starts flush with no gap.
export const ADMIN_TOPBAR_HEIGHT = 86;

export type LoginOutcome = { status: "ok" } | { status: "twoFactor"; challenge: string } | { status: "error"; message: string };

type AdminStoreValue = {
    isAdminLoggedIn: boolean;
    authChecked: boolean;
    adminName: string;
    // The signed-in staff member's id.
    currentStaffId: number | null;
    // Recomputed every render so it never goes stale; COSMETIC ONLY — hides/disables actions, not a real security boundary (see auth TODO).
    currentStaffMember: StaffMember | null;
    // "twoFactor" means the password was right but a code is still needed: pass the challenge to completeTwoFactor.
    login: (email: string, password: string) => Promise<LoginOutcome>;
    completeTwoFactor: (challenge: string, code: string) => Promise<string | null>;
    twoFactorEnabled: boolean;
    // Re-reads the signed-in staff member from the server (e.g. after turning 2FA on or off).
    reloadSession: () => Promise<void>;
    logout: () => void;

    // Products / inventory
    products: AdminProduct[];
    stockLog: StockLogEntry[];
    // Resolve to true when saved, so a form can stay open on failure. Stock only changes via an explicit reason (see updateProduct).
    addProduct: (input: Omit<AdminProduct, "id">) => Promise<boolean>;
    bulkAddProducts: (inputs: Omit<AdminProduct, "id">[]) => Promise<void>;
    updateProduct: (id: number, patch: Partial<Omit<AdminProduct, "id">>, stockReason?: StockReason) => Promise<boolean>;
    deleteProduct: (id: number) => Promise<void>;
    bulkDeleteProducts: (ids: number[]) => Promise<void>;
    bulkAdjustProducts: (ids: number[], adjust: { stockDelta?: number; setPrice?: number }) => Promise<void>;
    // Bumps when the storefront catalogue changes so useAdminStore() consumers re-render with fresh PRODUCTS data.
    catalogVersion: number;

    // Orders
    orders: AdminOrder[];
    // The server enforces the allowed status moves and puts units back in stock on cancellation.
    updateOrderStatus: (orderNo: string, status: AdminOrderStatus) => Promise<void>;
    bulkUpdateOrderStatus: (orderNos: string[], status: AdminOrderStatus) => Promise<void>;
    // Applies a CSV of Order,Status rows; resolves to how many changed and why the others were skipped.
    importOrders: (file: File) => Promise<{ updated: number; skipped: string[] } | null>;
    // Approving marks the order Paid; rejecting needs a reason the customer will see. Resolves true when saved.
    reviewPayment: (orderNo: string, proofId: number, input: { decision: "approve" } | { decision: "reject"; reason: string }) => Promise<boolean>;
    // Administrators only: records money already sent back to the customer by hand.
    refundOrder: (orderNo: string, input: { amount: number; note?: string }) => Promise<boolean>;

    // Staff
    staff: StaffMember[];
    // Real accounts. The server refuses the unsafe cases (your own account, the last administrator) and these resolve false/blocked then.
    addStaff: (input: StaffInput) => Promise<boolean>;
    updateStaff: (id: number, patch: StaffPatch) => Promise<boolean>;
    deleteStaff: (id: number) => Promise<void>;
    bulkDeleteStaff: (ids: number[]) => Promise<{ removed: number; blocked: number }>;

    // Registered storefront customers
    users: AdminUser[];

    // Notifications
    notifications: AdminNotification[];
    markNotificationRead: (id: string) => void;
    markAllNotificationsRead: () => void;

    // Sidebar UI state — a per-session preference, not persisted content.
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;

    // Off-canvas sidebar drawer on narrow viewports — always starts closed, independent of `sidebarCollapsed` (desktop-only).
    mobileSidebarOpen: boolean;
    openMobileSidebar: () => void;
    closeMobileSidebar: () => void;
};

const AdminStoreContext = createContext<AdminStoreValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const { version: catalogVersion, refresh: refreshCatalog } = useProducts();
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [adminName, setAdminName] = useState("");
    const [currentStaffId, setCurrentStaffId] = useState<number | null>(null);
    const [sessionStaff, setSessionStaff] = useState<SessionStaff | null>(null);
    const [staff, setStaff] = useState<StaffMember[]>([]);

    const applySession = useCallback(
        (member: SessionStaff) => {
            setSessionStaff(member);
            setAdminName(member.name);
            setIsAdminLoggedIn(true);
            setCurrentStaffId(member.id);
        },
        []
    );

    // The httpOnly cookie is the source of truth; ask the server who (if anyone) is signed in.
    useEffect(() => {
        adminSession()
            .then(({ staff: member }) => applySession(member))
            .catch(() => {
                // Not signed in (401) or API unreachable — stay signed out.
            })
            .finally(() => setAuthChecked(true));
    }, [applySession]);

    const login = useCallback(
        async (email: string, password: string) => {
            try {
                const result = await adminLogin({ email, password });
                if ("twoFactorRequired" in result) return { status: "twoFactor", challenge: result.challenge } as const;
                applySession(result.staff);
                return { status: "ok" } as const;
            } catch (err) {
                return { status: "error", message: err instanceof ApiError ? err.message : "Could not reach the server. Please try again." } as const;
            }
        },
        [applySession]
    );

    const completeTwoFactor = useCallback(
        async (challenge: string, code: string) => {
            try {
                const { staff: member } = await adminLoginTwoFactor({ challenge, code });
                applySession(member);
                return null;
            } catch (err) {
                return err instanceof ApiError ? err.message : "Could not reach the server. Please try again.";
            }
        },
        [applySession]
    );

    const reloadSession = useCallback(async () => {
        try {
            const { staff: member } = await adminSession();
            applySession(member);
        } catch {
            // Session gone — the auth gate will bounce to the login page.
        }
    }, [applySession]);

    const logout = useCallback(() => {
        adminLogout().catch(() => {});
        setCurrentStaffId(null);
        setSessionStaff(null);
        setIsAdminLoggedIn(false);
        setAdminName("");
        toast.success("Logged out.");
    }, []);

    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [stockLog, setStockLog] = useState<StockLogEntry[]>([]);

    // Pulls the authoritative product list and stock log from the API, and refreshes the storefront's catalogue too.
    const reloadInventory = useCallback(async () => {
        try {
            const [{ products: list }, log] = await Promise.all([listAdminProducts(), listStockLog()]);
            setProducts(list.map(toAdminProduct));
            setStockLog(log);
        } catch (err) {
            toast.error(errorMessage(err));
        }
        await refreshCatalog();
    }, [refreshCatalog]);

    useEffect(() => {
        // Loads server data once signed in; the state updates happen after the awaited fetch, not synchronously.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (isAdminLoggedIn) void reloadInventory();
    }, [isAdminLoggedIn, reloadInventory]);

    const addProduct = useCallback(
        async (input: Omit<AdminProduct, "id">) => {
            try {
                const { product } = await createProduct(toCreatePayload(input));
                await reloadInventory();
                toast.success(`"${product.name}" added to inventory.`);
                if (isUnsavedPhoto(input.image)) toast.message("Photo not saved — image upload arrives with Cloudinary.");
                return true;
            } catch (err) {
                toast.error(errorMessage(err));
                return false;
            }
        },
        [reloadInventory]
    );

    // One toast for the whole batch (used by CSV import), instead of one per row.
    const bulkAddProducts = useCallback(
        async (inputs: Omit<AdminProduct, "id">[]) => {
            if (inputs.length === 0) return;
            let added = 0;
            let lastError = "";
            for (const input of inputs) {
                try {
                    await createProduct(toCreatePayload(input));
                    added++;
                } catch (err) {
                    lastError = errorMessage(err);
                }
            }
            await reloadInventory();
            if (added > 0) toast.success(`${added} product${added === 1 ? "" : "s"} imported.`);
            if (added < inputs.length) toast.error(`${inputs.length - added} failed to import: ${lastError}`);
        },
        [reloadInventory]
    );

    // Details and stock are saved separately: stock only ever changes through an explicit, reasoned adjustment.
    const updateProduct = useCallback(
        async (id: number, patch: Partial<Omit<AdminProduct, "id">>, stockReason?: StockReason) => {
            const old = products.find((p) => p.id === id);
            if (!old) return false;
            const next: AdminProduct = { ...old, ...patch };
            const sizes = next.sizes ?? [];
            try {
                const payload: ProductPayload = {
                    name: next.name,
                    category: next.category,
                    expiry: next.expiry,
                    reorderThreshold: next.reorderThreshold ?? null,
                    version: old.version,
                    ...(sizes.length ? { sizes: sizesPayload(sizes) } : { price: next.price, sizes: [] }),
                };
                const image = persistableImage(next.image);
                if (image && image !== old.image) payload.image = image;
                await updateProductDetails(id, payload);

                const reasonFor = (delta: number): StockReason => stockReason ?? (delta > 0 ? "RESTOCK" : "CORRECTION");
                if (sizes.length) {
                    for (const s of sizes) {
                        if (!isServerId(s.id)) continue;
                        const before = old.sizes?.find((o) => o.id === s.id);
                        const delta = s.stock - (before?.stock ?? s.stock);
                        if (delta !== 0) await adjustStock(id, { sizeId: Number(s.id), delta, reason: reasonFor(delta) });
                    }
                } else if (!old.sizes?.length) {
                    const delta = next.stock - old.stock;
                    if (delta !== 0) await adjustStock(id, { delta, reason: reasonFor(delta) });
                }
                await reloadInventory();
                toast.success("Product updated.");
                if (isUnsavedPhoto(next.image)) toast.message("Photo not saved — image upload arrives with Cloudinary.");
                return true;
            } catch (err) {
                toast.error(errorMessage(err));
                await reloadInventory();
                return false;
            }
        },
        [products, reloadInventory]
    );

    const deleteProduct = useCallback(
        async (id: number) => {
            try {
                await deleteProductById(id);
                await reloadInventory();
                toast.success("Product removed.");
            } catch (err) {
                toast.error(errorMessage(err));
            }
        },
        [reloadInventory]
    );

    const bulkDeleteProducts = useCallback(
        async (ids: number[]) => {
            if (ids.length === 0) return;
            const results = await Promise.allSettled(ids.map((id) => deleteProductById(id)));
            const removed = results.filter((r) => r.status === "fulfilled").length;
            const failed = results.length - removed;
            await reloadInventory();
            if (removed > 0) toast.success(`${removed} product${removed === 1 ? "" : "s"} removed.`);
            if (failed > 0) toast.error(`${failed} couldn't be removed (they have orders).`);
        },
        [reloadInventory]
    );

    // Size-variant products are skipped, not guessed at — their price/stock are a derived starting-from/total, so a bulk delta would desync from real per-size values.
    const bulkAdjustProducts = useCallback(
        async (ids: number[], adjust: { stockDelta?: number; setPrice?: number }) => {
            const idSet = new Set(ids);
            const targets = products.filter((p) => idSet.has(p.id));
            const applied = targets.filter((p) => !p.sizes || p.sizes.length === 0);
            const skipped = targets.length - applied.length;
            if (applied.length === 0) {
                if (skipped > 0) toast.error(`Skipped all ${skipped} — products with size variants must be edited individually.`);
                return;
            }
            let failed = 0;
            for (const p of applied) {
                try {
                    if (adjust.setPrice !== undefined) await updateProductDetails(p.id, { price: Math.max(0, adjust.setPrice), version: p.version });
                    if (adjust.stockDelta !== undefined) {
                        // Floored at zero, matching the old behaviour of clamping instead of erroring.
                        const delta = Math.max(adjust.stockDelta, -p.stock);
                        if (delta !== 0) await adjustStock(p.id, { delta, reason: delta > 0 ? "RESTOCK" : "CORRECTION", note: "Bulk edit" });
                    }
                } catch {
                    failed++;
                }
            }
            await reloadInventory();
            const done = applied.length - failed;
            if (failed > 0) toast.error(`${failed} product${failed === 1 ? "" : "s"} failed to update.`);
            if (done > 0) {
                toast.success(
                    skipped > 0
                        ? `${done} updated; ${skipped} skipped (size variants — edit individually).`
                        : `${done} product${done === 1 ? "" : "s"} updated.`
                );
            }
        },
        [products, reloadInventory]
    );

    const [orders, setOrders] = useState<AdminOrder[]>([]);

    const reloadOrders = useCallback(async () => {
        try {
            const { orders: list } = await listAllOrders();
            setOrders(list.map(toAdminOrder));
        } catch (err) {
            toast.error(errorMessage(err));
        }
    }, []);

    useEffect(() => {
        // Loads server data once signed in; the state updates happen after the awaited fetch, not synchronously.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (isAdminLoggedIn) void reloadOrders();
    }, [isAdminLoggedIn, reloadOrders]);

    const updateOrderStatus = useCallback(
        async (orderNo: string, status: AdminOrderStatus) => {
            try {
                await setOrderStatus(orderNo, status);
                toast.success(`Order ${orderNo} marked as ${status}.`);
            } catch (err) {
                toast.error(errorMessage(err));
            }
            // A cancellation returns units to stock, so inventory is reloaded too.
            await Promise.all([reloadOrders(), reloadInventory()]);
        },
        [reloadOrders, reloadInventory]
    );

    const importOrders = useCallback(
        async (file: File) => {
            try {
                const result = await importOrderStatuses(file);
                // Cancelling returns stock, so inventory is reloaded along with the orders.
                await Promise.all([reloadOrders(), reloadInventory()]);
                return result;
            } catch (err) {
                toast.error(errorMessage(err));
                return null;
            }
        },
        [reloadOrders, reloadInventory]
    );

    const reviewPayment = useCallback(
        async (orderNo: string, proofId: number, input: { decision: "approve" } | { decision: "reject"; reason: string }) => {
            try {
                await reviewPaymentProof(orderNo, proofId, input);
                toast.success(input.decision === "approve" ? `Payment verified — ${orderNo} is now Paid.` : "Screenshot rejected. The customer has been told why.");
                await reloadOrders();
                return true;
            } catch (err) {
                toast.error(errorMessage(err));
                await reloadOrders();
                return false;
            }
        },
        [reloadOrders]
    );

    const refundOrder = useCallback(
        async (orderNo: string, input: { amount: number; note?: string }) => {
            try {
                await recordRefund(orderNo, input);
                toast.success(`Refund of ₱${input.amount.toLocaleString()} recorded for ${orderNo}. The customer has been emailed.`);
                await reloadOrders();
                return true;
            } catch (err) {
                toast.error(errorMessage(err));
                return false;
            }
        },
        [reloadOrders]
    );

    const bulkUpdateOrderStatus = useCallback(
        async (orderNos: string[], status: AdminOrderStatus) => {
            if (orderNos.length === 0) return;
            let done = 0;
            let lastError = "";
            for (const no of orderNos) {
                try {
                    await setOrderStatus(no, status);
                    done++;
                } catch (err) {
                    lastError = errorMessage(err);
                }
            }
            await Promise.all([reloadOrders(), reloadInventory()]);
            if (done > 0) toast.success(`${done} order${done === 1 ? "" : "s"} marked as ${status}.`);
            if (done < orderNos.length) toast.error(`${orderNos.length - done} couldn't be updated: ${lastError}`);
        },
        [reloadOrders, reloadInventory]
    );

    // Only administrators may list accounts (everyone else gets 403 and simply sees no list).
    const reloadStaff = useCallback(async () => {
        try {
            setStaff(await listStaff());
        } catch {
            setStaff([]);
        }
    }, []);

    useEffect(() => {
        // Loads once signed in; state is set after the awaited request, not synchronously.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (isAdminLoggedIn) void reloadStaff();
    }, [isAdminLoggedIn, reloadStaff]);

    const addStaff = useCallback(
        async (input: StaffInput) => {
            try {
                await createStaff(input);
                await reloadStaff();
                toast.success(`"${input.name}" added to staff.`);
                return true;
            } catch (err) {
                toast.error(errorMessage(err));
                return false;
            }
        },
        [reloadStaff]
    );

    const updateStaff = useCallback(
        async (id: number, patch: StaffPatch) => {
            try {
                await updateStaffById(id, patch);
                await reloadStaff();
                toast.success("Staff account updated.");
                return true;
            } catch (err) {
                toast.error(errorMessage(err));
                return false;
            }
        },
        [reloadStaff]
    );

    const deleteStaff = useCallback(
        async (id: number) => {
            try {
                await deleteStaffById(id);
                await reloadStaff();
                toast.success("Staff account removed.");
            } catch (err) {
                toast.error(errorMessage(err));
            }
        },
        [reloadStaff]
    );

    // The server enforces "not yourself" and "not the last administrator"; each refusal is counted, not fatal to the rest.
    const bulkDeleteStaff = useCallback(
        async (ids: number[]) => {
            let removed = 0;
            let lastError = "";
            for (const id of ids) {
                try {
                    await deleteStaffById(id);
                    removed++;
                } catch (err) {
                    lastError = errorMessage(err);
                }
            }
            const blocked = ids.length - removed;
            await reloadStaff();
            if (removed > 0 && blocked === 0) toast.success(`${removed} staff account${removed === 1 ? "" : "s"} removed.`);
            else if (removed > 0) toast.success(`${removed} removed; ${blocked} kept (${lastError.toLowerCase()}).`);
            else if (blocked > 0) toast.error(lastError);
            return { removed, blocked };
        },
        [reloadStaff]
    );

    // Read-only — real registered customers. Accounts without access to the customer list just see none.
    const [users, setUsers] = useState<AdminUser[]>([]);
    useEffect(() => {
        if (!isAdminLoggedIn) return;
        let alive = true;
        listCustomers()
            .then((list) => alive && setUsers(list))
            .catch(() => alive && setUsers([]));
        return () => {
            alive = false;
        };
    }, [isAdminLoggedIn]);

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const toggleSidebar = useCallback(() => setSidebarCollapsed((c) => !c), []);

    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const openMobileSidebar = useCallback(() => setMobileSidebarOpen(true), []);
    const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

    // Worked out by the server from live orders, payment screenshots and stock; refreshed every minute while signed in.
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    useEffect(() => {
        if (!isAdminLoggedIn) return;
        let alive = true;
        const load = () =>
            listNotifications()
                .then((list) => alive && setNotifications(list))
                .catch(() => {
                    // Keep showing the last list; the next tick retries.
                });
        void load();
        const timer = setInterval(load, 60_000);
        return () => {
            alive = false;
            clearInterval(timer);
        };
    }, [isAdminLoggedIn]);

    const markNotificationRead = useCallback((id: string) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        markNotificationsRead({ keys: [id] }).catch(() => {});
    }, []);

    const markAllNotificationsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        markNotificationsRead({ all: true }).catch(() => {});
    }, []);

    // The signed-in account itself (from the session), so non-administrators — who can't list staff — still know their own role and access.
    const currentStaffMember: StaffMember | null =
        (currentStaffId !== null ? staff.find((m) => m.id === currentStaffId) : undefined) ??
        (sessionStaff
            ? {
                  id: sessionStaff.id,
                  name: sessionStaff.name,
                  email: sessionStaff.email,
                  role: sessionStaff.role === "ADMINISTRATOR" ? "Administrator" : "Staff",
                  access: sessionStaff.access ?? "Full access",
              }
            : null);

    const value: AdminStoreValue = {
        isAdminLoggedIn,
        authChecked,
        adminName,
        currentStaffId,
        currentStaffMember,
        login,
        completeTwoFactor,
        twoFactorEnabled: sessionStaff?.twoFactorEnabled ?? false,
        reloadSession,
        logout,
        products,
        stockLog,
        catalogVersion,
        addProduct,
        bulkAddProducts,
        updateProduct,
        deleteProduct,
        bulkDeleteProducts,
        bulkAdjustProducts,
        orders,
        updateOrderStatus,
        bulkUpdateOrderStatus,
        importOrders,
        reviewPayment,
        refundOrder,
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
