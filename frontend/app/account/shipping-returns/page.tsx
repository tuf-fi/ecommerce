"use client";

import LegalPage from "@/components/pages/LegalPage";
import { useContent } from "@/library/content";

export default function AccountShippingReturnsRoute() {
    const { pages } = useContent();
    const page = pages.find((p) => p.slug === "shipping-returns");
    if (!page) return null;

    return <LegalPage page={page} embedded />;
}
