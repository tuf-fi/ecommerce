import type { Metadata } from "next";
import { STATIC_PAGES } from "@/library/admin/content";

const page = STATIC_PAGES.find((p) => p.slug === "terms");

export const metadata: Metadata = {
    title: page?.name ?? "Terms of Service",
    description: page?.content,
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
