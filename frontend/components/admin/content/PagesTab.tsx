"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { SectionKey, useContent } from "@/library/content";
import { StaticPage } from "@/library/admin/types";
import Toggle from "@/components/ui/Toggle";
import Tooltip from "@/components/ui/Tooltip";
import StatusBadge from "@/components/admin/StatusBadge";
import { ICON_BTN } from "@/components/admin/formClasses";
import ListPanel from "@/components/admin/ListPanel";
import { EditIcon } from "@/components/admin/icons";

type PagesSection = "landing" | "pages" | "security" | "support";

const PAGES_SECTIONS: { key: PagesSection; label: string; category: string; caption: string; description: string }[] = [
    {
        key: "landing",
        label: "Landing Page Sections",
        category: "Landing Page",
        caption: "Homepage sections & toggles",
        description: "Sections shown on the homepage, in order. Toggle a section off to hide it from the site.",
    },
    {
        key: "pages",
        label: "Pages",
        category: "Pages",
        caption: "Shop, wishlist & cart",
        description: "Core shopping routes — headline and accent copy only.",
    },
    {
        key: "security",
        label: "Security",
        category: "Security",
        caption: "Privacy & terms",
        description: "Legal pages linked from the footer.",
    },
    {
        key: "support",
        label: "Support",
        category: "Support",
        caption: "Shipping & returns",
        description: "Customer support pages linked from the footer.",
    },
];

type PageRow = Pick<StaticPage, "slug" | "name" | "category"> & {
    updated?: string;
    // Set on rows that back a homepage section; absent on routes that can't be toggled off from here.
    sectionKey?: SectionKey;
    // False for a toggle-only row with no editor behind it. Defaults to true.
    hasEditor?: boolean;
};

// None of these are real StaticPage entries — each backs a different editor but still needs a row here to be reachable from one categorized list.
const HERO_ROW: PageRow = { slug: "hero", name: "Hero", category: "Landing Page", sectionKey: "hero" };
const ABOUT_ROW: PageRow = { slug: "about", name: "About", category: "Landing Page", sectionKey: "about" };
// Best Sellers is toggle-only: every string in that section is product data or fixed microcopy, so there's no editor to click through to.
const BEST_SELLERS_ROW: PageRow = {
    slug: "bestsellers",
    name: "Best Sellers",
    category: "Landing Page",
    sectionKey: "bestSellers",
    hasEditor: false,
};
const PHILOSOPHY_ROW: PageRow = { slug: "philosophy", name: "Philosophy", category: "Landing Page", sectionKey: "philosophy" };
// Toggle-only like Best Sellers: the grid pulls from Inventory and the CTA label has no admin editor of its own.
const SHOP_ALL_ROW: PageRow = {
    slug: "catalogue",
    name: "Shop All",
    category: "Landing Page",
    sectionKey: "catalogue",
    hasEditor: false,
};
const NEWSLETTER_ROW: PageRow = { slug: "newsletter", name: "Newsletter", category: "Landing Page", sectionKey: "newsletter" };
const SHOP_ROW: PageRow = { slug: "shop", name: "Shop", category: "Pages" };
const WISHLIST_ROW: PageRow = { slug: "wishlist", name: "Wishlist", category: "Pages" };
const CART_ROW: PageRow = { slug: "cart", name: "Cart", category: "Pages" };

// Contact and Journal are homepage sections too, but each has its own top-level tab, so their toggles live there instead.
// Rituals/Shop by Concern/FAQs/Testimonials live in their own "Content Collections" tab instead of here —
// each backs a list of repeatable items rather than a single fixed content block.
// Widths live on the header cells (not a <colgroup>), since the Last Updated column is removed below md and a colgroup would stay out of step.
const HEADER_WIDTH: Record<string, string> = {
    Page: "",
    "Last Updated": "hidden w-[180px] md:table-cell ",
    Visible: "w-[84px] sm:w-[104px] ",
    "": "w-[52px] sm:w-[76px] ",
};

const EXCLUDED_SLUGS = new Set(["faq"]);

function rowHref(row: PageRow) {
    return `/admin/content/pages/${row.slug}`;
}

export default function PagesTab() {
    const { pages, sectionVisibility, updateSectionVisibility } = useContent();
    const [section, setSection] = useState<PagesSection>("landing");

    const rowsByCategory = useMemo(() => {
        const rows: PageRow[] = [
            HERO_ROW,
            ABOUT_ROW,
            BEST_SELLERS_ROW,
            PHILOSOPHY_ROW,
            SHOP_ALL_ROW,
            NEWSLETTER_ROW,
            ...pages.filter((p) => !EXCLUDED_SLUGS.has(p.slug)),
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
        return byCategory;
    }, [pages]);

    const activeSection = PAGES_SECTIONS.find((s) => s.key === section)!;
    // Editable rows first, toggle-only rows clustered at the end — so which rows you can click into
    // isn't interspersed with which rows are display-only, without needing a separate view.
    const activeRows = useMemo(() => {
        const rows = rowsByCategory.get(activeSection.category) ?? [];
        return [...rows].sort((a, b) => Number(a.hasEditor === false) - Number(b.hasEditor === false));
    }, [rowsByCategory, activeSection.category]);
    const firstToggleOnlyIndex = activeRows.findIndex((p) => p.hasEditor === false);

    return (
        <div className="flex flex-col border border-ink/10 bg-white sm:flex-row sm:max-h-[70vh]">
            <div className="flex flex-none divide-x divide-ink/10 overflow-x-auto border-b border-ink/10 [scrollbar-width:none] sm:w-64 sm:overflow-visible [&::-webkit-scrollbar]:hidden sm:flex-col sm:divide-x-0 sm:divide-y sm:border-r sm:border-b-0">
                {PAGES_SECTIONS.map((s) => {
                    const active = section === s.key;
                    return (
                        <button
                            key={s.key}
                            onClick={() => setSection(s.key)}
                            className={`flex-none px-4 py-3.5 text-left whitespace-nowrap transition sm:px-5 sm:py-4 sm:whitespace-normal ${active ? "bg-navy" : "hover:bg-off/60"}`}
                        >
                            <div className={`text-[13.5px] font-medium ${active ? "text-white" : "text-ink"}`}>{s.label}</div>
                            <div className={`mt-0.5 hidden text-[11.5px] sm:block ${active ? "text-white/70" : "text-grey"}`}>{s.caption}</div>
                        </button>
                    );
                })}
            </div>

            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-7">
                <div className="mb-5">
                    <h3 className="m-0 text-[15px] font-medium text-ink">{activeSection.label}</h3>
                    <p className="mt-1 text-[12px] text-grey">{activeSection.description}</p>
                </div>

                <ListPanel minWidth={460}>
                    <thead>
                        <tr className="bg-off/50">
                            {["Page", "Last Updated", "Visible", ""].map((h) => (
                                <th
                                    key={h}
                                    scope="col"
                                    className={`${HEADER_WIDTH[h]}border-b border-ink/10 px-3 py-3.5 text-left sm:px-5 font-mono text-[11px] tracking-[.12em] text-grey uppercase`}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {activeRows.map((p, i) => (
                            <Fragment key={p.slug}>
                                {i === firstToggleOnlyIndex && i > 0 && (
                                    <tr aria-hidden="true">
                                        <td colSpan={4} className="border-b border-ink/10 bg-off/30 px-5 py-1.5 font-mono text-[10px] tracking-[.12em] text-grey uppercase">
                                            Display only — no editor
                                        </td>
                                    </tr>
                                )}
                                <tr className="transition hover:bg-off/40">
                                    <td className="border-b border-ink/10 px-3 py-3.5 text-[13.5px] font-medium whitespace-nowrap text-ink sm:px-5">
                                        {p.hasEditor === false ? (
                                            <span className="flex items-center gap-2 whitespace-nowrap">
                                                <span className="text-grey">{p.name}</span>
                                                <StatusBadge label="No editor" tone="neutral" />
                                            </span>
                                        ) : (
                                            <Link href={rowHref(p)} className="block">
                                                {p.name}
                                            </Link>
                                        )}
                                    </td>
                                    <td className="hidden border-b border-ink/10 px-5 py-3.5 font-mono text-[12px] text-grey md:table-cell">
                                        {p.updated ?? "—"}
                                    </td>
                                    {/* Reversible in one click, so no ConfirmModal — the
                                        confirm-before-delete rule is for one-way actions. */}
                                    <td className="border-b border-ink/10 px-3 py-3.5 sm:px-5">
                                        {p.sectionKey ? (
                                            <Toggle
                                                checked={sectionVisibility[p.sectionKey]}
                                                onChange={(v) => updateSectionVisibility(p.sectionKey!, v)}
                                            />
                                        ) : (
                                            <span className="font-mono text-[12px] text-grey">—</span>
                                        )}
                                    </td>
                                    <td className="border-b border-ink/10 px-2 py-3.5 sm:px-5">
                                        <div className="flex justify-end">
                                            {p.hasEditor !== false && (
                                                <Tooltip label="Edit">
                                                    <Link href={rowHref(p)} aria-label="Edit page" className={ICON_BTN}>
                                                        <EditIcon />
                                                    </Link>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            </Fragment>
                        ))}
                    </tbody>
                </ListPanel>
            </div>
        </div>
    );
}
