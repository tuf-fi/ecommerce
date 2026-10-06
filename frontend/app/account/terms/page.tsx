"use client";

import TermsPage from "@/components/pages/TermsPage";
import { useContent } from "@/library/content";

export default function AccountTermsRoute() {
    const { pages } = useContent();
    const page = pages.find((p) => p.slug === "terms");
    if (!page) return null;

    return <TermsPage page={page} embedded />;
}
