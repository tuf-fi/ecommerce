"use client";

import ShippingReturnsPage from "@/components/pages/ShippingReturnsPage";
import { useContent } from "@/library/content";

export default function ShippingReturnsRoute() {
    const { pages } = useContent();
    const page = pages.find((p) => p.slug === "shipping-returns");
    if (!page) return null;

    return (
        <div className="-mx-8 w-[calc(100%+4rem)] min-h-screen bg-white px-8 pt-25 pb-20">
            <ShippingReturnsPage page={page} />
        </div>
    );
}
