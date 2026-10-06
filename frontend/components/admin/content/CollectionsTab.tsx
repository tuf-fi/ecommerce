"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SectionKey, useContent } from "@/library/content";
import Toggle from "@/components/ui/Toggle";
import Tooltip from "@/components/ui/Tooltip";
import SearchField from "@/components/admin/SearchField";
import { Toolbar, ToolbarFilters, FilterField, ListMeta } from "@/components/admin/Toolbar";
import { FILTER_SELECT, ICON_BTN } from "@/components/admin/formClasses";
import ListPanel from "@/components/admin/ListPanel";
import { EmptyStateRow } from "@/components/admin/EmptyState";
import { EditIcon } from "@/components/admin/icons";

type SortKey = "default" | "name";

type CollectionRow = {
    slug: string;
    name: string;
    sectionKey: SectionKey;
    count: number;
};

function rowHref(row: CollectionRow) {
    return `/admin/content/pages/${row.slug}`;
}

// Each of these is a list-backed homepage section (rituals, concern tags, FAQs, testimonials) with its own
// dedicated manager — this tab is just the directory, styled like PromotionsTab's list. Shop All has no list of
// its own (the grid pulls from Inventory), so its toggle lives in PagesTab instead, next to Best Sellers.
export default function CollectionsTab() {
    const { rituals, concerns, testimonials, faqs, sectionVisibility, updateSectionVisibility } = useContent();
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<SortKey>("default");

    const rows: CollectionRow[] = useMemo(
        () => [
            { slug: "rituals", name: "Rituals", sectionKey: "moments", count: rituals.length },
            { slug: "concerns", name: "Shop by Concern", sectionKey: "glossary", count: concerns.length },
            { slug: "faq", name: "FAQs", sectionKey: "faq", count: faqs.length },
            { slug: "testimonials", name: "Testimonials", sectionKey: "testimonials", count: testimonials.length },
        ],
        [rituals.length, concerns.length, faqs.length, testimonials.length]
    );

    const filtered = useMemo(() => {
        let list = rows;
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((r) => r.name.toLowerCase().includes(q));
        }
        if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        return list;
    }, [rows, search, sort]);

    return (
        <div>
            <Toolbar
                filters={
                    <ToolbarFilters>
                        <FilterField label="Search" className="min-w-[220px] flex-1">
                            <SearchField value={search} onChange={setSearch} placeholder="Search collections" className="w-full" />
                        </FilterField>
                        <FilterField label="Sort by" className="w-full flex-none sm:w-[170px]">
                            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`${FILTER_SELECT} w-full`}>
                                <option value="default">Default</option>
                                <option value="name">Name A–Z</option>
                            </select>
                        </FilterField>
                    </ToolbarFilters>
                }
            />

            <ListPanel minWidth={560}>
                <thead>
                    <tr className="bg-off/50">
                        {["Collection", "Items", "Visible", ""].map((h) => (
                            <th key={h} scope="col" className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[11px] tracking-[.12em] text-grey uppercase">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {filtered.length === 0 && <EmptyStateRow colSpan={4} variant="filtered" message="No collections match this search." />}
                    {filtered.map((row) => (
                        <tr key={row.slug} className="transition hover:bg-off/40">
                            <td className="border-b border-ink/10 px-5 py-3.5 text-[13.5px] font-medium text-ink">
                                <Link href={rowHref(row)} className="block">
                                    {row.name}
                                </Link>
                            </td>
                            <td className="border-b border-ink/10 px-5 py-3.5 font-mono text-[12px] text-grey">
                                {row.count} item{row.count === 1 ? "" : "s"}
                            </td>
                            <td className="border-b border-ink/10 px-5 py-3.5">
                                <Toggle checked={sectionVisibility[row.sectionKey]} onChange={(v) => updateSectionVisibility(row.sectionKey, v)} />
                            </td>
                            <td className="border-b border-ink/10 px-5 py-3.5">
                                <div className="flex justify-end">
                                    <Tooltip label="Edit">
                                        <Link href={rowHref(row)} aria-label={`Edit ${row.name}`} className={ICON_BTN}>
                                            <EditIcon />
                                        </Link>
                                    </Tooltip>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </ListPanel>

            <ListMeta>
                Showing {filtered.length} of {rows.length}
            </ListMeta>
        </div>
    );
}
