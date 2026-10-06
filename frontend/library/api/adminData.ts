import { api } from "./client";

const send = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });
const qs = (params: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") p.set(k, String(v));
    const s = p.toString();
    return s ? `?${s}` : "";
};

export type Paged<T> = { total: number; page: number; pageSize: number; items: T[] };

// ---- Discount codes (administrators) ----
export type AdminVoucher = {
    id: number;
    code: string;
    description: string;
    percentOff: number | null;
    expiresAt: string | null;
    active: boolean;
    personalFor: string | null;
    maxUses: number | null;
    uses: number;
};
export const listDiscountCodes = async () => (await api<{ vouchers: AdminVoucher[] }>("/discount-codes")).vouchers;
export const createDiscountCode = (input: { code: string; description: string; percentOff: number; expiresAt?: string | null; maxUses?: number | null; forEmail?: string | null }) =>
    api<{ voucher: AdminVoucher }>("/discount-codes", send("POST", input));
export const updateDiscountCode = (id: number, patch: { active?: boolean; description?: string; expiresAt?: string | null; maxUses?: number | null }) =>
    api<{ voucher: AdminVoucher }>(`/discount-codes/${id}`, send("PATCH", patch));

// ---- Audit log (administrators) ----
export type AuditEntry = {
    id: number;
    entityType: string;
    entityId: string;
    action: string;
    actor: { type: string; id: number | null; name: string };
    details: unknown;
    createdAt: string;
};
export const listAuditLog = (p: { page: number; entityType?: string; entityId?: string }) => api<Paged<AuditEntry>>(`/audit-log${qs({ ...p, pageSize: 50 })}`);

// ---- Subscribers and contact messages (staff with full access, and administrators) ----
export type SubscriberRow = { id: number; email: string; source: string; createdAt: string };
export const listSubscribers = async (p: { page: number; search?: string }) => {
    const r = await api<{ total: number; page: number; pageSize: number; subscribers: SubscriberRow[] }>(`/subscribers${qs({ ...p, pageSize: 50 })}`);
    return { total: r.total, page: r.page, pageSize: r.pageSize, items: r.subscribers } satisfies Paged<SubscriberRow>;
};

export type ContactMessageRow = { id: number; name: string; email: string; message: string; createdAt: string };
export const listContactMessages = async (p: { page: number; search?: string }) => {
    const r = await api<{ total: number; page: number; pageSize: number; messages: ContactMessageRow[] }>(`/contact-messages${qs({ ...p, pageSize: 50 })}`);
    return { total: r.total, page: r.page, pageSize: r.pageSize, items: r.messages } satisfies Paged<ContactMessageRow>;
};

// ---- Shipping fee (Settings → Payment Details) ----
export type ShippingRule = { flat: number; freeOver: number | null };
export async function getShippingRule(): Promise<ShippingRule> {
    try {
        const { data } = await api<{ data: Partial<ShippingRule> }>("/content/shipping");
        return { flat: data.flat ?? 0, freeOver: data.freeOver ?? null };
    } catch {
        return { flat: 0, freeOver: null };
    }
}
export const saveShippingRule = (data: ShippingRule) => api<{ section: string }>("/content/shipping", send("PATCH", { data }));
export const deleteDiscountCode = (id: number) => api<{ ok: true }>(`/discount-codes/${id}`, send("DELETE"));
