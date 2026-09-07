"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAdminStore, productStock, productStockStatus, daysUntilExpiry, isExpiringSoon, EXPIRY_WARNING_DAYS } from "@/library/adminStore";
import { orderTotal, ordersPerDay, revenuePerDay } from "@/library/admin/orders";
import { newUsersInLastDays, signupTrend } from "@/library/admin/users";
import { AdminOrder, AdminProduct } from "@/library/admin/types";
import { ChartRange, SALES_LOCATIONS, SALES_TREND_BY_LOCATION_RANGE, TOP_PRODUCTS_BY_RANGE } from "@/library/admin/dashboard";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import SalesTrendChart from "@/components/admin/charts/SalesTrendChart";
import HeroTrendChart from "@/components/admin/charts/HeroTrendChart";
import OrdersTrendSparkline from "@/components/admin/charts/OrdersTrendSparkline";
import StockHealthDonut from "@/components/admin/charts/StockHealthDonut";
import TopProductsBars from "@/components/admin/charts/TopProductsBars";
import OrderModal from "@/components/admin/modals/OrderModal";
import LowStockViewModal from "@/components/admin/modals/LowStockViewModal";
import ProductViewModal from "@/components/admin/modals/ProductViewModal";
import { ORDER_STATUS_TONE } from "@/components/admin/orderStatus";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

const RANGE_SELECT = "rounded-none border border-ink/10 bg-off/50 px-3 py-1.5 font-mono text-[11px] text-grey outline-none transition hover:border-pink/40 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1";

type UsersRange = "today" | "week" | "month" | "year";
const USERS_RANGE_DAYS: Record<UsersRange, number> = { today: 1, week: 7, month: 30, year: 365 };
const USERS_RANGE_COMPARE_LABEL: Record<UsersRange, string> = {
    today: "vs yesterday",
    week: "vs prior week",
    month: "vs prior month",
    year: "vs prior year",
};

export default function AdminDashboardPage() {
    const { products, orders, users, updateOrderStatus } = useAdminStore();
    const mounted = useMounted();
    const router = useRouter();
    const [salesRange, setSalesRange] = useState<ChartRange>("7d");
    const [topRange, setTopRange] = useState<ChartRange>("30d");
    const [usersRange, setUsersRange] = useState<UsersRange>("week");
    const [activeOrder, setActiveOrder] = useState<AdminOrder | null>(null);
    const [activeLowStock, setActiveLowStock] = useState<AdminProduct | null>(null);
    const [activeExpiring, setActiveExpiring] = useState<AdminProduct | null>(null);

    const lowStockCount = products.filter((p) => productStockStatus(p) !== "in").length;

    const expiringSoonProducts = useMemo(
        () =>
            products
                .filter((p) => isExpiringSoon(p.expiry))
                .sort((a, b) => (daysUntilExpiry(a.expiry) ?? 0) - (daysUntilExpiry(b.expiry) ?? 0))
                .slice(0, 5),
        [products]
    );

    const { ordersToday, revenueToday, revenueDelta, revenuePositive } = useMemo(() => {
        const dates = [...new Set(orders.map((o) => o.date))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        const [latestDate, prevDate] = dates;
        const todays = orders.filter((o) => o.date === latestDate);
        const revenueToday = todays.reduce((sum, o) => sum + orderTotal(o), 0);

        let revenueDelta: string | undefined;
        let revenuePositive = true;
        if (prevDate) {
            const prevRevenue = orders.filter((o) => o.date === prevDate).reduce((sum, o) => sum + orderTotal(o), 0);
            if (prevRevenue > 0) {
                const change = Math.round(((revenueToday - prevRevenue) / prevRevenue) * 100);
                revenueDelta = `${change >= 0 ? "+" : ""}${change}% vs previous day`;
                revenuePositive = change >= 0;
            }
        }

        return { ordersToday: todays.length, revenueToday, revenueDelta, revenuePositive };
    }, [orders]);

    const revenueTrend = useMemo(() => revenuePerDay(orders), [orders]);

    const signups = useMemo(() => {
        const days = USERS_RANGE_DAYS[usersRange];
        const current = newUsersInLastDays(users, days);
        const previous = newUsersInLastDays(users, days * 2) - current;
        const change = current - previous;
        // The trend graph stays readable regardless of range: at least a
        // week of points so "Today" isn't a single dot, but capped well
        // under "Year"'s 365 days — this mock dataset only spans a few
        // weeks, so anything longer would just be a flat, empty tail.
        const trendDays = Math.min(Math.max(days, 7), 30);
        return {
            value: current,
            positive: change >= 0,
            delta: previous === 0 ? undefined : `${change >= 0 ? "+" : ""}${change} ${USERS_RANGE_COMPARE_LABEL[usersRange]}`,
            trend: signupTrend(users, trendDays),
        };
    }, [users, usersRange]);

    const orderDayTrend = useMemo(() => ordersPerDay(orders), [orders]);

    const recentOrders = orders.slice(0, 4);
    const lowStockProducts = products.filter((p) => productStockStatus(p) !== "in").slice(0, 5);

    if (!mounted) return <DashboardSkeleton />;

    return (
        <div>
            {/* A flanking hero card on each side gets full-height room to breathe;
                the four minor counts sit in a 2x2 block between them instead of
                a 1x4 row, so their labels never fight for width — this also
                collapses cleanly to a single stacked column on narrow screens. */}
            <div className="mb-8 grid grid-cols-1 gap-3.5 lg:grid-cols-[1.1fr_1.6fr_1.1fr]">
                <StatCard
                    label="Revenue"
                    value={revenueToday}
                    prefix="₱"
                    delta={revenueDelta}
                    tone="navy"
                    className="h-full"
                    graph={<HeroTrendChart data={revenueTrend} positive={revenuePositive} formatValue={(v) => `₱${v.toLocaleString()}`} />}
                />

                <div className="grid grid-cols-2 gap-3.5">
                    <StatCard label="Products" value={products.length} onClick={() => router.push("/admin/inventory")} />
                    <StatCard
                        label="Low Stock"
                        value={lowStockCount}
                        delta={lowStockCount > 0 ? "Needs reorder" : undefined}
                        down={lowStockCount > 0}
                        onClick={() => router.push("/admin/inventory?sort=stock-asc")}
                    />
                    <StatCard label="Orders" value={ordersToday} onClick={() => router.push("/admin/orders")} />
                    <StatCard
                        label="Expiring Soon"
                        value={expiringSoonProducts.length}
                        delta={expiringSoonProducts.length > 0 ? "Check expiry" : undefined}
                        down={expiringSoonProducts.length > 0}
                        onClick={() => router.push("/admin/inventory?sort=expiring-soon")}
                    />
                </div>

                <StatCard
                    label="New Users"
                    value={signups.value}
                    delta={signups.delta}
                    tone="pink"
                    className="h-full"
                    graph={<HeroTrendChart data={signups.trend} positive={signups.positive} />}
                    control={
                        <select
                            value={usersRange}
                            onChange={(e) => setUsersRange(e.target.value as UsersRange)}
                            className={RANGE_SELECT}
                        >
                            <option value="today">Today</option>
                            <option value="week">A Week</option>
                            <option value="month">A Month</option>
                            <option value="year">A Year</option>
                        </select>
                    }
                />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
                <div className="flex h-full flex-col border border-ink/10 bg-white shadow-card">
                    <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4.5">
                        <h3 className="m-0 text-[15px] font-medium text-ink">Sales Trend</h3>
                        <select value={salesRange} onChange={(e) => setSalesRange(e.target.value as ChartRange)} className={RANGE_SELECT}>
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                        </select>
                    </div>
                    <div className="flex flex-1 flex-col justify-center px-6 pt-5 pb-1">
                        <SalesTrendChart data={SALES_TREND_BY_LOCATION_RANGE[salesRange]} locations={SALES_LOCATIONS} />
                    </div>
                </div>

                <div className="flex h-full flex-col border border-ink/10 bg-white shadow-card">
                    <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4.5">
                        <h3 className="m-0 text-[15px] font-medium text-ink">Stock Health</h3>
                        <span className="font-mono text-[11px] text-grey">All products</span>
                    </div>
                    <div className="flex flex-1 items-center justify-center p-6">
                        <StockHealthDonut
                            products={products}
                            onSelect={(status) => router.push(`/admin/inventory?sort=${status === "in" ? "stock-desc" : "stock-asc"}`)}
                        />
                    </div>
                </div>
            </div>

            <div className="mb-6 border border-ink/10 bg-white shadow-card">
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

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="flex h-full flex-col border border-ink/10 bg-white shadow-card">
                    <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4.5">
                        <h3 className="m-0 text-[15px] font-medium text-ink">Recent Orders</h3>
                        <button onClick={() => router.push("/admin/orders")} className="font-mono text-[11px] text-grey hover:text-pink-dark">
                            View all →
                        </button>
                    </div>
                    {orderDayTrend.length > 1 && (
                        <div className="border-b border-ink/10 px-6 pt-4 pb-3">
                            <div className="mb-2 font-mono text-[10.5px] tracking-[.06em] text-grey uppercase">
                                Last {orderDayTrend.length} order days
                            </div>
                            <OrdersTrendSparkline data={orderDayTrend} />
                        </div>
                    )}
                    <div className="flex flex-1 flex-col divide-y divide-ink/10 px-2 pb-2">
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

                <div className="flex h-full flex-col border border-ink/10 bg-white shadow-card">
                    <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4.5">
                        <h3 className="m-0 text-[15px] font-medium text-ink">Low Stock Alerts</h3>
                        <button onClick={() => router.push("/admin/inventory")} className="font-mono text-[11px] text-grey hover:text-pink-dark">
                            View all →
                        </button>
                    </div>
                    {lowStockProducts.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center p-11 text-center text-[13px] text-grey">Everything is well stocked.</div>
                    ) : (
                        <div className="flex flex-1 flex-col px-2 pb-2">
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
                                        label={productStockStatus(p) === "out" ? "Out of stock" : `${productStock(p)} left`}
                                        tone={productStockStatus(p) === "out" ? "alert" : "warning"}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 border border-ink/10 bg-white shadow-card">
                <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4.5">
                    <h3 className="m-0 text-[15px] font-medium text-ink">Expiring Soon</h3>
                    <span className="font-mono text-[11px] text-grey">Within {EXPIRY_WARNING_DAYS} days</span>
                </div>
                {expiringSoonProducts.length === 0 ? (
                    <div className="p-11 text-center text-[13px] text-grey">Nothing expiring soon.</div>
                ) : (
                    <div className="flex flex-col px-2 pb-2">
                        {expiringSoonProducts.map((p) => {
                            const days = daysUntilExpiry(p.expiry) ?? 0;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setActiveExpiring(p)}
                                    className="flex items-center gap-3 px-4 py-3 text-left transition hover:bg-off/50"
                                >
                                    <span className="relative h-10 w-10 flex-none overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft">
                                        <Image src={p.image} alt="" fill sizes="40px" unoptimized={typeof p.image === "string"} className="object-cover" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[13px] font-medium text-ink">{p.name}</span>
                                        <span className="block font-mono text-[11px] text-grey">{p.expiry}</span>
                                    </span>
                                    <StatusBadge label={days <= 0 ? "Expired" : `${days}d left`} tone={days <= 14 ? "alert" : "warning"} />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <OrderModal open={activeOrder !== null} order={activeOrder} onClose={() => setActiveOrder(null)} onStatusChange={updateOrderStatus} />
            <LowStockViewModal open={activeLowStock !== null} product={activeLowStock} onClose={() => setActiveLowStock(null)} />
            <ProductViewModal open={activeExpiring !== null} product={activeExpiring} onClose={() => setActiveExpiring(null)} />
        </div>
    );
}

// Mirrors the populated dashboard's section structure — hero stat row,
// sales/stock charts, top products, recent orders + low stock lists, and
// expiring soon — so the mounted-gate swap doesn't jump the layout. Chart
// placeholders are flat blocks sized to each chart's real footprint rather
// than faked bars/lines/donuts.
function DashboardSkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-8 grid grid-cols-1 gap-3.5 lg:grid-cols-[1.1fr_1.6fr_1.1fr]">
                <div className="flex h-full flex-col border border-navy/25 bg-blue-soft px-5.5 py-5 shadow-card">
                    <Skeleton className="h-[10.5px] w-16" />
                    <Skeleton className="mt-2.5 h-[28px] w-28" />
                    <Skeleton tone="faint" className="mt-3 h-[96px] w-full" />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="border border-ink/10 bg-white px-5.5 py-5 shadow-card">
                            <Skeleton className="h-[10.5px] w-20" />
                            <Skeleton className="mt-2.5 h-[28px] w-12" />
                            <Skeleton tone="soft" className="mt-1.5 h-[11.5px] w-24" />
                        </div>
                    ))}
                </div>

                <div className="flex h-full flex-col border border-pink-dark/25 bg-pink-soft px-5.5 py-5 shadow-card">
                    <div className="flex items-center justify-between gap-3">
                        <Skeleton className="h-[10.5px] w-16" />
                        <Skeleton tone="outline" className="h-[30px] w-24" />
                    </div>
                    <Skeleton className="mt-2.5 h-[28px] w-12" />
                    <Skeleton tone="faint" className="mt-3 h-[96px] w-full" />
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
                <div className="flex h-full flex-col border border-ink/10 bg-white shadow-card">
                    <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4.5">
                        <Skeleton className="h-[15px] w-24" />
                        <Skeleton tone="outline" className="h-[30px] w-28" />
                    </div>
                    <div className="px-6 pt-5 pb-1">
                        <Skeleton tone="faint" className="h-[230px] w-full" />
                    </div>
                </div>

                <div className="flex h-full flex-col border border-ink/10 bg-white shadow-card">
                    <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4.5">
                        <Skeleton className="h-[15px] w-24" />
                        <Skeleton tone="soft" className="h-[11px] w-20" />
                    </div>
                    <div className="flex flex-1 items-center justify-center p-6">
                        <Skeleton tone="faint" className="h-[240px] w-[150px]" />
                    </div>
                </div>
            </div>

            <div className="mb-6 border border-ink/10 bg-white shadow-card">
                <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4.5">
                    <Skeleton className="h-[15px] w-40" />
                    <Skeleton tone="outline" className="h-[30px] w-28" />
                </div>
                <div className="px-6 py-6">
                    <Skeleton tone="faint" className="h-[200px] w-full" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="flex h-full flex-col border border-ink/10 bg-white shadow-card">
                    <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4.5">
                        <Skeleton className="h-[15px] w-28" />
                        <Skeleton tone="soft" className="h-[11px] w-16" />
                    </div>
                    <div className="border-b border-ink/10 px-6 pt-4 pb-3">
                        <Skeleton tone="soft" className="mb-2 h-[10.5px] w-32" />
                        <Skeleton tone="faint" className="h-[64px] w-full" />
                    </div>
                    <div className="flex flex-1 flex-col divide-y divide-ink/10 px-2 pb-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 px-4 py-3.5">
                                <div className="min-w-0">
                                    <Skeleton className="h-[13.5px] w-20" />
                                    <Skeleton tone="soft" className="mt-1.5 h-3 w-28" />
                                </div>
                                <div className="flex flex-none items-center gap-3">
                                    <Skeleton className="h-3 w-14" />
                                    <Skeleton tone="outline" className="h-[19px] w-16 rounded-pill" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex h-full flex-col border border-ink/10 bg-white shadow-card">
                    <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4.5">
                        <Skeleton className="h-[15px] w-28" />
                        <Skeleton tone="soft" className="h-[11px] w-16" />
                    </div>
                    <div className="flex flex-1 flex-col px-2 pb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3">
                                <Skeleton tone="faint" className="h-10 w-10 flex-none" />
                                <div className="min-w-0 flex-1">
                                    <Skeleton className="h-[13px] w-32" />
                                    <Skeleton tone="soft" className="mt-1.5 h-[11px] w-16" />
                                </div>
                                <Skeleton tone="outline" className="h-[19px] w-20 rounded-pill" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 border border-ink/10 bg-white shadow-card">
                <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4.5">
                    <Skeleton className="h-[15px] w-28" />
                    <Skeleton tone="soft" className="h-[11px] w-24" />
                </div>
                <div className="flex flex-col px-2 pb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3">
                            <Skeleton tone="faint" className="h-10 w-10 flex-none" />
                            <div className="min-w-0 flex-1">
                                <Skeleton className="h-[13px] w-32" />
                                <Skeleton tone="soft" className="mt-1.5 h-[11px] w-20" />
                            </div>
                            <Skeleton tone="outline" className="h-[19px] w-16 rounded-pill" />
                        </div>
                    ))}
                </div>
            </div>
        </SkeletonGroup>
    );
}
