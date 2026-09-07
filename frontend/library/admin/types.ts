import { StaticImageData } from "next/image";
import { ProductSize } from "../products";
import { SectionKey } from "./sections";

export type AdminProduct = {
    id: number;
    name: string;
    sku: string;
    category: string;
    price: number;
    stock: number;
    expiry: string | null;
    image: StaticImageData | string;
    // Optional size choices (e.g. 30ml/50ml), each with its own price and
    // stock. When present, `price`/`stock` above are kept as the
    // starting-from price and the total stock across all sizes.
    sizes?: ProductSize[];
    // Units-remaining cutoff for "low stock" on this product (and each of its
    // sizes, if any). Falls back to LOW_STOCK_THRESHOLD when unset — fast
    // movers and niche items don't share one sensible reorder point.
    reorderThreshold?: number;
};

export type StockLogEntry = {
    id: number;
    type: "in" | "out" | "adj";
    text: string;
    time: string;
    actor: string;
};

export type AdminOrderStatus = "Pending" | "Paid" | "Shipped" | "Delivered" | "Cancelled";

export type AdminOrderLine = { productId: number; qty: number };

export type AdminOrder = {
    no: string;
    customer: string;
    email: string;
    address: string;
    date: string;
    status: AdminOrderStatus;
    items: AdminOrderLine[];
};

// A registered storefront customer account, as opposed to a StaffMember (an
// admin-panel login). `createdAt` is an ISO `YYYY-MM-DD` signup date.
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
};

export type NotificationType = "order" | "inventory" | "staff";

export type AdminNotification = {
    id: number;
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

// A link in the site's primary navigation. Points at a homepage section by
// key rather than at a raw href so the anchor can never go stale (the real id
// lives in one place, SECTION_ANCHOR_ID) and so a link to a section that's
// been switched off can be filtered out automatically — see Navbar.
export type SiteNavLink = {
    id: number;
    label: string;
    section: SectionKey;
    // Desktop only: "more" links are tucked under the nav's "More" dropdown to
    // keep the inline row short. The mobile menu ignores this and always
    // renders the full flat list.
    group?: "more";
};

// A footer link — a plain label/href pair, since the footer legitimately
// points at other routes and static pages, not just homepage anchors.
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
    // The specific products (by Product.id, see library/products.ts) that make
    // up this routine — what actually makes a ritual a shoppable bundle
    // instead of just a decorative card, and what "Shop Now" adds to the bag.
    productIds: number[];
};

export type Concern = {
    id: number;
    // Stable identifier used to tag products (Product.concerns in
    // library/products.ts) and to build the /shop?concern= filter link.
    // Kept separate from `title` so renaming a concern in the CMS can't
    // silently break every product already tagged with it.
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
