import { api } from "./client";
import { API_BASE_URL } from "./client";
import { MOCK_API } from "../mock/config";
import { mockOrdersCsv } from "../mock/handler";
import type { Order, OrderLine, OrderStatus, PaymentState, ProofInfo } from "../orders";
import type { AdminOrder, AdminOrderStatus } from "../admin/types";

export type ApiOrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type ApiOrder = {
    no: string;
    status: ApiOrderStatus;
    customerName: string;
    email: string;
    address: string;
    total: number;
    subtotal: number;
    discount: number;
    shippingFee: number;
    voucherCode: string | null;
    refund: { at: string; amount: number; note: string | null } | null;
    createdAt: string;
    paidAt: string | null;
    payment: { state: PaymentState; proofs: ProofInfo[] };
    items: { productId: number; name: string; sizeLabel: string | null; qty: number; unitPrice: number }[];
};

export type CartCheckResult = {
    ok: boolean;
    // What the customer will pay, worked out by the server: items, a code's discount, and shipping.
    subtotal: number;
    discount: number;
    shippingFee: number;
    total: number;
    voucher: { code: string; description: string; percentOff: number | null } | null;
    voucherError: string | null;
    items: { productId: number; sizeId: number | null; name: string; sizeLabel: string | null; unitPrice: number; qty: number; available: number; ok: boolean }[];
};

const send = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

export type CheckoutLine = { productId: number; sizeId: number | null; qty: number };

export const checkCart = (items: CheckoutLine[], voucherCode?: string) => api<CartCheckResult>("/cart/check", send("POST", { items, ...(voucherCode ? { voucherCode } : {}) }));
export const placeOrder = (input: { items: CheckoutLine[]; address: string; voucherCode?: string }) => api<{ order: ApiOrder }>("/orders", send("POST", input));
// The API returns orders in pages of at most 100 (newest first); these walk them, up to 20 pages.
async function allOrderPages(path: string): Promise<{ orders: ApiOrder[] }> {
    const orders: ApiOrder[] = [];
    for (let page = 1; page <= 20; page++) {
        const res = await api<{ orders: ApiOrder[]; total: number }>(`${path}${path.includes("?") ? "&" : "?"}page=${page}&pageSize=100`);
        orders.push(...res.orders);
        if (res.orders.length === 0 || orders.length >= res.total) break;
    }
    return { orders };
}

export const listMyOrders = () => allOrderPages("/orders");
// Customers pay by transfer and upload a screenshot; staff then approve or reject it.
export const submitPaymentProof = (no: string, input: { method: string; reference?: string; file: File }) => {
    const form = new FormData();
    form.append("method", input.method);
    if (input.reference) form.append("reference", input.reference);
    form.append("file", input.file);
    return api<{ proof: { id: number; status: string } }>(`/orders/${encodeURIComponent(no)}/payment-proofs`, { method: "POST", body: form });
};

export const reviewPaymentProof = (no: string, proofId: number, input: { decision: "approve" } | { decision: "reject"; reason: string }) =>
    api<{ ok: true }>(`/orders/${encodeURIComponent(no)}/payment-proofs/${proofId}`, send("PATCH", input));

// The screenshot is private, so it is fetched with the sign-in cookie and handed back as a temporary in-memory URL
// (the caller should URL.revokeObjectURL it when done).
export async function fetchProofImage(no: string, proofId: number): Promise<string> {
    // The mock has no stored screenshots, so every proof shows a stand-in receipt.
    if (MOCK_API) return MOCK_PROOF_IMAGE;
    const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(no)}/payment-proofs/${proofId}/image`, { credentials: "include" });
    if (!res.ok) throw new Error("Couldn't load the screenshot");
    return URL.createObjectURL(await res.blob());
}
// Administrators only. Records money already sent back by hand (GCash / bank); it doesn't move any money itself.
export const recordRefund = (no: string, input: { amount: number; note?: string }) =>
    api<{ ok: true; refund: { at: string; amount: number; note: string | null } }>(`/orders/${encodeURIComponent(no)}/refund`, send("POST", input));

export const cancelMyOrder = (no: string) => api<{ order: ApiOrder }>(`/orders/${encodeURIComponent(no)}/cancel`, send("POST"));

export type OrderHistoryEntry = {
    id: number;
    from: ApiOrderStatus | null;
    to: ApiOrderStatus;
    actor: { type: "CUSTOMER" | "STAFF" | "SYSTEM"; id: number | null; name: string };
    note: string | null;
    createdAt: string;
};

// Oldest first. Staff only.
export const listOrderHistory = (no: string) => api<{ history: OrderHistoryEntry[] }>(`/orders/${encodeURIComponent(no)}/history`);

const MOCK_PROOF_IMAGE =
    "data:image/svg+xml;utf8," +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="520"><rect width="360" height="520" fill="#f4f1ee"/><rect x="20" y="20" width="320" height="480" rx="14" fill="#fff"/><text x="180" y="80" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#1f6feb">GCash</text><text x="180" y="130" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#555">Payment sent</text><text x="180" y="200" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#111">PHP 1,310.00</text><text x="180" y="260" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#777">Ref. 1234 567 890</text></svg>');

function saveCsv(csv: string) {
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Downloads every order (optionally one status) as a spreadsheet, straight from the server — not just what the page has loaded.
export async function downloadOrdersCsv(status?: AdminOrderStatus | "All") {
    if (MOCK_API) return saveCsv(mockOrdersCsv());
    const query = status && status !== "All" ? `?status=${status.toUpperCase()}` : "";
    const res = await fetch(`${API_BASE_URL}/orders/export.csv${query}`, { credentials: "include" });
    if (!res.ok) throw new Error("Export failed");
    const url = URL.createObjectURL(await res.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Bulk status changes from a CSV with Order and Status columns (an export that was edited works). Each row follows the same rules as changing it by hand.
export const importOrderStatuses = (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api<{ updated: number; skipped: string[] }>("/orders/import", { method: "POST", body: form });
};

export const listAllOrders = () => allOrderPages("/orders/admin");
export const setOrderStatus = (no: string, status: AdminOrderStatus) =>
    api<{ order: ApiOrder }>(`/orders/${encodeURIComponent(no)}/status`, send("PATCH", { status: status.toUpperCase() }));

// Customer-facing wording for each server status.
const CUSTOMER_STATUS: Record<ApiOrderStatus, OrderStatus> = {
    PENDING: "To Pay",
    PAID: "To Ship",
    SHIPPED: "To Receive",
    DELIVERED: "Completed",
    CANCELLED: "Cancelled",
};

const TRACKER: Record<ApiOrderStatus, { steps: string[]; current: number; eta: string }> = {
    PENDING: { steps: ["Placed", "Payment"], current: 0, eta: "Send your payment, then upload a screenshot (unpaid orders are released after 24 hours)" },
    PAID: { steps: ["Placed", "Paid", "Shipped", "Delivered"], current: 1, eta: "Preparing for shipment" },
    SHIPPED: { steps: ["Placed", "Paid", "Shipped", "Delivered"], current: 2, eta: "On its way" },
    DELIVERED: { steps: ["Placed", "Paid", "Shipped", "Delivered"], current: 3, eta: "Delivered" },
    CANCELLED: { steps: [], current: 0, eta: "This order was cancelled" },
};

function lineLabel(i: ApiOrder["items"][number]) {
    return i.sizeLabel ? `${i.name} (${i.sizeLabel})` : i.name;
}

// An unpaid order's progress depends on where its payment screenshot stands.
function trackerFor(o: ApiOrder) {
    if (o.status !== "PENDING") return TRACKER[o.status];
    const reason = o.payment.proofs[0]?.rejectReason;
    if (o.payment.state === "review") return { steps: ["Placed", "Payment"], current: 1, eta: "We're checking your payment screenshot" };
    if (o.payment.state === "rejected") return { ...TRACKER.PENDING, eta: `Screenshot not accepted${reason ? `: ${reason}` : ""}. Please upload a new one.` };
    return TRACKER.PENDING;
}

export function toCustomerOrder(o: ApiOrder): Order {
    const [first, ...rest] = o.items;
    const lines: OrderLine[] = o.items.map((i) => ({ productId: i.productId, name: lineLabel(i), qty: i.qty, unitPrice: i.unitPrice }));
    return {
        status: CUSTOMER_STATUS[o.status],
        product: first ? `${lineLabel(first)}${rest.length ? ` +${rest.length} more` : ""}` : "Order",
        productId: first?.productId ?? 0,
        qty: o.items.reduce((sum, i) => sum + i.qty, 0),
        total: o.total,
        ...trackerFor(o),
        date: o.createdAt.slice(0, 10),
        items: lines,
        payment: { state: o.payment.state, rejectReason: o.payment.proofs[0]?.rejectReason ?? null },
    };
}

const ADMIN_STATUS: Record<ApiOrderStatus, AdminOrderStatus> = {
    PENDING: "Pending",
    PAID: "Paid",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
};

export function toAdminOrder(o: ApiOrder): AdminOrder {
    return {
        no: o.no,
        customer: o.customerName,
        email: o.email,
        address: o.address,
        date: new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        status: ADMIN_STATUS[o.status],
        total: o.total,
        subtotal: o.subtotal,
        discount: o.discount,
        shippingFee: o.shippingFee,
        voucherCode: o.voucherCode ?? undefined,
        refund: o.refund ?? undefined,
        paidAt: o.paidAt ?? undefined,
        createdAt: o.createdAt,
        payment: o.payment,
        items: o.items.map((i) => ({ productId: i.productId, qty: i.qty, name: lineLabel(i), unitPrice: i.unitPrice })),
    };
}
