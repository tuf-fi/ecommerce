"use client";

import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { useAdminStore, productStock, productStockStatus, productPriceRange, productSalePrice, isExpiringSoon, daysUntilExpiry } from "@/library/adminStore";
import { CATEGORIES } from "@/library/products";
import { CATEGORY_DEFAULT_IMAGE, DEFAULT_PRODUCT_IMAGE } from "@/library/admin/products";
import { AdminProduct } from "@/library/admin/types";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import SearchField from "@/components/admin/SearchField";
import { Toolbar, ToolbarFilters, FilterField } from "@/components/admin/Toolbar";
import StatusBadge, { BadgeTone } from "@/components/admin/StatusBadge";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import ProductModal from "@/components/admin/modals/ProductModal";
import type { StockReason } from "@/library/api/products";
import ProductViewModal from "@/components/admin/modals/ProductViewModal";
import BulkEditProductsModal from "@/components/admin/modals/BulkEditProductsModal";
import BulkActionBar from "@/components/admin/BulkActionBar";
import { BTN_ADD, BTN_SECONDARY, ICON_BTN, ICON_BTN_DANGER, FILTER_SELECT, BTN_BULK_PRIMARY, BTN_BULK_DANGER, BTN_BULK_SECONDARY } from "@/components/admin/formClasses";
import { toCsv, parseCsv, downloadCsv } from "@/library/admin/csv";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup, SkeletonToolbar } from "@/components/ui/Skeleton";
import ListPanel from "@/components/admin/ListPanel";
import { EmptyStateRow } from "@/components/admin/EmptyState";
import { EditIcon, TrashIcon, ImportIcon, ExportIcon } from "@/components/admin/icons";

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

export default function InventoryPage() {
    const { products, addProduct, bulkAddProducts, updateProduct, deleteProduct, bulkDeleteProducts, bulkAdjustProducts } = useAdminStore();
    const importInputRef = useRef<HTMLInputElement>(null);
    const mounted = useMounted();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get("q") ?? "");
    const [category, setCategory] = useState<string>("All");
    const [sort, setSort] = useState<SortKey>((searchParams.get("sort") as SortKey | null) ?? "default");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [bulkEditOpen, setBulkEditOpen] = useState(false);

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

    // Reset to page 1 whenever the filter set changes
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
            { header: "Sale Price", value: (p) => productSalePrice(p) ?? "" },
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

    function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const text = typeof reader.result === "string" ? reader.result : "";
            const rows = parseCsv(text);
            if (rows.length < 2) {
                toast.error("That file has no data rows to import.");
                return;
            }
            const header = rows[0].map((h) => h.trim().toLowerCase());
            const colIndex = {
                name: header.indexOf("product name"),
                sku: header.indexOf("sku"),
                category: header.indexOf("category"),
                priceMin: header.indexOf("price min"),
                stock: header.indexOf("stock"),
            };
            // Optional: leave empty (or omit the column) for no discount.
            const saleCol = header.indexOf("sale price");
            const missingCols = Object.entries(colIndex)
                .filter(([, idx]) => idx === -1)
                .map(([key]) => key);
            if (missingCols.length > 0) {
                toast.error(`CSV is missing required column${missingCols.length === 1 ? "" : "s"}: ${missingCols.join(", ")}.`);
                return;
            }
            const existingSkus = new Set(products.map((p) => p.sku.trim().toLowerCase()));
            const toImport: Omit<AdminProduct, "id">[] = [];
            const skipped: string[] = [];
            rows.slice(1).forEach((row, i) => {
                const rowNum = i + 2; // +1 for header, +1 for 1-indexed display
                const name = row[colIndex.name]?.trim();
                const sku = row[colIndex.sku]?.trim();
                const categoryRaw = row[colIndex.category]?.trim();
                const category = CATEGORIES.find((c) => c.toLowerCase() === categoryRaw?.toLowerCase());
                const price = Number(row[colIndex.priceMin]);
                const stock = Number(row[colIndex.stock]);
                const saleRaw = saleCol === -1 ? "" : row[saleCol]?.trim();
                const salePrice = saleRaw ? Number(saleRaw) : undefined;
                if (!name) return skipped.push(`Row ${rowNum}: missing product name.`);
                if (!sku) return skipped.push(`Row ${rowNum}: missing SKU.`);
                if (existingSkus.has(sku.toLowerCase())) return skipped.push(`Row ${rowNum}: SKU "${sku}" already exists.`);
                if (!category) return skipped.push(`Row ${rowNum}: unrecognized category "${categoryRaw}".`);
                if (!Number.isFinite(price) || price <= 0) return skipped.push(`Row ${rowNum}: invalid price.`);
                if (!Number.isFinite(stock) || stock < 0) return skipped.push(`Row ${rowNum}: invalid stock.`);
                if (salePrice !== undefined && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice >= price)) return skipped.push(`Row ${rowNum}: sale price must be lower than the price.`);
                existingSkus.add(sku.toLowerCase());
                toImport.push({
                    name,
                    sku,
                    category,
                    price,
                    salePrice,
                    stock,
                    expiry: null,
                    image: CATEGORY_DEFAULT_IMAGE[category] ?? DEFAULT_PRODUCT_IMAGE,
                });
            });
            if (toImport.length > 0) bulkAddProducts(toImport);
            if (skipped.length > 0) {
                console.warn("Inventory import — skipped rows:", skipped);
                toast.error(
                    toImport.length > 0
                        ? `${skipped.length} row${skipped.length === 1 ? "" : "s"} skipped — see console for details.`
                        : `No rows imported — ${skipped.length} skipped. See console for details.`
                );
            } else if (toImport.length === 0) {
                toast.error("No valid rows found to import.");
            }
        };
        reader.onerror = () => toast.error("Couldn't read that file.");
        reader.readAsText(file);
    }

    function openAddModal() {
        setModalProduct(null);
        setModalOpen(true);
    }

    function openEditModal(p: AdminProduct) {
        setModalProduct(p);
        setModalOpen(true);
    }

    function handleSave(data: Omit<AdminProduct, "id">, id?: number, stockReason?: StockReason) {
        return id ? updateProduct(id, data, stockReason) : addProduct(data);
    }

    const deletingProduct = products.find((p) => p.id === deleteId) ?? null;

    if (!mounted) return <InventorySkeleton />;

    return (
        <div>
            <Toolbar
                actions={
                    <>
                        <input
                            ref={importInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleImportFile}
                            className="hidden"
                            aria-label="Import products from CSV"
                        />
                        <button onClick={() => importInputRef.current?.click()} className={BTN_SECONDARY}>
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
                    </>
                }
                filters={
                    <ToolbarFilters>
                        <FilterField label="Search" className="min-w-[200px] flex-1">
                            <SearchField value={search} onChange={setSearch} placeholder="Search by name or SKU" className="w-full" />
                        </FilterField>
                        <FilterField label="Category" className="w-full flex-none sm:w-[150px]">
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${FILTER_SELECT} w-full`}>
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </FilterField>
                        <FilterField label="Sort by" className="w-full flex-none sm:w-[180px]">
                            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`${FILTER_SELECT} w-full`}>
                                <option value="default">Default</option>
                                <option value="name-asc">Name (A–Z)</option>
                                <option value="name-desc">Name (Z–A)</option>
                                <option value="price-asc">Price (Low–High)</option>
                                <option value="price-desc">Price (High–Low)</option>
                                <option value="stock-asc">Stock (Low–High)</option>
                                <option value="stock-desc">Stock (High–Low)</option>
                                <option value="expiring-soon">Expiring Soon First</option>
                            </select>
                        </FilterField>
                    </ToolbarFilters>
                }
            />

            <ListPanel minWidth={720} footer={<>Showing {filtered.length} of {products.length}</>}>
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
                                    <th key={h} scope="col" className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[11px] tracking-[.12em] text-grey uppercase">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 && (
                                <EmptyStateRow colSpan={7} variant="filtered" message="No products match this filter." />
                            )}
                            {paged.map((p) => {
                                const status = productStockStatus(p);
                                const { min, max } = productPriceRange(p);
                                const sale = productSalePrice(p);
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
                                        <td className="border-b border-ink/10 px-5 py-3.5">
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
                                        <td className="border-b border-ink/10 px-5 py-3.5 text-[13px] text-ink">{p.category}</td>
                                        <td className="border-b border-ink/10 px-5 py-3.5 font-mono text-[12.5px] text-ink">
                                            {min === max ? `₱${min.toLocaleString()}` : `₱${min.toLocaleString()}–₱${max.toLocaleString()}`}
                                            {sale !== null && (
                                                <span className="mt-0.5 block text-[11px] text-pink-dark">
                                                    {p.sizes?.length ? "Sale from" : "Sale"} ₱{sale.toLocaleString()}
                                                </span>
                                            )}
                                        </td>
                                        <td className="border-b border-ink/10 px-5 py-3.5 font-mono text-[12.5px] text-ink">{productStock(p)}</td>
                                        <td className="border-b border-ink/10 px-5 py-3.5">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <StatusBadge label={status === "in" ? "In stock" : status === "low" ? "Low stock" : "Out of stock"} tone={STOCK_TONE[status]} />
                                                {isExpiringSoon(p.expiry) && <StatusBadge label="Expiring soon" tone="warning" />}
                                            </div>
                                        </td>
                                        <td className="border-b border-ink/10 px-5 py-3.5">
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
            </ListPanel>

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

            <BulkActionBar count={selected.size} onClear={clearSelection}>
                <button onClick={() => setBulkEditOpen(true)} className={BTN_BULK_PRIMARY}>
                    Bulk Edit
                </button>
                <button onClick={() => setBulkDeleteOpen(true)} className={BTN_BULK_DANGER}>
                    Delete selected
                </button>
                <button onClick={exportSelected} className={BTN_BULK_SECONDARY}>
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

            <BulkEditProductsModal
                open={bulkEditOpen}
                count={selected.size}
                onClose={() => setBulkEditOpen(false)}
                onApply={(adjust) => {
                    bulkAdjustProducts(Array.from(selected), adjust);
                    clearSelection();
                }}
            />
        </div>
    );
}

function InventorySkeleton() {
    return (
        <SkeletonGroup>
            <SkeletonToolbar actions={["w-28", "w-28", "w-36"]} filters={["min-w-[200px] flex-1", "w-full flex-none sm:w-[150px]", "w-full flex-none sm:w-[180px]"]} />

            <div className="overflow-hidden border border-ink/10 bg-white shadow-card">
                <div className="border-b border-ink/10 bg-off/50 px-5 py-3.5">
                    <Skeleton tone="soft" className="h-[10px] w-full" />
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 border-b border-ink/10 px-5 py-3.5 last:border-b-0">
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
                            <Skeleton tone="outline" className="h-11 w-11 rounded-full" />
                            <Skeleton tone="outline" className="h-11 w-11 rounded-full" />
                        </div>
                    </div>
                ))}
                <div className="border-t border-ink/10 bg-off/50 px-5 py-2.5 text-right">
                    <Skeleton tone="soft" className="ml-auto h-[11px] w-28" />
                </div>
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
