"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAdminStore, stockStatus } from "@/library/adminStore";
import { CATEGORIES } from "@/library/products";
import { AdminProduct } from "@/library/admin/types";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import SearchField from "@/components/admin/SearchField";
import StatusBadge, { BadgeTone } from "@/components/admin/StatusBadge";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import ProductModal from "@/components/admin/modals/ProductModal";
import { BTN_ADD, ICON_BTN, ICON_BTN_DANGER, FILTER_SELECT } from "@/components/admin/formClasses";

type SortKey = "default" | "name-asc" | "name-desc" | "price-asc" | "price-desc" | "stock-asc" | "stock-desc";
type StockFilter = "in" | "low" | "out";

const STOCK_LABEL: Record<StockFilter, string> = { in: "In Stock", low: "Low Stock", out: "Out of Stock" };
const STOCK_TONE: Record<StockFilter, BadgeTone> = { in: "success", low: "warning", out: "alert" };
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

export default function InventoryPage() {
    const { products, addProduct, updateProduct, deleteProduct } = useAdminStore();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get("q") ?? "");
    const [category, setCategory] = useState<string>("All");
    const [sort, setSort] = useState<SortKey>("default");
    const [stockFilter, setStockFilter] = useState<StockFilter | null>(
        (searchParams.get("stock") as StockFilter | null) ?? null
    );
    const [page, setPage] = useState(1);

    const [modalProduct, setModalProduct] = useState<AdminProduct | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const filtered = useMemo(() => {
        let list = products;
        if (category !== "All") list = list.filter((p) => p.category === category);
        if (stockFilter) list = list.filter((p) => stockStatus(p.stock) === stockFilter);
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
                sorted.sort((a, b) => a.price - b.price);
                break;
            case "price-desc":
                sorted.sort((a, b) => b.price - a.price);
                break;
            case "stock-asc":
                sorted.sort((a, b) => a.stock - b.stock);
                break;
            case "stock-desc":
                sorted.sort((a, b) => b.stock - a.stock);
                break;
        }
        return sorted;
    }, [products, category, stockFilter, search, sort]);

    // Reset to page 1 whenever the filter set changes — a render-time state
    // adjustment (see https://react.dev/reference/react/useState#storing-information-from-previous-renders)
    // rather than an effect, since it only needs to run during the render
    // that changed the filters, not as a separate post-commit step.
    const filterKey = `${category}|${stockFilter}|${search}|${sort}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (filterKey !== prevFilterKey) {
        setPrevFilterKey(filterKey);
        setPage(1);
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    useScrollTopOnChange(currentPage);

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

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-1 flex-wrap items-center gap-2.5">
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
                    </select>
                    {stockFilter && (
                        <button
                            onClick={() => setStockFilter(null)}
                            className="flex items-center gap-1.5 rounded-pill bg-pink px-3.5 py-1.5 text-[11.5px] font-medium text-white"
                        >
                            {STOCK_LABEL[stockFilter]} ×
                        </button>
                    )}
                </div>
                <button onClick={openAddModal} className={`flex-none ${BTN_ADD}`}>
                    + Add Product
                </button>
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white">
                <table className="w-full border-collapse">
                    <thead>
                            <tr className="bg-off/50">
                                {["Product", "Category", "Price", "Stock", "Expiry", "Status", ""].map((h) => (
                                    <th key={h} className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[10px] tracking-[.12em] text-grey uppercase">
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
                                const status = stockStatus(p.stock);
                                return (
                                    <tr key={p.id} className="transition hover:bg-off/40">
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
                                        <td className="border-b border-ink/10 px-5 py-3 font-mono text-[12.5px] text-ink">₱{p.price.toLocaleString()}</td>
                                        <td className="border-b border-ink/10 px-5 py-3 font-mono text-[12.5px] text-ink">{p.stock}</td>
                                        <td className="border-b border-ink/10 px-5 py-3 font-mono text-[12px] text-grey">{p.expiry ?? "—"}</td>
                                        <td className="border-b border-ink/10 px-5 py-3">
                                            <StatusBadge label={status === "in" ? "In stock" : status === "low" ? "Low stock" : "Out of stock"} tone={STOCK_TONE[status]} />
                                        </td>
                                        <td className="border-b border-ink/10 px-5 py-3">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Tooltip label="Edit">
                                                    <button onClick={() => openEditModal(p)} aria-label="Edit product" className={ICON_BTN}>
                                                        <EditIcon />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip label="Delete">
                                                    <button onClick={() => setDeleteId(p.id)} aria-label="Delete product" className={ICON_BTN_DANGER}>
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

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

            {modalOpen && <ProductModal product={modalProduct} onClose={() => setModalOpen(false)} onSave={handleSave} />}

            <ConfirmModal
                open={deleteId !== null}
                title="Remove this product?"
                description={deletingProduct ? `"${deletingProduct.name}" will be removed from the catalogue.` : undefined}
                onConfirm={() => deleteId !== null && deleteProduct(deleteId)}
                onClose={() => setDeleteId(null)}
            />
        </div>
    );
}
