"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useContent } from "@/library/content";
import { BlogPost } from "@/library/admin/types";
import SearchField from "@/components/admin/SearchField";
import { Toolbar, ToolbarFilters, FilterField, ListMeta } from "@/components/admin/Toolbar";
import Toggle from "@/components/ui/Toggle";
import Pagination from "@/components/ui/Pagination";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import BlogViewModal from "@/components/admin/modals/BlogViewModal";
import { BTN_ADD, ICON_BTN, ICON_BTN_DANGER, FILTER_SELECT } from "@/components/admin/formClasses";
import ListPanel from "@/components/admin/ListPanel";
import { EmptyStateRow } from "@/components/admin/EmptyState";
import { EditIcon, TrashIcon } from "@/components/admin/icons";

const PAGE_SIZE = 10;
type SortKey = "date-desc" | "date-asc" | "status";

export default function BlogTab() {
    const { blogPosts, updateBlogPost, deleteBlogPost, sectionVisibility, updateSectionVisibility } = useContent();
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<SortKey>("date-desc");
    const [page, setPage] = useState(1);
    const [viewing, setViewing] = useState<BlogPost | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const deleting = blogPosts.find((b) => b.id === deleteId) ?? null;

    const filtered = useMemo(() => {
        let list = blogPosts;
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((b) => b.title.toLowerCase().includes(q));
        }
        const sorted = [...list];
        switch (sort) {
            case "date-desc":
                sorted.sort((a, b) => b.date.localeCompare(a.date));
                break;
            case "date-asc":
                sorted.sort((a, b) => a.date.localeCompare(b.date));
                break;
            case "status":
                sorted.sort((a, b) => (a.status === b.status ? 0 : a.status === "Published" ? -1 : 1));
                break;
        }
        return sorted;
    }, [blogPosts, search, sort]);

    // Render-time reset to page 1 on filter change, rather than an effect (see InventoryPage).
    const filterKey = `${search}|${sort}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (filterKey !== prevFilterKey) {
        setPrevFilterKey(filterKey);
        setPage(1);
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <div>
            {/* The Journal section's visibility toggle (and its /journal page
                intro copy) live here rather than in the Pages list, since the
                Journal already has its own tab. The toggle gates only the
                homepage section — /journal itself stays live. */}
            <div className="mb-6 flex items-center justify-between gap-6 border border-ink/10 bg-white px-5 py-4">
                <div>
                    <div className="text-[13.5px] font-medium text-ink">Show the Journal section on the homepage</div>
                    <p className="mt-0.5 text-[12px] text-grey">
                        Hiding it also removes its link from the site navigation. The /journal page and its posts stay published.
                    </p>
                </div>
                <Toggle checked={sectionVisibility.journal} onChange={(v) => updateSectionVisibility("journal", v)} />
            </div>

            <div className="mb-6 flex items-center justify-between gap-6 border border-ink/10 bg-white px-5 py-4">
                <div>
                    <div className="text-[13.5px] font-medium text-ink">/journal page heading</div>
                    <p className="mt-0.5 text-[12px] text-grey">Edit the headline shown at the top of the Journal listing page.</p>
                </div>
                <Link href="/admin/content/pages/journal" className={`flex-none ${ICON_BTN}`} aria-label="Edit Journal page intro">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
                    </svg>
                </Link>
            </div>

            <Toolbar
                actions={
                    <Link href="/admin/content/blog/new" className={BTN_ADD}>
                        + New Post
                    </Link>
                }
                filters={
                    <ToolbarFilters>
                        <FilterField label="Search" className="min-w-[220px] flex-1">
                            <SearchField value={search} onChange={setSearch} placeholder="Search posts" className="w-full" />
                        </FilterField>
                        <FilterField label="Sort by" className="w-full flex-none sm:w-[170px]">
                            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`${FILTER_SELECT} w-full`}>
                                <option value="date-desc">Date (Newest)</option>
                                <option value="date-asc">Date (Oldest)</option>
                                <option value="status">Published First</option>
                            </select>
                        </FilterField>
                    </ToolbarFilters>
                }
            />

            <ListPanel minWidth={560}>
                    <thead>
                        <tr className="bg-off/50">
                            {["Title", "Status", "Date", ""].map((h) => (
                                <th key={h} scope="col" className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[11px] tracking-[.12em] text-grey uppercase">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 && (
                            <EmptyStateRow
                                colSpan={4}
                                variant={blogPosts.length === 0 ? "empty" : "filtered"}
                                message={blogPosts.length === 0 ? "No posts yet." : "No posts match this search."}
                            />
                        )}
                        {paged.map((b) => (
                            <tr key={b.id} className="transition hover:bg-off/40">
                                <td className="border-b border-ink/10 px-5 py-3.5 text-[13.5px] font-medium text-ink">
                                    <button onClick={() => setViewing(b)} className="block truncate text-left hover:text-pink-dark">
                                        {b.title}
                                    </button>
                                </td>
                                <td className="border-b border-ink/10 px-5 py-3.5">
                                    <Toggle
                                        checked={b.status === "Published"}
                                        onChange={(checked) => updateBlogPost(b.id, { status: checked ? "Published" : "Draft" })}
                                    />
                                </td>
                                <td className="border-b border-ink/10 px-5 py-3.5 font-mono text-[12px] text-grey">{b.date}</td>
                                <td className="border-b border-ink/10 px-5 py-3.5">
                                    <div className="flex items-center justify-end gap-2">
                                        <Tooltip label="Edit">
                                            <Link href={`/admin/content/blog/${b.id}`} aria-label="Edit post" className={ICON_BTN}>
                                                <EditIcon />
                                            </Link>
                                        </Tooltip>
                                        <Tooltip label="Remove">
                                            <button onClick={() => setDeleteId(b.id)} aria-label="Remove post" className={ICON_BTN_DANGER}>
                                                <TrashIcon />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
            </ListPanel>

            <ListMeta>Showing {filtered.length} of {blogPosts.length}</ListMeta>

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

            <BlogViewModal post={viewing} onClose={() => setViewing(null)} />

            <ConfirmModal
                open={deleteId !== null}
                title="Remove this post?"
                description={deleting ? `"${deleting.title}" will be removed from the Journal.` : undefined}
                onConfirm={() => deleteId !== null && deleteBlogPost(deleteId)}
                onClose={() => setDeleteId(null)}
            />
        </div>
    );
}
