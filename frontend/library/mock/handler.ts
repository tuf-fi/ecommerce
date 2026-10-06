import { ApiError } from "../api/client";
import type { ApiOrder, CartCheckResult } from "../api/orders";
import type { ApiProduct } from "../api/products";
import type { AdminVoucher } from "../api/adminData";
import * as D from "./data";

// An in-memory stand-in for the REST API. State lives for the page session, so edits made while clicking around
// (a status change, a new product) are reflected everywhere until the page is reloaded.

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const state = {
    products: clone(D.PRODUCTS),
    orders: clone(D.ORDERS),
    stockLog: clone(D.STOCK_LOG),
    staff: clone(D.STAFF),
    vouchers: clone(D.VOUCHERS),
    notifications: clone(D.ADMIN_NOTIFICATIONS),
    myNotifications: clone(D.MY_NOTIFICATIONS),
    addresses: clone(D.ADDRESSES),
    wishlist: [1, 4] as number[],
    sessions: clone(D.ADMIN_SESSIONS),
    content: { paymentInstructions: clone(D.PAYMENT_INSTRUCTIONS), shipping: { flat: 120, freeOver: 2500 } } as Record<string, unknown>,
    customer: clone(D.MOCK_CUSTOMER),
    seq: 100,
};

// Sign-in survives a reload (so a page refresh doesn't bounce you), but not a new browser session.
const flag = (key: string) => ({
    get: () => {
        try {
            return window.sessionStorage.getItem(key) === "1";
        } catch {
            return false;
        }
    },
    set: (on: boolean) => {
        try {
            if (on) window.sessionStorage.setItem(key, "1");
            else window.sessionStorage.removeItem(key);
        } catch {
            // Storage blocked: the mock just forgets the sign-in on reload.
        }
    },
});
const customerAuth = flag("mock-customer");
const adminAuth = flag("mock-admin");

const ok = { ok: true as const };
const nextId = () => ++state.seq;
const unauthorized = () => new ApiError(401, "Not signed in");
const notFound = () => new ApiError(404, "Not found");
const bump = <T extends { version?: number }>(p: T) => ({ ...p, version: (p.version ?? 1) + 1 });

function pageOf<T>(items: T[], params: URLSearchParams) {
    const pageSize = Number(params.get("pageSize")) || 50;
    const page = Number(params.get("page")) || 1;
    return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize };
}

function syncProduct(p: ApiProduct): ApiProduct {
    if (p.sizes.length) p.stock = p.sizes.reduce((s, z) => s + z.stock, 0);
    return p;
}

function checkCart(body: { items: { productId: number; sizeId: number | null; qty: number }[]; voucherCode?: string }): CartCheckResult {
    const items = body.items.map((line) => {
        const prod = state.products.find((p) => p.id === line.productId);
        const size = prod?.sizes.find((s) => s.id === line.sizeId);
        const available = size ? size.stock : prod?.stock ?? 0;
        const unitPrice = size ? size.price : prod?.price ?? 0;
        return {
            productId: line.productId,
            sizeId: line.sizeId,
            name: prod?.name ?? "Unknown product",
            sizeLabel: size?.label ?? null,
            unitPrice,
            qty: line.qty,
            available,
            ok: !!prod && available >= line.qty,
        };
    });
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    const voucher = body.voucherCode ? state.vouchers.find((v) => v.code.toLowerCase() === body.voucherCode!.trim().toLowerCase()) : undefined;
    const usable = !!voucher && voucher.active && (!voucher.expiresAt || new Date(voucher.expiresAt) > new Date());
    const discount = usable && voucher.percentOff ? Math.round((subtotal * voucher.percentOff) / 100) : 0;
    const rule = state.content.shipping as { flat: number; freeOver: number | null };
    const shippingFee = items.length === 0 || (rule.freeOver !== null && subtotal - discount >= rule.freeOver) ? 0 : rule.flat;
    return {
        ok: items.every((i) => i.ok),
        subtotal,
        discount,
        shippingFee,
        total: subtotal - discount + shippingFee,
        voucher: usable ? { code: voucher.code, description: voucher.description, percentOff: voucher.percentOff } : null,
        voucherError: body.voucherCode && !usable ? "That code isn't valid or has expired." : null,
        items,
    };
}

function placeOrder(body: { items: { productId: number; sizeId: number | null; qty: number }[]; address: string; voucherCode?: string }): ApiOrder {
    const check = checkCart(body);
    const no = `LM-${1000 + state.orders.length + 1}`;
    const order: ApiOrder = {
        no,
        status: "PENDING",
        customerName: state.customer.name,
        email: state.customer.email,
        address: body.address,
        subtotal: check.subtotal,
        discount: check.discount,
        shippingFee: check.shippingFee,
        total: check.total,
        voucherCode: check.voucher?.code ?? null,
        refund: null,
        createdAt: new Date().toISOString(),
        paidAt: null,
        payment: { state: "none", proofs: [] },
        items: check.items.map((i) => ({ productId: i.productId, name: i.name, sizeLabel: i.sizeLabel, qty: i.qty, unitPrice: i.unitPrice })),
    };
    for (const line of body.items) {
        const prod = state.products.find((p) => p.id === line.productId);
        const size = prod?.sizes.find((s) => s.id === line.sizeId);
        if (size) size.stock = Math.max(0, size.stock - line.qty);
        else if (prod) prod.stock = Math.max(0, prod.stock - line.qty);
        if (prod) syncProduct(prod);
    }
    state.orders.unshift(order);
    return order;
}

const findOrder = (no: string) => state.orders.find((o) => o.no === decodeURIComponent(no)) ?? (() => { throw notFound(); })();
const myOrders = () => state.orders.filter((o) => o.email === state.customer.email);

type Params = URLSearchParams;
type Ctx = { m: RegExpMatchArray; body: any; params: Params; method: string };
type Route = [method: string, pattern: RegExp, handler: (c: Ctx) => unknown];

const requireAdmin = () => {
    if (!adminAuth.get()) throw unauthorized();
};
const requireCustomer = () => {
    if (!customerAuth.get()) throw unauthorized();
};

const routes: Route[] = [
    // ---- customer auth
    ["POST", /^\/auth\/customer\/(login|register|google)$/, ({ body, m }) => {
        if (m[1] === "register" && body?.name) state.customer = { ...state.customer, name: body.name, email: body.email ?? state.customer.email };
        customerAuth.set(true);
        return { customer: state.customer };
    }],
    ["GET", /^\/auth\/customer\/session$/, () => (requireCustomer(), { customer: state.customer })],
    ["PATCH", /^\/auth\/customer\/profile$/, ({ body }) => {
        state.customer = { ...state.customer, ...body };
        return { customer: state.customer };
    }],
    ["POST", /^\/auth\/customer\/(password|otp\/request|otp\/verify)$/, () => ok],
    ["POST", /^\/auth\/customer\/(logout|logout-all)$/, () => (customerAuth.set(false), ok)],

    // ---- admin auth
    ["POST", /^\/auth\/admin\/login$/, () => (adminAuth.set(true), { staff: D.MOCK_ADMIN })],
    ["POST", /^\/auth\/admin\/login\/2fa$/, () => (adminAuth.set(true), { staff: D.MOCK_ADMIN })],
    ["GET", /^\/auth\/admin\/session$/, () => (requireAdmin(), { staff: D.MOCK_ADMIN })],
    ["POST", /^\/auth\/admin\/logout$/, () => (adminAuth.set(false), ok)],
    ["GET", /^\/auth\/admin\/sessions$/, () => ({ sessions: state.sessions })],
    ["POST", /^\/auth\/admin\/sessions\/revoke-others$/, () => {
        const revoked = state.sessions.filter((s) => !s.current).length;
        state.sessions = state.sessions.filter((s) => s.current);
        return { revoked };
    }],
    ["DELETE", /^\/auth\/admin\/sessions\/(.+)$/, ({ m }) => ((state.sessions = state.sessions.filter((s) => s.id !== m[1])), ok)],
    ["POST", /^\/auth\/admin\/password$/, () => ({ ok: true, signedOutElsewhere: state.sessions.filter((s) => !s.current).length })],
    ["POST", /^\/auth\/admin\/2fa\/setup$/, () => ({
        secret: "JBSWY3DPEHPK3PXP",
        otpauthUrl: "otpauth://totp/Cindyrella:admin@cindyrella.ph?secret=JBSWY3DPEHPK3PXP&issuer=Cindyrella",
        qrDataUrl: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="#fff"/><path d="M10 10h40v40H10zM110 10h40v40h-40zM10 110h40v40H10zM70 70h20v20H70zM100 100h50v10h-50zM60 20h30v10H60zM20 70h30v10H20z" fill="#111"/></svg>'),
    })],
    ["POST", /^\/auth\/admin\/2fa\/enable$/, () => ({ recoveryCodes: ["a1b2-c3d4", "e5f6-a7b8", "c9d0-e1f2", "a3b4-c5d6", "e7f8-a9b0", "c1d2-e3f4"] })],
    ["POST", /^\/auth\/admin\/2fa\/disable$/, () => ok],

    // ---- catalogue
    ["GET", /^\/products\/stock-log$/, ({ params }) => ({ items: pageOf([...state.stockLog].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), params).items })],
    ["GET", /^\/products\/admin$/, ({ params }) => {
        const { items, total } = pageOf(state.products, params);
        return { products: items, total };
    }],
    ["GET", /^\/products$/, ({ params }) => {
        const { items, total } = pageOf(state.products, params);
        return { products: items, total };
    }],
    ["GET", /^\/products\/(\d+)\/reviews$/, ({ m }) => {
        const reviews = D.REVIEWS.filter((r) => r.productId === Number(m[1]));
        return { total: reviews.length, reviews };
    }],
    ["POST", /^\/products$/, ({ body }) => {
        const product: ApiProduct = syncProduct({
            id: nextId(), sku: body.sku ?? `SKU-${state.seq}`, name: body.name ?? "New product", category: body.category ?? "Serum", description: "",
            price: body.price ?? 0, stock: body.stock ?? 0, rating: 0, ratingCount: 0, image: body.image ?? null, concerns: [], expiry: body.expiry ?? null,
            reorderThreshold: body.reorderThreshold ?? null, version: 1,
            sizes: (body.sizes ?? []).map((s: { label: string; price: number; stock?: number }) => ({ id: nextId(), label: s.label, price: s.price, stock: s.stock ?? 0 })),
        });
        state.products.push(product);
        return { product };
    }],
    ["PATCH", /^\/products\/(\d+)$/, ({ m, body }) => {
        const i = state.products.findIndex((p) => p.id === Number(m[1]));
        if (i < 0) throw notFound();
        const { sizes, ...rest } = body;
        const next = bump({ ...state.products[i], ...rest });
        if (sizes) next.sizes = sizes.map((s: { id?: number; label: string; price: number; stock?: number }) => ({ id: s.id ?? nextId(), label: s.label, price: s.price, stock: s.stock ?? 0 }));
        state.products[i] = syncProduct(next);
        return { product: state.products[i] };
    }],
    ["DELETE", /^\/products\/(\d+)$/, ({ m }) => ((state.products = state.products.filter((p) => p.id !== Number(m[1]))), ok)],
    ["POST", /^\/products\/(\d+)\/stock-adjustment$/, ({ m, body }) => {
        const prod = state.products.find((p) => p.id === Number(m[1]));
        if (!prod) throw notFound();
        const size = prod.sizes.find((s) => s.id === body.sizeId);
        if (size) size.stock = Math.max(0, size.stock + body.delta);
        else prod.stock = Math.max(0, prod.stock + body.delta);
        syncProduct(prod);
        prod.version = (prod.version ?? 1) + 1;
        state.stockLog.unshift({ id: nextId(), productId: prod.id, productName: prod.name, sizeLabel: size?.label ?? null, quantity: body.delta, reason: body.reason, note: body.note ?? null, actor: D.MOCK_ADMIN.name, createdAt: new Date().toISOString() });
        return { product: prod };
    }],
    ["POST", /^\/reviews$/, ({ body }) => ({ review: { id: nextId(), productId: body.productId, author: state.customer.name, rating: body.rating, text: body.text, date: new Date().toISOString().slice(0, 10) } })],

    // ---- CMS content
    ["GET", /^\/content\/(\w+)$/, ({ m }) => {
        if (!(m[1] in state.content)) throw notFound();
        return { data: state.content[m[1]] };
    }],
    ["PATCH", /^\/content\/(\w+)$/, ({ m, body }) => ((state.content[m[1]] = body.data), { section: m[1], updatedAt: new Date().toISOString() })],

    // ---- orders
    ["POST", /^\/cart\/check$/, ({ body }) => checkCart(body)],
    ["POST", /^\/orders$/, ({ body }) => ({ order: placeOrder(body) })],
    ["GET", /^\/orders\/admin$/, ({ params }) => {
        const { items, total } = pageOf(state.orders, params);
        return { orders: items, total };
    }],
    ["GET", /^\/orders$/, ({ params }) => {
        const { items, total } = pageOf(myOrders(), params);
        return { orders: items, total };
    }],
    ["POST", /^\/orders\/import$/, () => ({ updated: 3, skipped: ["LM-0999 (not found)"] })],
    ["GET", /^\/orders\/([^/]+)\/history$/, ({ m }) => ({ history: D.historyFor(findOrder(m[1])) })],
    ["POST", /^\/orders\/([^/]+)\/payment-proofs$/, ({ m, body }) => {
        const order = findOrder(m[1]);
        const proof = { id: nextId(), status: "PENDING" as const, method: String(body?.get?.("method") ?? "gcash"), reference: (body?.get?.("reference") as string) || null, note: null, rejectReason: null, reviewedBy: null, reviewedAt: null, createdAt: new Date().toISOString() };
        order.payment = { state: "review", proofs: [proof, ...order.payment.proofs] };
        return { proof: { id: proof.id, status: proof.status } };
    }],
    ["PATCH", /^\/orders\/([^/]+)\/payment-proofs\/(\d+)$/, ({ m, body }) => {
        const order = findOrder(m[1]);
        const proof = order.payment.proofs.find((p) => p.id === Number(m[2]));
        if (!proof) throw notFound();
        const approve = body.decision === "approve";
        Object.assign(proof, { status: approve ? "APPROVED" : "REJECTED", rejectReason: approve ? null : body.reason, reviewedBy: D.MOCK_ADMIN.name, reviewedAt: new Date().toISOString() });
        order.payment.state = approve ? "approved" : "rejected";
        if (approve) {
            order.status = "PAID";
            order.paidAt = new Date().toISOString();
        }
        return ok;
    }],
    ["POST", /^\/orders\/([^/]+)\/refund$/, ({ m, body }) => {
        const refund = { at: new Date().toISOString(), amount: body.amount, note: body.note ?? null };
        findOrder(m[1]).refund = refund;
        return { ok: true, refund };
    }],
    ["POST", /^\/orders\/([^/]+)\/cancel$/, ({ m }) => {
        const order = findOrder(m[1]);
        order.status = "CANCELLED";
        return { order };
    }],
    ["PATCH", /^\/orders\/([^/]+)\/status$/, ({ m, body }) => {
        const order = findOrder(m[1]);
        order.status = body.status;
        if (body.status === "PAID" && !order.paidAt) order.paidAt = new Date().toISOString();
        return { order };
    }],

    // ---- staff, customers, notifications
    ["GET", /^\/staff$/, () => ({ staff: state.staff })],
    ["POST", /^\/staff$/, ({ body }) => {
        const { password: _password, ...rest } = body;
        const staff = { id: nextId(), photo: null, active: true, twoFactorEnabled: false, ...rest };
        state.staff.push(staff);
        return { staff };
    }],
    ["PATCH", /^\/staff\/(\d+)$/, ({ m, body }) => {
        const staff = state.staff.find((s) => s.id === Number(m[1]));
        if (!staff) throw notFound();
        const { password: _password, resetTwoFactor, ...patch } = body;
        Object.assign(staff, patch, resetTwoFactor ? { twoFactorEnabled: false } : {});
        return { staff };
    }],
    ["DELETE", /^\/staff\/(\d+)$/, ({ m }) => ((state.staff = state.staff.filter((s) => s.id !== Number(m[1]))), ok)],
    ["GET", /^\/customers$/, ({ params }) => {
        const { items, total } = pageOf(D.CUSTOMERS, params);
        return { total, customers: items };
    }],
    ["GET", /^\/notifications$/, () => ({ notifications: state.notifications })],
    ["POST", /^\/notifications\/read$/, ({ body }) => {
        for (const n of state.notifications) if ("all" in body || body.keys.includes(n.id)) n.read = true;
        return ok;
    }],

    // ---- marketing (admin)
    ["GET", /^\/discount-codes$/, () => ({ vouchers: state.vouchers })],
    ["POST", /^\/discount-codes$/, ({ body }) => {
        const voucher: AdminVoucher = { id: nextId(), code: body.code.toUpperCase(), description: body.description, percentOff: body.percentOff, expiresAt: body.expiresAt ?? null, active: true, personalFor: body.forEmail ?? null, maxUses: body.maxUses ?? null, uses: 0 };
        state.vouchers.unshift(voucher);
        return { voucher };
    }],
    ["PATCH", /^\/discount-codes\/(\d+)$/, ({ m, body }) => {
        const voucher = state.vouchers.find((v) => v.id === Number(m[1]));
        if (!voucher) throw notFound();
        Object.assign(voucher, body);
        return { voucher };
    }],
    ["DELETE", /^\/discount-codes\/(\d+)$/, ({ m }) => ((state.vouchers = state.vouchers.filter((v) => v.id !== Number(m[1]))), ok)],
    ["GET", /^\/audit-log$/, ({ params }) => {
        const type = params.get("entityType");
        const id = params.get("entityId");
        return pageOf(D.AUDIT.filter((a) => (!type || a.entityType === type) && (!id || a.entityId === id)), params);
    }],
    ["GET", /^\/subscribers$/, ({ params }) => {
        const q = params.get("search")?.toLowerCase();
        const { items, ...rest } = pageOf(D.SUBSCRIBERS.filter((s) => !q || s.email.includes(q)), params);
        return { ...rest, subscribers: items };
    }],
    ["GET", /^\/contact-messages$/, ({ params }) => {
        const q = params.get("search")?.toLowerCase();
        const { items, ...rest } = pageOf(D.CONTACT_MESSAGES.filter((c) => !q || `${c.name} ${c.email} ${c.message}`.toLowerCase().includes(q)), params);
        return { ...rest, messages: items };
    }],

    // ---- storefront forms
    ["POST", /^\/(newsletter\/subscribe|promo\/subscribe|contact)$/, () => ok],
    ["GET", /^\/vouchers\/mine$/, () => (requireCustomer(), { vouchers: D.MY_VOUCHERS })],

    // ---- customer account
    ["GET", /^\/addresses$/, () => (requireCustomer(), { addresses: state.addresses })],
    ["POST", /^\/addresses$/, ({ body }) => {
        if (body.makeDefault) state.addresses.forEach((a) => (a.isDefault = false));
        const address = { id: nextId(), label: body.label, text: body.text, isDefault: !!body.makeDefault || state.addresses.length === 0 };
        state.addresses.push(address);
        return { address };
    }],
    ["PATCH", /^\/addresses\/(\d+)$/, ({ m, body }) => {
        const address = state.addresses.find((a) => a.id === Number(m[1]));
        if (!address) throw notFound();
        if (body.isDefault) state.addresses.forEach((a) => (a.isDefault = false));
        Object.assign(address, body);
        return { address };
    }],
    ["DELETE", /^\/addresses\/(\d+)$/, ({ m }) => ((state.addresses = state.addresses.filter((a) => a.id !== Number(m[1]))), ok)],
    ["GET", /^\/wishlist$/, () => (requireCustomer(), { productIds: state.wishlist })],
    ["POST", /^\/wishlist\/merge$/, ({ body }) => ((state.wishlist = [...new Set([...state.wishlist, ...body.productIds])]), { productIds: state.wishlist })],
    ["PUT", /^\/wishlist\/(\d+)$/, ({ m }) => ((state.wishlist = [...new Set([...state.wishlist, Number(m[1])])]), ok)],
    ["DELETE", /^\/wishlist\/(\d+)$/, ({ m }) => ((state.wishlist = state.wishlist.filter((id) => id !== Number(m[1]))), ok)],
    ["GET", /^\/my\/notifications$/, ({ params }) => {
        requireCustomer();
        const { items, total, page, pageSize } = pageOf(state.myNotifications, params.has("pageSize") ? params : new URLSearchParams({ pageSize: "50" }));
        return { notifications: items, unread: state.myNotifications.filter((n) => !n.read).length, total, page, pageSize };
    }],
    ["POST", /^\/my\/notifications\/read$/, ({ body }) => {
        for (const n of state.myNotifications) if (!body.ids || body.ids.includes(n.id)) n.read = true;
        return ok;
    }],
    ["POST", /^\/my\/notifications\/test$/, () => {
        state.myNotifications.unshift({ id: nextId(), type: "account", title: "Test notification", body: "This is what a live notification looks like.", href: null, read: false, createdAt: new Date().toISOString() });
        return ok;
    }],
];

export async function mockApi<T>(path: string, init: RequestInit = {}): Promise<T> {
    await new Promise((resolve) => setTimeout(resolve, 120));
    const [pathname, query = ""] = path.split("?");
    const method = (init.method ?? "GET").toUpperCase();
    const route = routes.find(([m, re]) => m === method && re.test(pathname));
    if (!route) throw new ApiError(404, `No mock for ${method} ${pathname}`);
    const body = typeof init.body === "string" ? JSON.parse(init.body) : init.body ?? {};
    return clone(route[2]({ m: pathname.match(route[1])!, body, params: new URLSearchParams(query), method }) as T);
}

// Direct (non-api()) reads used by the server-rendered shell: the catalogue is also needed outside the browser.
export const mockCatalog = () => D.PRODUCTS;

export function mockOrdersCsv(): string {
    const rows = state.orders.map((o) => [o.no, o.status, o.customerName, o.email, o.total, o.createdAt.slice(0, 10)].join(","));
    return ["Order,Status,Customer,Email,Total,Date", ...rows].join("\n");
}
