import type { Metadata } from "next";
import { STATIC_PAGES } from "@/library/admin/content";

const page = STATIC_PAGES.find((p) => p.slug === "shipping-returns");

export const metadata: Metadata = {
    title: page?.name ?? "Shipping & Returns",
    description: page?.content,
};

export default function ShippingReturnsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
