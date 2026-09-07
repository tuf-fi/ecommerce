"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { useAdminStore, productStock, productStockStatus, productPriceRange, isExpiringSoon, daysUntilExpiry } from "@/library/adminStore";
import { CATEGORIES } from "@/library/products";
import { AdminProduct } from "@/library/admin/types";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import SearchField from "@/components/admin/SearchField";
import StatusBadge, { BadgeTone } from "@/components/admin/StatusBadge";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import ProductModal from "@/components/admin/modals/ProductModal";
import ProductViewModal from "@/components/admin/modals/ProductViewModal";
import BulkActionBar from "@/components/admin/BulkActionBar";
import { BTN_ADD, BTN_SECONDARY, ICON_BTN, ICON_BTN_DANGER, FILTER_SELECT } from "@/components/admin/formClasses";
import { toCsv, downloadCsv } from "@/library/admin/csv";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

type SortKey =
    | "default"
    | "name-asc"
    | "name-desc"
    | "price-asc"
    | "price-desc"
    | "stock-asc"
    | "stock-desc"
    | "expiring-soon";
type StockStatus = "in" | "low" | "out";

const STOCK_TONE: Record<StockStatus, BadgeTone> = { in: "success", low: "warning", out: "alert" };
const PAGE_SIZE = 10;

function EditIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16" />
            <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            <path d="M18 7l-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7" />
            <path d="M10 11v6M14 11v6" />
        </svg>
    );
}

function ImportIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 15V3" />
            <path d="M7 8l5-5 5 5" />
            <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
        </svg>
    );
}

function ExportIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3v12" />
            <path d="M7 10l5 5 5-5" />
            <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
        </svg>
    );
}

export default function InventoryPage() {
    const { products, addProduct, updateProduct, deleteProduct, bulkDeleteProducts } = useAdminStore();
    const mounted = useMounted();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get("q") ?? "");
    const [category, setCategory] = useState<string>("All");
    const [sort, setSort] = useState<SortKey>((searchParams.get("sort") as SortKey | null) ?? "default");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const [modalProduct, setModalProduct] = useState<AdminProduct | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [viewing, setViewing] = useState<AdminProduct | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const filtered = useMemo(() => {
        let list = products;
        if (category !== "All") list = list.filter((p) => p.category === category);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
        }
        const sorted = [...list];
        switch (sort) {
            case "name-asc":
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "name-desc":
                sorted.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case "price-asc":
                sorted.sort((a, b) => productPriceRange(a).min - productPriceRange(b).min);
                break;
            case "price-desc":
                sorted.sort((a, b) => productPriceRange(b).min - productPriceRange(a).min);
                break;
            case "stock-asc":
                sorted.sort((a, b) => productStock(a) - productStock(b));
                break;
            case "stock-desc":
                sorted.sort((a, b) => productStock(b) - productStock(a));
                break;
            case "expiring-soon":
                sorted.sort((a, b) => {
                    const da = daysUntilExpiry(a.expiry);
                    const db = daysUntilExpiry(b.expiry);
                    if (da === null) return db === null ? 0 : 1;
                    if (db === null) return -1;
                    return da - db;
                });
                break;
        }
        return sorted;
    }, [products, category, search, sort]);

    // Reset to page 1 whenever the filter set changes — a render-time state
    // adjustment (see https://react.dev/reference/react/useState#storing-information-from-previous-renders)
    // rather than an effect, since it only needs to run during the render
    // that changed the filters, not as a separate post-commit step.
    const filterKey = `${category}|${search}|${sort}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (filterKey !== prevFilterKey) {
        setPrevFilterKey(filterKey);
        setPage(1);
        if (selected.size > 0) setSelected(new Set());
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    useScrollTopOnChange(currentPage);

    const allOnPageSelected = paged.length > 0 && paged.every((p) => selected.has(p.id));
    function toggleRow(id: number) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }
    function toggleAllOnPage() {
        setSelected((prev) => {
            const next = new Set(prev);
            if (allOnPageSelected) paged.forEach((p) => next.delete(p.id));
            else paged.forEach((p) => next.add(p.id));
            return next;
        });
    }
    function clearSelection() {
        setSelected(new Set());
    }

    function csvColumns(): { header: string; value: (p: AdminProduct) => string | number }[] {
        return [
            { header: "Product name", value: (p) => p.name },
            { header: "SKU", value: (p) => p.sku },
            { header: "Category", value: (p) => p.category },
            { header: "Price Min", value: (p) => productPriceRange(p).min },
            { header: "Price Max", value: (p) => productPriceRange(p).max },
            { header: "Stock", value: (p) => productStock(p) },
            { header: "Status", value: (p) => productStockStatus(p) },
        ];
    }

    function exportSelected() {
        const rows = products.filter((p) => selected.has(p.id));
        const csv = toCsv(rows, csvColumns());
        downloadCsv(`inventory-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    }

    function exportFiltered() {
        const csv = toCsv(filtered, csvColumns());
        downloadCsv(`inventory-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    }

    function openAddModal() {
        setModalProduct(null);
        setModalOpen(true);
    }

    function openEditModal(p: AdminProduct) {
        setModalProduct(p);
        setModalOpen(true);
    }

    function handleSave(data: Omit<AdminProduct, "id">, id?: number) {
        if (id) updateProduct(id, data);
        else addProduct(data);
    }

    const deletingProduct = products.find((p) => p.id === deleteId) ?? null;

    if (!mounted) return <InventorySkeleton />;

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3.5">
                <div className="flex flex-1 flex-wrap items-center gap-3">
                    <SearchField value={search} onChange={setSearch} placeholder="Search by name or SKU" />
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={FILTER_SELECT}>
                        {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                                Category: {c}
                            </option>
                        ))}
                    </select>
                    <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={FILTER_SELECT}>
                        <option value="default">Sort: Default</option>
                        <option value="name-asc">Name (A–Z)</option>
                        <option value="name-desc">Name (Z–A)</option>
                        <option value="price-asc">Price (Low–High)</option>
                        <option value="price-desc">Price (High–Low)</option>
                        <option value="stock-asc">Stock (Low–High)</option>
                        <option value="stock-desc">Stock (High–Low)</option>
                        <option value="expiring-soon">Expiring Soon First</option>
                    </select>
                </div>
                <div className="flex flex-none items-center gap-2.5">
                    {/* TODO: wire up Excel import (parse + validate rows into products) and
                        export (products -> .xlsx download) — UI only for now. */}
                    <button onClick={() => toast.info("Import isn't wired up yet.")} className={BTN_SECONDARY}>
                        <ImportIcon />
                        Import
                    </button>
                    <button onClick={exportFiltered} className={BTN_SECONDARY}>
                        <ExportIcon />
                        Export
                    </button>
                    <button onClick={openAddModal} className={BTN_ADD}>
                        + Add Product
                    </button>
                </div>
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse">
                    <thead>
                            <tr className="bg-off/50">
                                <th scope="col" className="w-11 border-b border-ink/10 px-5 py-3.5">
                                    <input
                                        type="checkbox"
                                        checked={allOnPageSelected}
                                        onChange={toggleAllOnPage}
                                        aria-label="Select all products on this page"
                                        className="h-4 w-4 accent-pink-btn"
                                    />
                                </th>
                                {["Product", "Category", "Price", "Stock", "Status", ""].map((h) => (
                                    <th key={h} scope="col" className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[10px] tracking-[.12em] text-grey uppercase">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-16 text-center text-[13px] text-grey">
                                        No products match this filter.
                                    </td>
                                </tr>
                            )}
                            {paged.map((p) => {
                                const status = productStockStatus(p);
                                const { min, max } = productPriceRange(p);
                                return (
                                    <tr
                                        key={p.id}
                                        onClick={() => setViewing(p)}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`View ${p.name}`}
                                        onKeyDown={(e) => {
                                            if ((e.key === "Enter" || e.key === " ") && !(e.target instanceof HTMLInputElement)) {
                                                e.preventDefault();
                                                setViewing(p);
                                            }
                                        }}
                                        className="cursor-pointer transition hover:bg-off/40"
                                    >
                                        <td className="border-b border-ink/10 px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selected.has(p.id)}
                                                onChange={() => toggleRow(p.id)}
                                                aria-label={`Select ${p.name}`}
                                                className="h-4 w-4 accent-pink-btn"
                                            />
                                        </td>
                                        <td className="border-b border-ink/10 px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-11 w-11 flex-none overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft">
                                                    <Image src={p.image} alt="" fill sizes="44px" unoptimized={typeof p.image === "string"} className="object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="truncate text-[13.5px] font-medium text-ink">{p.name}</div>
                                                    <div className="font-mono text-[11px] text-grey">{p.sku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="border-b border-ink/10 px-5 py-3 text-[13px] text-ink">{p.category}</td>
                                        <td className="border-b border-ink/10 px-5 py-3 font-mono text-[12.5px] text-ink">
                                            {min === max ? `₱${min.toLocaleString()}` : `₱${min.toLocaleString()}–₱${max.toLocaleString()}`}
                                        </td>
                                        <td className="border-b border-ink/10 px-5 py-3 font-mono text-[12.5px] text-ink">{productStock(p)}</td>
                                        <td className="border-b border-ink/10 px-5 py-3">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <StatusBadge label={status === "in" ? "In stock" : status === "low" ? "Low stock" : "Out of stock"} tone={STOCK_TONE[status]} />
                                                {isExpiringSoon(p.expiry) && <StatusBadge label="Expiring soon" tone="warning" />}
                                            </div>
                                        </td>
                                        <td className="border-b border-ink/10 px-5 py-3">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Tooltip label="Edit">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditModal(p);
                                                        }}
                                                        aria-label="Edit product"
                                                        className={ICON_BTN}
                                                    >
                                                        <EditIcon />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip label="Delete">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteId(p.id);
                                                        }}
                                                        aria-label="Delete product"
                                                        className={ICON_BTN_DANGER}
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
              </div>
            </div>

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

            <BulkActionBar count={selected.size} onClear={clearSelection}>
                <button
                    onClick={() => setBulkDeleteOpen(true)}
                    className="flex h-9 items-center border border-alert/50 px-3.5 text-[12px] font-semibold text-alert transition hover:bg-alert hover:text-white"
                >
                    Delete selected
                </button>
                <button
                    onClick={exportSelected}
                    className="flex h-9 items-center border border-white/25 px-3.5 text-[12px] font-semibold text-white transition hover:border-white hover:bg-white/10"
                >
                    Export CSV
                </button>
            </BulkActionBar>

            <ProductViewModal open={viewing !== null} product={viewing} onClose={() => setViewing(null)} />

            {modalOpen && <ProductModal product={modalProduct} products={products} onClose={() => setModalOpen(false)} onSave={handleSave} />}

            <ConfirmModal
                open={deleteId !== null}
                title="Remove this product?"
                description={deletingProduct ? `"${deletingProduct.name}" will be removed from the catalogue.` : undefined}
                onConfirm={() => deleteId !== null && deleteProduct(deleteId)}
                onClose={() => setDeleteId(null)}
            />

            <ConfirmModal
                open={bulkDeleteOpen}
                title="Remove these products?"
                description={`${selected.size} product${selected.size === 1 ? "" : "s"} will be removed from the catalogue.`}
                onConfirm={() => {
                    bulkDeleteProducts(Array.from(selected));
                    clearSelection();
                }}
                onClose={() => setBulkDeleteOpen(false)}
            />
        </div>
    );
}

// Mirrors the populated inventory page — search/category/sort toolbar with
// Import/Export/Add actions, and the product table with pagination.
function InventorySkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3.5">
                <div className="flex flex-1 flex-wrap items-center gap-3">
                    <Skeleton tone="outline" className="h-11 w-64" />
                    <Skeleton tone="outline" className="h-11 w-40" />
                    <Skeleton tone="outline" className="h-11 w-44" />
                </div>
                <div className="flex flex-none items-center gap-2.5">
                    <Skeleton tone="outline" className="h-11 w-28" />
                    <Skeleton tone="outline" className="h-11 w-28" />
                    <Skeleton tone="outline" className="h-11 w-36" />
                </div>
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white">
                <div className="border-b border-ink/10 bg-off/50 px-5 py-3.5">
                    <Skeleton tone="soft" className="h-[10px] w-full" />
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 border-b border-ink/10 px-5 py-3 last:border-b-0">
                        <Skeleton tone="outline" className="h-4 w-4 flex-none" />
                        <Skeleton tone="faint" className="h-11 w-11 flex-none" />
                        <div className="min-w-0 flex-1">
                            <Skeleton className="h-[13.5px] w-32" />
                            <Skeleton tone="soft" className="mt-1.5 h-[11px] w-20" />
                        </div>
                        <Skeleton className="h-[13px] w-16" />
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-10" />
                        <Skeleton tone="outline" className="h-[19px] w-20 rounded-pill" />
                        <div className="flex items-center gap-1.5">
                            <Skeleton tone="outline" className="h-8 w-8 rounded-full" />
                            <Skeleton tone="outline" className="h-8 w-8 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-center gap-1.5">
                <Skeleton tone="outline" className="h-8 w-20" />
                <Skeleton tone="outline" className="h-8 w-8" />
                <Skeleton tone="outline" className="h-8 w-8" />
                <Skeleton tone="outline" className="h-8 w-8" />
                <Skeleton tone="outline" className="h-8 w-16" />
            </div>
        </SkeletonGroup>
    );
}
