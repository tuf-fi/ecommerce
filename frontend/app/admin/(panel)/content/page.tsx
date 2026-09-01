"use client";

import { useRouter, useSearchParams } from "next/navigation";
import PromotionsTab from "@/components/admin/content/PromotionsTab";
import PagesTab from "@/components/admin/content/PagesTab";
import NavigationTab from "@/components/admin/content/NavigationTab";
import BlogTab from "@/components/admin/content/BlogTab";
import TestimonialsTab from "@/components/admin/content/TestimonialsTab";

// "Testimonials" is deliberately not a button here — it's reached only via
// its row under the Pages tab's "Landing Page" category (same as Hero),
// but still needs to render when that row's link lands on ?tab=testimonials.
const TABS = [
    { key: "promotions", label: "Promotions" },
    { key: "pages", label: "Pages" },
    { key: "navigation", label: "Navigation" },
    { key: "blog", label: "Blog" },
] as const;

type TabKey = (typeof TABS)[number]["key"] | "testimonials";

export default function ContentPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const active = (searchParams.get("tab") as TabKey) ?? "pages";

    return (
        <div>
            <div className="mb-8 flex flex-wrap gap-x-7 gap-y-2 border-b border-ink/10 font-mono text-[11px] tracking-[.1em] uppercase">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => router.push(`/admin/content?tab=${t.key}`)}
                        className={`relative pb-2.5 transition ${active === t.key ? "text-pink-dark" : "text-grey hover:text-ink"}`}
                    >
                        {t.label}
                        {active === t.key && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-pink-dark" />}
                    </button>
                ))}
            </div>

            {active === "promotions" && <PromotionsTab />}
            {active === "pages" && <PagesTab />}
            {active === "navigation" && <NavigationTab />}
            {active === "blog" && <BlogTab />}
            {active === "testimonials" && <TestimonialsTab />}
        </div>
    );
}
