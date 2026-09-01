"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useContent } from "@/library/content";
import { StaticPage } from "@/library/admin/types";
import Tooltip from "@/components/ui/Tooltip";
import { ICON_BTN } from "@/components/admin/formClasses";

// Fixed display order for known categories — anything else (a category added
// later without updating this list) just gets appended after, so nothing
// silently disappears from the tab.
const CATEGORY_ORDER = ["Landing Page", "Security", "Pages", "Support"];

// None of these are real StaticPage entries — each backs a different kind of
// editor (Hero/intro content lives in its own `useContent()` state, and
// Testimonials has its own full CRUD screen) but still needs a row here so
// everything editable is reachable from one categorized list.
const HERO_ROW = { slug: "hero", name: "Hero", category: "Landing Page" };
const TESTIMONIALS_ROW = { slug: "testimonials", name: "Testimonials", category: "Landing Page" };
const SHOP_ROW = { slug: "shop", name: "Shop", category: "Pages" };
const WISHLIST_ROW = { slug: "wishlist", name: "Wishlist", category: "Pages" };
const CART_ROW = { slug: "cart", name: "Cart", category: "Pages" };

type PageRow = Pick<StaticPage, "slug" | "name" | "category"> & { updated?: string };

// Testimonials already has its own management screen under the Content
// page's "Testimonials" tab, so it routes there instead of the generic
// per-slug editor every other row uses.
function rowHref(row: PageRow) {
    if (row.slug === "testimonials") return "/admin/content?tab=testimonials";
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
    const { pages } = useContent();

    const groups = useMemo(() => {
        const rows: PageRow[] = [HERO_ROW, ...pages, TESTIMONIALS_ROW, SHOP_ROW, WISHLIST_ROW, CART_ROW];
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
                                    <col className="w-[76px]" />
                                </colgroup>
                                <thead>
                                    <tr className="bg-off/50">
                                        {["Page", "Last Updated", ""].map((h) => (
                                            <th
                                                key={h}
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
                                                <Link href={rowHref(p)} className="block">
                                                    {p.name}
                                                </Link>
                                            </td>
                                            <td className="border-b border-ink/10 px-5 py-3.5 font-mono text-[12px] text-grey">
                                                {p.updated ?? "—"}
                                            </td>
                                            <td className="border-b border-ink/10 px-5 py-3.5">
                                                <div className="flex justify-end">
                                                    <Tooltip label="Edit">
                                                        <Link href={rowHref(p)} aria-label="Edit page" className={ICON_BTN}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                                <path d="M12 20h9" />
                                                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
                                                            </svg>
                                                        </Link>
                                                    </Tooltip>
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
