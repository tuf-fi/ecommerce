import type { ApiProduct, ApiStockMovement } from "../api/products";
import type { ApiOrder, OrderHistoryEntry } from "../api/orders";
import type { AdminVoucher, AuditEntry, ContactMessageRow, SubscriberRow } from "../api/adminData";
import type { CustomerNotification } from "../api/customer";
import type { AdminSessionInfo } from "../api/auth";
import type { Review } from "../reviews";
import type { Address } from "../store";
import type { PaymentInstructions } from "../api/payments";

const NOW = Date.now();
const DAY = 1440;
export const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();
const ahead = (days: number) => new Date(NOW + days * DAY * 60_000).toISOString();

export const MOCK_CUSTOMER = { id: 1, name: "Maria Santos", email: "maria.santos@example.com", avatarUrl: null as string | null };
export const MOCK_ADMIN = { id: 1, name: "Cindy Reyes", email: "admin@cindyrella.ph", role: "ADMINISTRATOR" as const, access: "Full access", twoFactorEnabled: false };

// ---- Catalogue --------------------------------------------------------------------------------------------------------------

const p = (
    id: number,
    sku: string,
    name: string,
    category: string,
    price: number,
    stock: number,
    rating: number,
    ratingCount: number,
    image: string,
    description: string,
    concerns: string[],
    extra: Partial<ApiProduct> = {}
): ApiProduct => ({ id, sku, name, category, price, stock, rating, ratingCount, image, description, concerns, sizes: [], expiry: null, reorderThreshold: null, version: 1, ...extra });

export const PRODUCTS: ApiProduct[] = [
    p(1, "SRM-RET-30", "Overnight Retinol Serum", "Serum", 1450, 42, 4.8, 126, "/products/overnight-retinol-serum.jpg", "A gentle 0.3% encapsulated retinol that smooths texture and fine lines while you sleep, without the flaking.", ["fine-lines", "texture"], {
        sizes: [
            { id: 101, label: "15 ml", price: 1450, stock: 18 },
            { id: 102, label: "30 ml", price: 2400, stock: 24 },
        ],
        expiry: "2027-08-01",
    }),
    p(2, "SRM-VTC-30", "Vitamin C Brightening Drop", "Serum", 1280, 6, 4.7, 98, "/products/vitamin-c-brightening-drop.jpg", "Stabilised 10% vitamin C with ferulic acid for a visibly brighter, more even complexion.", ["dullness"], { expiry: "2026-12-15", reorderThreshold: 10 }),
    p(3, "TRT-NIA-30", "Niacinamide Pore Refiner", "Treatment", 980, 58, 4.6, 74, "/products/niacinamide-pore-refiner.jpg", "5% niacinamide with zinc to tighten the look of pores and keep shine in check.", ["breakouts", "texture"], { expiry: "2027-05-20" }),
    p(4, "MST-QGC-50", "Quiet Glow Gel Cream", "Moisturizer", 1190, 33, 4.9, 211, "/products/quiet-glow-gel-cream.jpg", "A weightless gel-cream that hydrates for 24 hours and leaves a soft, lit-from-within finish.", ["dryness", "dullness"], { expiry: "2027-02-10" }),
    p(5, "MST-BRC-50", "Barrier Repair Cream", "Moisturizer", 1350, 0, 4.9, 187, "/products/barrier-repair-cream.jpg", "Ceramides, cholesterol and fatty acids to rebuild a stressed, reactive skin barrier.", ["dryness", "redness"], { expiry: "2027-03-30" }),
    p(6, "TRT-CSB-30", "Ceramide Sleep Balm", "Treatment", 890, 21, 4.5, 52, "/products/ceramide-sleep-balm.jpg", "A rich overnight balm that seals in moisture and wakes you up with plump, calm skin.", ["dryness", "redness"], { expiry: "2026-11-30" }),
    p(7, "BDY-RMW-250", "Rice Milk Body Wash", "Body", 620, 64, 4.4, 39, "/products/rice-milk-body-wash.jpg", "A creamy, low-foam cleanser with rice milk that leaves skin soft instead of stripped.", ["dryness"], {
        sizes: [
            { id: 701, label: "250 ml", price: 620, stock: 40 },
            { id: 702, label: "500 ml", price: 1050, stock: 24 },
        ],
    }),
    p(8, "SET-RIT-FULL", "The Ritual Edit Full Set", "Sets", 4200, 12, 5, 64, "/products/the-ritual-edit-full-set.jpg", "Our five bestsellers in one set: cleanser, serum, treatment, moisturizer and sleep balm.", ["dullness", "fine-lines", "dryness"], { reorderThreshold: 5 }),
];

export const STOCK_LOG: ApiStockMovement[] = [
    { id: 1, productId: 1, productName: "Overnight Retinol Serum", sizeLabel: "30 ml", quantity: 24, reason: "RESTOCK", note: "Supplier delivery", actor: "Cindy Reyes", createdAt: ago(DAY * 2) },
    { id: 2, productId: 2, productName: "Vitamin C Brightening Drop", sizeLabel: null, quantity: -2, reason: "DAMAGED", note: "Cracked dropper", actor: "Paolo Dizon", createdAt: ago(DAY * 3) },
    { id: 3, productId: 5, productName: "Barrier Repair Cream", sizeLabel: null, quantity: -1, reason: "SALE", note: null, actor: "System", createdAt: ago(DAY * 3 + 200) },
    { id: 4, productId: 4, productName: "Quiet Glow Gel Cream", sizeLabel: null, quantity: 3, reason: "CORRECTION", note: "Cycle count", actor: "Paolo Dizon", createdAt: ago(DAY * 5) },
    { id: 5, productId: 7, productName: "Rice Milk Body Wash", sizeLabel: "500 ml", quantity: 12, reason: "RESTOCK", note: null, actor: "Cindy Reyes", createdAt: ago(DAY * 6) },
    { id: 6, productId: 3, productName: "Niacinamide Pore Refiner", sizeLabel: null, quantity: 1, reason: "RETURN", note: "Unopened", actor: "Paolo Dizon", createdAt: ago(DAY * 8) },
];

// ---- Orders -----------------------------------------------------------------------------------------------------------------

type Line = [productId: number, qty: number, sizeLabel?: string];
type ProofState = "none" | "review" | "rejected" | "approved";

function unit(id: number, size?: string) {
    const prod = PRODUCTS.find((x) => x.id === id)!;
    return { name: prod.name, price: (size && prod.sizes.find((s) => s.label === size)?.price) || prod.price };
}

export function buildOrder(
    no: string,
    status: ApiOrder["status"],
    customerName: string,
    email: string,
    address: string,
    lines: Line[],
    minutesAgo: number,
    opts: { discount?: number; voucher?: string; proof?: ProofState; refund?: ApiOrder["refund"] } = {}
): ApiOrder {
    const items = lines.map(([productId, qty, sizeLabel]) => ({ productId, name: unit(productId, sizeLabel).name, sizeLabel: sizeLabel ?? null, qty, unitPrice: unit(productId, sizeLabel).price }));
    const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const discount = opts.discount ?? 0;
    const shippingFee = subtotal - discount >= 2500 ? 0 : 120;
    const state: ProofState = opts.proof ?? (status === "PENDING" ? "none" : "approved");
    const proofs =
        state === "none"
            ? []
            : [
                  {
                      id: Number(no.slice(3)),
                      status: state === "review" ? ("PENDING" as const) : state === "rejected" ? ("REJECTED" as const) : ("APPROVED" as const),
                      method: "gcash",
                      reference: `GC${no.slice(3)}7741`,
                      note: null,
                      rejectReason: state === "rejected" ? "Amount doesn't match the order total" : null,
                      reviewedBy: state === "review" ? null : "Cindy Reyes",
                      reviewedAt: state === "review" ? null : ago(minutesAgo - 30),
                      createdAt: ago(minutesAgo - 10),
                  },
              ];
    return {
        no,
        status,
        customerName,
        email,
        address,
        subtotal,
        discount,
        shippingFee,
        total: subtotal - discount + shippingFee,
        voucherCode: opts.voucher ?? null,
        refund: opts.refund ?? null,
        createdAt: ago(minutesAgo),
        paidAt: status === "PENDING" || status === "CANCELLED" ? null : ago(minutesAgo - 40),
        payment: { state, proofs },
        items,
    };
}

const MARIA = ["Maria Santos", "maria.santos@example.com", "12 Acacia St, Brgy. San Antonio, Quezon City"] as const;

export const ORDERS: ApiOrder[] = [
    buildOrder("LM-1014", "PENDING", ...MARIA, [[4, 1], [6, 1]], 90),
    buildOrder("LM-1013", "PENDING", "Angela Cruz", "angela.cruz@example.com", "88 Rizal Ave, Makati City", [[1, 1, "30 ml"]], 260, { proof: "review" }),
    buildOrder("LM-1012", "PAID", "Bea Lim", "bea.lim@example.com", "5 Orchid Lane, Cebu City", [[8, 1]], DAY + 120, { voucher: "WELCOME10", discount: 420 }),
    buildOrder("LM-1011", "PAID", "Carla Mendoza", "carla.m@example.com", "301 Mabini St, Davao City", [[2, 2], [3, 1]], DAY + 600),
    buildOrder("LM-1010", "SHIPPED", ...MARIA, [[5, 1], [7, 1, "250 ml"]], DAY * 2 + 100),
    buildOrder("LM-1009", "SHIPPED", "Denise Tan", "denise.tan@example.com", "17 Sampaguita Rd, Pasig City", [[4, 2]], DAY * 3),
    buildOrder("LM-1008", "DELIVERED", ...MARIA, [[1, 1, "15 ml"]], DAY * 6),
    buildOrder("LM-1007", "DELIVERED", "Elaine Go", "elaine.go@example.com", "42 Bonifacio St, Iloilo City", [[8, 1], [6, 2]], DAY * 8, { voucher: "GLOW15", discount: 630 }),
    buildOrder("LM-1006", "DELIVERED", "Faith Ramos", "faith.ramos@example.com", "9 Narra Ct, Baguio City", [[3, 3]], DAY * 11),
    buildOrder("LM-1005", "DELIVERED", "Grace Uy", "grace.uy@example.com", "63 Luna St, Cagayan de Oro", [[7, 2, "500 ml"]], DAY * 14),
    buildOrder("LM-1004", "CANCELLED", "Hannah Co", "hannah.co@example.com", "21 Del Pilar St, Taguig City", [[2, 1]], DAY * 16),
    buildOrder("LM-1003", "CANCELLED", "Isabel Perez", "isabel.p@example.com", "7 Kamagong St, Quezon City", [[5, 2]], DAY * 18, { proof: "rejected", refund: { at: ago(DAY * 17), amount: 2820, note: "Refunded via GCash" } }),
    buildOrder("LM-1002", "DELIVERED", "Jasmine Ong", "jasmine.ong@example.com", "150 Roxas Blvd, Pasay City", [[4, 1], [1, 1, "30 ml"]], DAY * 21),
    buildOrder("LM-1001", "DELIVERED", ...MARIA, [[6, 1]], DAY * 27),
];

const FLOW: ApiOrder["status"][] = ["PAID", "SHIPPED", "DELIVERED"];

// ---- Generated history so the dashboard charts have a quarter of activity to draw ---------------------------------------------

const SHOPPERS: [name: string, email: string, address: string][] = [
    ["Angela Cruz", "angela.cruz@example.com", "88 Rizal Ave, Makati City"],
    ["Bea Lim", "bea.lim@example.com", "5 Orchid Lane, Cebu City"],
    ["Carla Mendoza", "carla.m@example.com", "301 Mabini St, Davao City"],
    ["Denise Tan", "denise.tan@example.com", "17 Sampaguita Rd, Pasig City"],
    ["Elaine Go", "elaine.go@example.com", "42 Bonifacio St, Iloilo City"],
    ["Faith Ramos", "faith.ramos@example.com", "9 Narra Ct, Baguio City"],
    ["Grace Uy", "grace.uy@example.com", "63 Luna St, Cagayan de Oro"],
    ["Jasmine Ong", "jasmine.ong@example.com", "150 Roxas Blvd, Pasay City"],
    ["Kaye Dela Cruz", "kaye.dc@example.com", "34 Katipunan Ave, Quezon City"],
    ["Lara Gomez", "lara.gomez@example.com", "8 Aguinaldo Hwy, Cavite"],
    ["Maita Soriano", "maita.s@example.com", "71 Session Rd, Baguio City"],
    ["Nina Valdez", "nina.valdez@example.com", "26 Ayala Ave, Makati City"],
];

// A small deterministic generator, so the numbers are the same on every load.
let seed = 7;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];

const SINCE_MIDNIGHT = Math.max(30, Math.floor((NOW - new Date().setHours(0, 0, 0, 0)) / 60_000));

function generatedOrders(): ApiOrder[] {
    const out: ApiOrder[] = [];
    let n = 2000;
    // 90 days back; busier lately, and always several orders today and yesterday for the "vs previous day" cards.
    for (let d = 0; d < 90; d++) {
        const count = d === 0 ? 3 : d === 1 ? 5 : Math.max(0, Math.round(2.4 - d / 45 + rand() * 2.2 - 0.8));
        for (let k = 0; k < count; k++) {
            const minutes = d === 0 ? 5 + Math.floor(rand() * (SINCE_MIDNIGHT - 10)) : SINCE_MIDNIGHT + (d - 1) * DAY + 30 + Math.floor(rand() * (DAY - 60));
            const [name, email, address] = pick(SHOPPERS);
            const lines: Line[] = [[pick(PRODUCTS.filter((x) => x.sizes.length === 0)).id, 1 + Math.floor(rand() * 2)]];
            if (rand() < 0.35) lines.push([pick(PRODUCTS.filter((x) => x.sizes.length === 0)).id, 1]);
            const status: ApiOrder["status"] = d === 0 ? (k === 0 ? "PENDING" : "PAID") : d < 3 ? pick(["PAID", "SHIPPED", "SHIPPED"] as const) : rand() < 0.07 ? "CANCELLED" : "DELIVERED";
            out.push(buildOrder(`LM-${++n}`, status, name, email, address, lines, minutes));
        }
    }
    return out;
}

ORDERS.push(...generatedOrders());
ORDERS.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export function historyFor(o: ApiOrder): OrderHistoryEntry[] {
    const placed = new Date(o.createdAt).getTime();
    const staff = { type: "STAFF" as const, id: 1, name: "Cindy Reyes" };
    const rows: OrderHistoryEntry[] = [{ id: 1, from: null, to: "PENDING", actor: { type: "CUSTOMER", id: 1, name: o.customerName }, note: null, createdAt: o.createdAt }];
    if (o.status === "CANCELLED") {
        rows.push({ id: 2, from: "PENDING", to: "CANCELLED", actor: { type: "SYSTEM", id: null, name: "System" }, note: "Unpaid for 24 hours", createdAt: new Date(placed + 24 * 3_600_000).toISOString() });
        return rows;
    }
    const reached = FLOW.indexOf(o.status);
    for (let i = 0; i <= reached; i++) {
        rows.push({ id: i + 2, from: i === 0 ? "PENDING" : FLOW[i - 1], to: FLOW[i], actor: staff, note: null, createdAt: new Date(placed + (i + 1) * 6 * 3_600_000).toISOString() });
    }
    return rows;
}

// ---- Customers, staff, sessions ---------------------------------------------------------------------------------------------

export const CUSTOMERS = [
    { id: 1, name: "Maria Santos", email: "maria.santos@example.com", createdAt: ago(DAY * 60), orders: 4 },
    { id: 2, name: "Angela Cruz", email: "angela.cruz@example.com", createdAt: ago(DAY * 48), orders: 1 },
    { id: 3, name: "Bea Lim", email: "bea.lim@example.com", createdAt: ago(DAY * 40), orders: 1 },
    { id: 4, name: "Carla Mendoza", email: "carla.m@example.com", createdAt: ago(DAY * 33), orders: 1 },
    { id: 5, name: "Denise Tan", email: "denise.tan@example.com", createdAt: ago(DAY * 29), orders: 1 },
    { id: 6, name: "Elaine Go", email: "elaine.go@example.com", createdAt: ago(DAY * 22), orders: 1 },
    { id: 7, name: "Faith Ramos", email: "faith.ramos@example.com", createdAt: ago(DAY * 17), orders: 1 },
    { id: 8, name: "Grace Uy", email: "grace.uy@example.com", createdAt: ago(DAY * 9), orders: 1 },
    ...["Kaye Dela Cruz", "Lara Gomez", "Maita Soriano", "Nina Valdez", "Olive Garcia", "Pia Navarro", "Quin Salazar", "Rhea Domingo", "Sam Ilagan", "Tessa Uy", "Vina Cortez", "Wendy Abad"].map((name, i) => ({
        id: 9 + i,
        name,
        email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
        // Spread over the last two weeks, a few today and yesterday.
        createdAt: ago([30, 200, 1500, 2000, 4000, 5500, 8000, 10000, 12000, 15000, 18000, 20000][i]),
        orders: 1,
    })),
];

export const STAFF = [
    { id: 1, name: "Cindy Reyes", email: "admin@cindyrella.ph", role: "ADMINISTRATOR" as "ADMINISTRATOR" | "STAFF", access: "Full access", photo: null as string | null, active: true, twoFactorEnabled: false },
    { id: 2, name: "Paolo Dizon", email: "paolo@cindyrella.ph", role: "STAFF" as "ADMINISTRATOR" | "STAFF", access: "Inventory", photo: null as string | null, active: true, twoFactorEnabled: true },
    { id: 3, name: "Rica Villanueva", email: "rica@cindyrella.ph", role: "STAFF" as "ADMINISTRATOR" | "STAFF", access: "Orders", photo: null as string | null, active: true, twoFactorEnabled: false },
    { id: 4, name: "Marco Aquino", email: "marco@cindyrella.ph", role: "STAFF" as "ADMINISTRATOR" | "STAFF", access: "Content", photo: null as string | null, active: false, twoFactorEnabled: false },
];

export const ADMIN_SESSIONS: AdminSessionInfo[] = [
    { id: "s1", userAgent: "Chrome 141 on Windows 11", ip: "203.0.113.24", createdAt: ago(60), lastSeenAt: ago(1), current: true },
    { id: "s2", userAgent: "Safari on iPhone", ip: "198.51.100.77", createdAt: ago(DAY * 2), lastSeenAt: ago(DAY), current: false },
];

export const ADMIN_NOTIFICATIONS = [
    { id: "order:LM-1014", type: "order" as const, text: "New order LM-1014 from Maria Santos", createdAt: ago(90), read: false, ref: "LM-1014" },
    { id: "order:LM-1013", type: "order" as const, text: "Payment screenshot uploaded for LM-1013", createdAt: ago(250), read: false, ref: "LM-1013" },
    { id: "inventory:5", type: "inventory" as const, text: "Barrier Repair Cream is out of stock", createdAt: ago(DAY), read: false },
    { id: "inventory:2", type: "inventory" as const, text: "Vitamin C Brightening Drop is running low (6 left)", createdAt: ago(DAY * 2), read: true },
];

// ---- Marketing, audit, messages ---------------------------------------------------------------------------------------------

export const VOUCHERS: AdminVoucher[] = [
    { id: 1, code: "WELCOME10", description: "10% off your first order", percentOff: 10, expiresAt: null, active: true, personalFor: null, maxUses: null, uses: 37 },
    { id: 2, code: "GLOW15", description: "15% off sets, October only", percentOff: 15, expiresAt: ahead(20), active: true, personalFor: null, maxUses: 100, uses: 12 },
    { id: 3, code: "MARIA-VIP", description: "Thank-you code for a loyal customer", percentOff: 20, expiresAt: ahead(60), active: true, personalFor: "maria.santos@example.com", maxUses: 1, uses: 0 },
    { id: 4, code: "SUMMER20", description: "Summer sale", percentOff: 20, expiresAt: ahead(-30), active: false, personalFor: null, maxUses: 200, uses: 143 },
];

export const AUDIT: AuditEntry[] = [
    { id: 1, entityType: "order", entityId: "LM-1010", action: "status.shipped", actor: { type: "STAFF", id: 3, name: "Rica Villanueva" }, details: { from: "PAID", to: "SHIPPED" }, createdAt: ago(DAY * 2) },
    { id: 2, entityType: "product", entityId: "1", action: "stock.restock", actor: { type: "STAFF", id: 1, name: "Cindy Reyes" }, details: { delta: 24 }, createdAt: ago(DAY * 2 + 30) },
    { id: 3, entityType: "voucher", entityId: "2", action: "voucher.create", actor: { type: "STAFF", id: 1, name: "Cindy Reyes" }, details: { code: "GLOW15" }, createdAt: ago(DAY * 5) },
    { id: 4, entityType: "staff", entityId: "4", action: "staff.deactivate", actor: { type: "STAFF", id: 1, name: "Cindy Reyes" }, details: null, createdAt: ago(DAY * 9) },
    { id: 5, entityType: "order", entityId: "LM-1003", action: "refund.record", actor: { type: "STAFF", id: 1, name: "Cindy Reyes" }, details: { amount: 2820 }, createdAt: ago(DAY * 17) },
    { id: 6, entityType: "content", entityId: "hero", action: "content.update", actor: { type: "STAFF", id: 4, name: "Marco Aquino" }, details: null, createdAt: ago(DAY * 20) },
];

const SUBSCRIBER_SEED: [string, string][] = [
    ["lia.fernandez@example.com", "footer"],
    ["ken.torres@example.com", "welcome-popup"],
    ["mia.castillo@example.com", "footer"],
    ["noel.bautista@example.com", "welcome-popup"],
    ["olive.garcia@example.com", "footer"],
    ["pia.navarro@example.com", "footer"],
    ["quin.salazar@example.com", "welcome-popup"],
    ["rhea.domingo@example.com", "footer"],
];
export const SUBSCRIBERS: SubscriberRow[] = SUBSCRIBER_SEED.map(([email, source], i) => ({ id: i + 1, email, source, createdAt: ago(DAY * (i * 3 + 1)) }));

export const CONTACT_MESSAGES: ContactMessageRow[] = [
    { id: 1, name: "Sofia Alvarez", email: "sofia.a@example.com", message: "Hi! Is the Barrier Repair Cream safe for sensitive, rosacea-prone skin? Also, when will it be back in stock?", createdAt: ago(300) },
    { id: 2, name: "Tina Lopez", email: "tina.lopez@example.com", message: "Do you ship to Palawan? And how long does it usually take?", createdAt: ago(DAY + 200) },
    { id: 3, name: "Uma Reyes", email: "uma.reyes@example.com", message: "Loved the Quiet Glow Gel Cream! Are you planning a larger size?", createdAt: ago(DAY * 4) },
];

const REVIEW_SEED: [number, string, number, string][] = [
    [1, "Maria S.", 5, "My skin has never looked this smooth. Three weeks in and the texture on my cheeks is gone."],
    [1, "Angela C.", 4, "Gentle for a retinol. A little tingling the first week, then nothing."],
    [2, "Bea L.", 5, "Brightened my dark spots noticeably. Smells clean, not like citrus candy."],
    [3, "Carla M.", 4, "Pores look smaller and my T-zone stays matte until the afternoon."],
    [4, "Denise T.", 5, "Perfect for humid weather. Sinks in instantly and I wear it under SPF every day."],
    [4, "Elaine G.", 5, "Best gel cream I've tried. Repurchasing."],
    [5, "Faith R.", 5, "Saved my skin after over-exfoliating. Redness gone in a week."],
    [6, "Grace U.", 4, "Wake up with soft skin. A bit rich for the summer months."],
    [7, "Hannah C.", 4, "Doesn't leave that tight feeling after a shower."],
    [8, "Isabel P.", 5, "Beautiful gift set and the full routine actually works."],
];
export const REVIEWS: Review[] = REVIEW_SEED.map(([productId, author, rating, text], i) => ({ id: i + 1, productId, author, rating, text, date: ago(DAY * (i * 2 + 2)).slice(0, 10) }));

// ---- Customer account ---------------------------------------------------------------------------------------------------------

export const ADDRESSES: Address[] = [
    { id: 1, label: "Home", text: "12 Acacia St, Brgy. San Antonio, Quezon City 1105", isDefault: true },
    { id: 2, label: "Office", text: "Unit 804, Ayala Tower One, Makati City 1226", isDefault: false },
];

export const MY_NOTIFICATIONS: CustomerNotification[] = [
    { id: 3, type: "order", title: "Your order is on its way", body: "LM-1010 has shipped and should arrive in 2-3 days.", href: "/account/purchases", read: false, createdAt: ago(DAY * 2) },
    { id: 2, type: "voucher", title: "A code just for you", body: "MARIA-VIP gives you 20% off your next order.", href: "/account/vouchers", read: false, createdAt: ago(DAY * 4) },
    { id: 1, type: "account", title: "Welcome to Cindyrella", body: "Your account is ready. Browse the shop to start your ritual.", href: "/shop", read: true, createdAt: ago(DAY * 60) },
];

export const MY_VOUCHERS = [
    { code: "MARIA-VIP", description: "Thank-you code for a loyal customer", percentOff: 20, expiresAt: VOUCHERS[2].expiresAt },
    { code: "GLOW15", description: "15% off sets, October only", percentOff: 15, expiresAt: VOUCHERS[1].expiresAt },
];

// ---- CMS content (only what the API stores; every other section keeps the app's built-in defaults) ---------------------------

export const PAYMENT_INSTRUCTIONS: PaymentInstructions = {
    intro: "Send the exact order total, then upload a screenshot of your receipt so we can verify it.",
    methods: [
        { id: "gcash", label: "GCash", accountName: "Cindy Reyes", accountNumber: "0917 000 0000", notes: "Use your order number as the reference." },
        { id: "maya", label: "Maya", accountName: "Cindy Reyes", accountNumber: "0918 000 0000", notes: "" },
        { id: "bank", label: "Bank transfer", accountName: "Cindyrella Skincare Inc.", accountNumber: "BDO 0012 3456 7890", notes: "Savings account." },
    ],
};
