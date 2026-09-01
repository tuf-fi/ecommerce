import { StaticImageData } from "next/image";

export type AdminProduct = {
    id: number;
    name: string;
    sku: string;
    category: string;
    price: number;
    stock: number;
    expiry: string | null;
    image: StaticImageData | string;
};

export type StockLogEntry = {
    id: number;
    type: "in" | "out" | "adj";
    text: string;
    time: string;
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

export type NavLinkType = "category" | "page" | "custom";

export type NavMenuItem = {
    id: number;
    label: string;
    link: string;
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
