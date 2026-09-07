"use client";

import { useMemo } from "react";
import Link from "next/link";
import { SectionKey, useContent } from "@/library/content";
import { StaticPage } from "@/library/admin/types";
import Toggle from "@/components/ui/Toggle";
import Tooltip from "@/components/ui/Tooltip";
import StatusBadge from "@/components/admin/StatusBadge";
import { ICON_BTN } from "@/components/admin/formClasses";

// Fixed display order for known categories — anything else (a category added
// later without updating this list) just gets appended after, so nothing
// silently disappears from the tab.
const CATEGORY_ORDER = ["Landing Page", "Security", "Pages", "Support"];

type PageRow = Pick<StaticPage, "slug" | "name" | "category"> & {
    updated?: string;
    // Set on rows that back a homepage section — this is what the Visible
    // column toggles. Absent on the Shop/Wishlist/Cart intros and the static
    // pages, which are routes of their own rather than sections of the
    // homepage, and so can't be switched off from here.
    sectionKey?: SectionKey;
    // False for a row that exists only to carry that toggle, with no editor
    // behind it. Defaults to true.
    hasEditor?: boolean;
};

// None of these are real StaticPage entries — each backs a different kind of
// editor (Hero/About/intro content lives in its own `useContent()` state, and
// Testimonials/Rituals/Concerns each have their own full CRUD screen) but
// still needs a row here so everything editable is reachable from one
// categorized list. The Landing Page rows are ordered the way the homepage
// itself renders them.
const HERO_ROW: PageRow = { slug: "hero", name: "Hero", category: "Landing Page", sectionKey: "hero" };
const ABOUT_ROW: PageRow = { slug: "about", name: "About", category: "Landing Page", sectionKey: "about" };
// Best Sellers is the one toggle-only row: every string in that section is
// product data or fixed microcopy, so there's no editor to click through to.
const BEST_SELLERS_ROW: PageRow = {
    slug: "bestsellers",
    name: "Best Sellers",
    category: "Landing Page",
    sectionKey: "bestSellers",
    hasEditor: false,
};
const RITUALS_ROW: PageRow = { slug: "rituals", name: "Rituals", category: "Landing Page", sectionKey: "moments" };
const PHILOSOPHY_ROW: PageRow = { slug: "philosophy", name: "Philosophy", category: "Landing Page", sectionKey: "philosophy" };
const CONCERNS_ROW: PageRow = { slug: "concerns", name: "Shop by Concern", category: "Landing Page", sectionKey: "glossary" };
const CATALOGUE_ROW: PageRow = { slug: "catalogue", name: "Shop All", category: "Landing Page", sectionKey: "catalogue" };
const TESTIMONIALS_ROW: PageRow = { slug: "testimonials", name: "Testimonials", category: "Landing Page", sectionKey: "testimonials" };
const NEWSLETTER_ROW: PageRow = { slug: "newsletter", name: "Newsletter", category: "Landing Page", sectionKey: "newsletter" };
const SHOP_ROW: PageRow = { slug: "shop", name: "Shop", category: "Pages" };
const WISHLIST_ROW: PageRow = { slug: "wishlist", name: "Wishlist", category: "Pages" };
const CART_ROW: PageRow = { slug: "cart", name: "Cart", category: "Pages" };

// Contact and Journal are homepage sections too, but each already has its own
// top-level tab, so their toggles live there rather than being duplicated here.

function rowHref(row: PageRow) {
    return `/admin/content/pages/${row.slug}`;
}

function sortCategories(categories: string[]) {
    return [...categories].sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a);
        const bi = CATEGORY_ORDER.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });
}

export default function PagesTab() {
    const { pages, sectionVisibility, updateSectionVisibility } = useContent();

    const groups = useMemo(() => {
        const rows: PageRow[] = [
            HERO_ROW,
            ABOUT_ROW,
            BEST_SELLERS_ROW,
            RITUALS_ROW,
            PHILOSOPHY_ROW,
            CONCERNS_ROW,
            CATALOGUE_ROW,
            // The FAQ is a real StaticPage row but also a homepage section, so
            // it picks up a sectionKey on the way through.
            ...pages.map((p) => (p.slug === "faq" ? { ...p, sectionKey: "faq" as const } : p)),
            TESTIMONIALS_ROW,
            NEWSLETTER_ROW,
            SHOP_ROW,
            WISHLIST_ROW,
            CART_ROW,
        ];
        const byCategory = new Map<string, PageRow[]>();
        for (const row of rows) {
            const list = byCategory.get(row.category) ?? [];
            list.push(row);
            byCategory.set(row.category, list);
        }
        return sortCategories([...byCategory.keys()]).map((category) => ({
            category,
            rows: byCategory.get(category)!,
        }));
    }, [pages]);

    return (
        <div>
            <div className="mb-5 flex items-center justify-between">
                <h3 className="m-0 text-[15px] font-medium text-ink">Static Pages</h3>
                <span className="font-mono text-[11px] text-grey">Editable without a developer</span>
            </div>

            <div className="space-y-8">
                {groups.map(({ category, rows }) => (
                    <div key={category}>
                        <div className="mb-2 font-mono text-[10px] tracking-[.14em] text-grey uppercase">{category}</div>
                        <div className="overflow-hidden border border-ink/10 bg-white">
                            <table className="w-full table-fixed border-collapse">
                                <colgroup>
                                    <col />
                                    <col className="w-[180px]" />
                                    <col className="w-[92px]" />
                                    <col className="w-[76px]" />
                                </colgroup>
                                <thead>
                                    <tr className="bg-off/50">
                                        {["Page", "Last Updated", "Visible", ""].map((h) => (
                                            <th
                                                key={h}
                                                scope="col"
                                                className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[10px] tracking-[.12em] text-grey uppercase"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((p) => (
                                        <tr key={p.slug} className="transition hover:bg-off/40">
                                            <td className="border-b border-ink/10 px-5 py-3.5 text-[13.5px] font-medium text-ink">
                                                {p.hasEditor === false ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="text-grey">{p.name}</span>
                                                        <StatusBadge label="No editor" tone="neutral" />
                                                    </span>
                                                ) : (
                                                    <Link href={rowHref(p)} className="block">
                                                        {p.name}
                                                    </Link>
                                                )}
                                            </td>
                                            <td className="border-b border-ink/10 px-5 py-3.5 font-mono text-[12px] text-grey">
                                                {p.updated ?? "—"}
                                            </td>
                                            {/* Reversible in one click, so no ConfirmModal — the
                                                confirm-before-delete rule is for one-way actions. */}
                                            <td className="border-b border-ink/10 px-5 py-3.5">
                                                {p.sectionKey ? (
                                                    <Toggle
                                                        checked={sectionVisibility[p.sectionKey]}
                                                        onChange={(v) => updateSectionVisibility(p.sectionKey!, v)}
                                                    />
                                                ) : (
                                                    <span className="font-mono text-[12px] text-grey">—</span>
                                                )}
                                            </td>
                                            <td className="border-b border-ink/10 px-5 py-3.5">
                                                <div className="flex justify-end">
                                                    {p.hasEditor !== false && (
                                                        <Tooltip label="Edit">
                                                            <Link href={rowHref(p)} aria-label="Edit page" className={ICON_BTN}>
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                                    <path d="M12 20h9" />
                                                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
                                                                </svg>
                                                            </Link>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
