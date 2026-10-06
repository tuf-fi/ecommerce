import { StaticImageData } from "next/image";
import { ProductSize } from "../products";
import { SectionKey } from "./sections";
import type { PaymentState, ProofInfo } from "../orders";

export type AdminProduct = {
    id: number;
    name: string;
    sku: string;
    category: string;
    price: number;
    stock: number;
    expiry: string | null;
    image: StaticImageData | string;
    // Optional size choices; when present, `price`/`stock` above become the starting-from price and total across sizes.
    sizes?: ProductSize[];
    // Units-remaining "low stock" cutoff per product/size; falls back to LOW_STOCK_THRESHOLD when unset.
    reorderThreshold?: number;
    // The product version this copy was loaded at; an edit is rejected if someone else has saved since.
    version?: number;
};

export type StockLogEntry = {
    id: number;
    type: "in" | "out" | "adj";
    text: string;
    time: string;
    actor: string;
};

export type AdminOrderStatus = "Pending" | "Paid" | "Shipped" | "Delivered" | "Cancelled";

// `name`/`unitPrice` are snapshotted on real orders so later catalogue edits don't rewrite history.
export type AdminOrderLine = { productId: number; qty: number; name?: string; unitPrice?: number };

export type AdminOrder = {
    no: string;
    customer: string;
    email: string;
    address: string;
    date: string;
    status: AdminOrderStatus;
    items: AdminOrderLine[];
    total?: number;
    // When the order was placed (ISO); `date` above is only for display.
    createdAt?: string;
    // The money breakdown fixed when the order was placed (total = subtotal - discount + shippingFee).
    subtotal?: number;
    discount?: number;
    shippingFee?: number;
    voucherCode?: string;
    paidAt?: string;
    // Set once an administrator records that the money was sent back.
    refund?: { at: string; amount: number; note: string | null };
    payment?: { state: PaymentState; proofs: ProofInfo[] };
};

// A registered storefront customer, not a StaffMember (admin login); `createdAt` is an ISO `YYYY-MM-DD` signup date.
export type AdminUser = {
    id: number;
    name: string;
    email: string;
    createdAt: string;
};

export type StaffRole = "Administrator" | "Staff";

export type StaffMember = {
    id: number;
    name: string;
    email: string;
    role: StaffRole;
    access: string;
    photo?: string;
    // Deactivated accounts can't sign in. Both are reported by the server.
    active?: boolean;
    twoFactorEnabled?: boolean;
};

export type NotificationType = "order" | "inventory" | "staff";

export type AdminNotification = {
    // Stable key from the server (e.g. "order:LM-1001"), which is also what "mark as read" sends back.
    id: string;
    text: string;
    time: string;
    read: boolean;
    type: NotificationType;
    ref?: string;
};

export type Promo = {
    id: number;
    text: string;
    code: string;
    image: string | null;
    active: boolean;
};

export type StaticPage = {
    id: number;
    slug: string;
    name: string;
    category: string;
    updated: string;
    content: string;
};

// Points at a homepage section by key, not a raw href, so the anchor can't go stale and a disabled section can be filtered — see Navbar.
export type SiteNavLink = {
    id: number;
    label: string;
    section: SectionKey;
    // Desktop only — tucks the link under the nav's "More" dropdown; the mobile menu ignores this and shows the full flat list.
    group?: "more";
};

// A plain label/href pair, since the footer also points at routes and static pages, not just homepage anchors.
export type FooterLinkItem = {
    id: number;
    label: string;
    href: string;
};

export type Ritual = {
    id: number;
    eyebrow: string;
    title: string;
    copy: string;
    image: StaticImageData | string | null;
    // The Product.id's that make this ritual a shoppable bundle, not just a card — what "Shop Now" adds to the bag.
    productIds: number[];
};

export type Concern = {
    id: number;
    // Stable id (see Product.concerns), kept separate from `title` so renaming a concern in the CMS can't break tagged products.
    key: string;
    title: string;
    image: StaticImageData | string | null;
};

export type BlogStatus = "Draft" | "Published";

export type BlogPost = {
    id: number;
    title: string;
    excerpt: string;
    content: string;
    status: BlogStatus;
    date: string;
    image: StaticImageData | string | null;
};

export type Faq = {
    id: number;
    q: string;
    a: string;
};

export type Testimonial = {
    id: number;
    image: string | null;
    name: string;
    company: string;
    position: string;
    message: string;
};
