"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAdminStore, stockStatus } from "@/library/adminStore";
import { orderTotal } from "@/library/admin/orders";
import { AdminOrder, AdminProduct } from "@/library/admin/types";
import { ChartRange, SALES_TREND_BY_RANGE, TOP_PRODUCTS_BY_RANGE } from "@/library/admin/dashboard";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import SalesTrendChart from "@/components/admin/charts/SalesTrendChart";
import StockHealthDonut from "@/components/admin/charts/StockHealthDonut";
import TopProductsBars from "@/components/admin/charts/TopProductsBars";
import OrderModal from "@/components/admin/modals/OrderModal";
import LowStockViewModal from "@/components/admin/modals/LowStockViewModal";
import { ORDER_STATUS_TONE } from "@/components/admin/orderStatus";

const RANGE_SELECT = "rounded-none border border-ink/10 bg-off/50 px-3 py-1.5 font-mono text-[11px] text-grey outline-none transition hover:border-pink/40";

export default function AdminDashboardPage() {
    const { products, orders, updateOrderStatus } = useAdminStore();
    const router = useRouter();
    const [salesRange, setSalesRange] = useState<ChartRange>("7d");
    const [topRange, setTopRange] = useState<ChartRange>("30d");
    const [activeOrder, setActiveOrder] = useState<AdminOrder | null>(null);
    const [activeLowStock, setActiveLowStock] = useState<AdminProduct | null>(null);

    const lowStockCount = products.filter((p) => stockStatus(p.stock) !== "in").length;

    const { ordersToday, revenueToday } = useMemo(() => {
        const latestDate = orders[0]?.date;
        const todays = orders.filter((o) => o.date === latestDate);
        return { ordersToday: todays.length, revenueToday: todays.reduce((sum, o) => sum + orderTotal(o), 0) };
    }, [orders]);

    const recentOrders = orders.slice(0, 4);
    const lowStockProducts = products.filter((p) => stockStatus(p.stock) !== "in").slice(0, 5);

    return (
        <div>
            <div className="mb-8 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                <StatCard
                    label="Revenue (latest day)"
                    value={revenueToday}
                    prefix="₱"
                    valueClassName={revenueToday >= 0 ? "text-success-dark" : "text-alert"}
                />
                <StatCard label="Products" value={products.length} onClick={() => router.push("/admin/inventory")} />
                <StatCard
                    label="Low Stock Items"
                    value={lowStockCount}
                    delta={lowStockCount > 0 ? "Needs reorder" : undefined}
                    down={lowStockCount > 0}
                    onClick={() => router.push("/admin/inventory")}
                />
                <StatCard label="Orders (latest day)" value={ordersToday} onClick={() => router.push("/admin/orders")} />
            </div>

            <div className="mb-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
                <div className="border border-ink/10 bg-white">
                    <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4.5">
                        <h3 className="m-0 text-[15px] font-medium text-ink">Sales Trend</h3>
                        <select value={salesRange} onChange={(e) => setSalesRange(e.target.value as ChartRange)} className={RANGE_SELECT}>
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                        </select>
                    </div>
                    <div className="px-6 pt-5 pb-1">
                        <SalesTrendChart data={SALES_TREND_BY_RANGE[salesRange]} />
                    </div>
                </div>

                <div className="border border-ink/10 bg-white">
                    <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4.5">
                        <h3 className="m-0 text-[15px] font-medium text-ink">Stock Health</h3>
                        <span className="font-mono text-[11px] text-grey">All products</span>
                    </div>
                    <div className="p-6">
                        <StockHealthDonut products={products} onSelect={(status) => router.push(`/admin/inventory?stock=${status}`)} />
                    </div>
                </div>
            </div>

            <div className="mb-6 border border-ink/10 bg-white">
                <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4.5">
                    <h3 className="m-0 text-[15px] font-medium text-ink">Top Selling Products</h3>
                    <select value={topRange} onChange={(e) => setTopRange(e.target.value as ChartRange)} className={RANGE_SELECT}>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                </div>
                <div className="px-6 py-6">
                    <TopProductsBars data={TOP_PRODUCTS_BY_RANGE[topRange]} onSelect={(name) => router.push(`/admin/inventory?q=${encodeURIComponent(name)}`)} />
                </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
                <div className="border border-ink/10 bg-white">
                    <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4.5">
                        <h3 className="m-0 text-[15px] font-medium text-ink">Recent Orders</h3>
                        <button onClick={() => router.push("/admin/orders")} className="font-mono text-[11px] text-grey hover:text-pink-dark">
                            View all →
                        </button>
                    </div>
                    <div className="flex flex-col divide-y divide-ink/10 px-2 pb-2">
                        {recentOrders.map((o) => (
                            <button
                                key={o.no}
                                onClick={() => setActiveOrder(o)}
                                className="flex items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-off/50"
                            >
                                <div className="min-w-0">
                                    <div className="text-[13.5px] font-medium text-ink">{o.no}</div>
                                    <div className="truncate text-[12px] text-grey">{o.customer}</div>
                                </div>
                                <div className="flex flex-none items-center gap-3">
                                    <span className="font-mono text-[12.5px] text-ink">₱{orderTotal(o).toLocaleString()}</span>
                                    <StatusBadge label={o.status} tone={ORDER_STATUS_TONE[o.status]} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border border-ink/10 bg-white">
                    <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4.5">
                        <h3 className="m-0 text-[15px] font-medium text-ink">Low Stock Alerts</h3>
                        <button onClick={() => router.push("/admin/inventory")} className="font-mono text-[11px] text-grey hover:text-pink-dark">
                            View all →
                        </button>
                    </div>
                    {lowStockProducts.length === 0 ? (
                        <div className="p-11 text-center text-[13px] text-grey">Everything is well stocked.</div>
                    ) : (
                        <div className="flex flex-col px-2 pb-2">
                            {lowStockProducts.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setActiveLowStock(p)}
                                    className="flex items-center gap-3 px-4 py-3 text-left transition hover:bg-off/50"
                                >
                                    <span className="relative h-10 w-10 flex-none overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft">
                                        <Image src={p.image} alt="" fill sizes="40px" unoptimized={typeof p.image === "string"} className="object-cover" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[13px] font-medium text-ink">{p.name}</span>
                                        <span className="block font-mono text-[11px] text-grey">{p.sku}</span>
                                    </span>
                                    <StatusBadge
                                        label={stockStatus(p.stock) === "out" ? "Out of stock" : `${p.stock} left`}
                                        tone={stockStatus(p.stock) === "out" ? "alert" : "warning"}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <OrderModal open={activeOrder !== null} order={activeOrder} onClose={() => setActiveOrder(null)} onStatusChange={updateOrderStatus} />
            <LowStockViewModal open={activeLowStock !== null} product={activeLowStock} onClose={() => setActiveLowStock(null)} />
        </div>
    );
}
