import type { Metadata } from "next";
import { STATIC_PAGES } from "@/library/admin/content";

const page = STATIC_PAGES.find((p) => p.slug === "privacy-policy");

export const metadata: Metadata = {
    title: page?.name ?? "Privacy Policy",
    description: page?.content.split("\n\n")[0],
};

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
    return children;
}
