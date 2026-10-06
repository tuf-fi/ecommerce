"use client";

import PrivacyPolicyPage from "@/components/pages/PrivacyPolicyPage";
import { useContent } from "@/library/content";

export default function AccountPrivacyPolicyRoute() {
    const { pages } = useContent();
    const page = pages.find((p) => p.slug === "privacy-policy");
    if (!page) return null;

    return <PrivacyPolicyPage page={page} embedded />;
}
