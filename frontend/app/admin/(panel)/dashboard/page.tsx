"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAdminStore, productStock, productStockStatus, daysUntilExpiry, isExpiringSoon, EXPIRY_WARNING_DAYS } from "@/library/adminStore";
import { countsAsOrder, countsAsRevenue, orderTotal, ordersPerDay, revenuePerDay } from "@/library/admin/orders";
import { canAccessSection } from "@/library/admin/permissions";
import { newUsersInLastDays, signupTrend } from "@/library/admin/users";
import { AdminOrder, AdminProduct } from "@/library/admin/types";
import { ChartRange, hasSales, salesLocations, salesTrendByLocation, topProducts } from "@/library/admin/dashboard";
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
// Restyled for the New Users card's solid fill — light-on-light would nearly disappear against it.
const RANGE_SELECT_ON_SOLID = "rounded-none border border-white/30 bg-white/10 px-3 py-1.5 font-mono text-[11px] text-white outline-none transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-1";

type UsersRange = "today" | "week" | "month" | "year";
const USERS_RANGE_DAYS: Record<UsersRange, number> = { today: 1, week: 7, month: 30, year: 365 };
const USERS_RANGE_COMPARE_LABEL: Record<UsersRange, string> = {
    today: "vs yesterday",
    week: "vs prior week",
    month: "vs prior month",
    year: "vs prior year",
};

export default function AdminDashboardPage() {
    const { products, orders, users, updateOrderStatus, reviewPayment, currentStaffMember } = useAdminStore();
    const canOrders = canAccessSection(currentStaffMember, "orders");
    const canInventory = canAccessSection(currentStaffMember, "inventory");
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

    const { ordersToday, revenueToday, revenueDelta, revenuePositive, ordersDelta, ordersPositive } = useMemo(() => {
        const dates = [...new Set(orders.map((o) => o.date))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        const [latestDate, prevDate] = dates;
        const on = (date: string) => orders.filter((o) => o.date === date);
        const revenueOn = (date: string) => on(date).filter(countsAsRevenue).reduce((sum, o) => sum + orderTotal(o), 0);
        const countOn = (date: string) => on(date).filter(countsAsOrder).length;
        const todaysCount = countOn(latestDate);
        const revenueToday = revenueOn(latestDate);

        let revenueDelta: string | undefined;
        let revenuePositive = true;
        let ordersDelta: string | undefined;
        let ordersPositive = true;
        if (prevDate) {
            const prevRevenue = revenueOn(prevDate);
            if (prevRevenue > 0) {
                const change = Math.round(((revenueToday - prevRevenue) / prevRevenue) * 100);
                revenueDelta = `${change >= 0 ? "+" : ""}${change}% vs previous day`;
                revenuePositive = change >= 0;
            }
            const orderChange = todaysCount - countOn(prevDate);
            ordersDelta = `${orderChange >= 0 ? "+" : ""}${orderChange} vs previous day`;
            ordersPositive = orderChange >= 0;
        }

        return { ordersToday: todaysCount, revenueToday, revenueDelta, revenuePositive, ordersDelta, ordersPositive };
    }, [orders]);

    const revenueTrend = useMemo(() => revenuePerDay(orders), [orders]);

    const signups = useMemo(() => {
        const days = USERS_RANGE_DAYS[usersRange];
        const current = newUsersInLastDays(users, days);
        const previous = newUsersInLastDays(users, days * 2) - current;
        const change = current - previous;
        // Clamped to 7-30 days: this mock dataset only spans a few weeks, so a full year would trail off flat.
        const trendDays = Math.min(Math.max(days, 7), 30);
        return {
            value: current,
            positive: change >= 0,
            delta: previous === 0 ? undefined : `${change >= 0 ? "+" : ""}${change} ${USERS_RANGE_COMPARE_LABEL[usersRange]}`,
            trend: signupTrend(users, trendDays),
        };
    }, [users, usersRange]);

    const orderDayTrend = useMemo(() => ordersPerDay(orders), [orders]);
    const locations = useMemo(() => salesLocations(orders), [orders]);
    const salesData = useMemo(() => salesTrendByLocation(orders, salesRange), [orders, salesRange]);
    const topData = useMemo(() => topProducts(orders, topRange), [orders, topRange]);

    const recentOrders = orders.slice(0, 4);
    const lowStockProducts = products.filter((p) => productStockStatus(p) !== "in").slice(0, 5);

    if (!mounted) return <DashboardSkeleton />;

    return (
        <div>
            {/* Six stats split by what they're for: performance (Revenue/Orders/New Users) vs. inventory health (rest, one rail). */}
            <div className="mb-8">
                <div className="mb-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
                    <StatCard
                        label="Revenue"
                        value={revenueToday}
                        prefix="₱"
                        delta={revenueDelta}
                        down={!revenuePositive}
                        tone="navy"
                        className="h-full"
                        graph={<HeroTrendChart data={revenueTrend} positive={revenuePositive} formatValue={(v) => `₱${v.toLocaleString()}`} />}
                    />
                    <StatCard
                        label="Orders"
                        value={ordersToday}
                        delta={ordersDelta}
                        down={!ordersPositive}
                        onClick={canOrders ? () => router.push("/admin/orders") : undefined}
                        tone="mint"
                        className="h-full"
                        graph={<HeroTrendChart data={orderDayTrend} positive={ordersPositive} />}
                    />
                    <StatCard
                        label="New Users"
                        value={signups.value}
                        delta={signups.delta}
                        down={!signups.positive}
                        tone="pink"
                        className="h-full"
                        graph={<HeroTrendChart data={signups.trend} positive={signups.positive} />}
                        control={
                            <select
                                value={usersRange}
                                onChange={(e) => setUsersRange(e.target.value as UsersRange)}
                                className={RANGE_SELECT_ON_SOLID}
                            >
                                {/* OS-drawn option list always paints white; without an explicit dark text class each option would vanish. */}
                                <option value="today" className="bg-white text-ink">Today</option>
                                <option value="week" className="bg-white text-ink">A Week</option>
                                <option value="month" className="bg-white text-ink">A Month</option>
                                <option value="year" className="bg-white text-ink">A Year</option>
                            </select>
                        }
                    />
                </div>

                <div className="border border-ink/10 bg-white shadow-card">
                    <div className="border-b border-ink/10 bg-off/50 px-6 py-4.5">
                        <h3 className="m-0 text-[15px] font-medium text-ink">Needs Attention</h3>
                    </div>
                    <div className="grid grid-cols-1 divide-y divide-ink/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                        <button
                            onClick={canInventory ? () => router.push("/admin/inventory") : undefined}
                            className={`flex h-[84px] items-center justify-between gap-4 px-6 text-left transition ${canInventory ? "hover:bg-off/50" : "cursor-default"}`}
                        >
                            <div>
                                <div className="font-mono text-[11px] tracking-[.06em] uppercase text-grey">Products</div>
                                <div className="mt-1.5 font-display text-[22px] font-medium text-ink">{products.length}</div>
                            </div>
                        </button>
                        <button
                            onClick={canInventory ? () => router.push("/admin/inventory?sort=stock-asc") : undefined}
                            className={`flex h-[84px] items-center justify-between gap-4 px-6 text-left transition ${canInventory ? "hover:bg-off/50" : "cursor-default"}`}
                        >
                            <div>
                                <div className="font-mono text-[11px] tracking-[.06em] uppercase text-grey">Low Stock</div>
                                <div className="mt-1.5 font-display text-[22px] font-medium text-ink">{lowStockCount}</div>
                            </div>
                            {lowStockCount > 0 && <StatusBadge label="Needs reorder" tone="alert" />}
                        </button>
                        <button
                            onClick={canInventory ? () => router.push("/admin/inventory?sort=expiring-soon") : undefined}
                            className={`flex h-[84px] items-center justify-between gap-4 px-6 text-left transition ${canInventory ? "hover:bg-off/50" : "cursor-default"}`}
                        >
                            <div>
                                <div className="font-mono text-[11px] tracking-[.06em] uppercase text-grey">Expiring Soon</div>
                                <div className="mt-1.5 font-display text-[22px] font-medium text-ink">{expiringSoonProducts.length}</div>
                            </div>
                            {expiringSoonProducts.length > 0 && <StatusBadge label="Check expiry" tone="warning" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Action-needed content (fulfill/reorder/pull) leads; lower-urgency trend/ranking charts follow. */}
            <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="flex h-full flex-col border border-ink/10 bg-white shadow-card">
                    <div className="flex items-center justify-between border-b border-ink/10 bg-off/50 px-6 py-4.5">
                        <h3 className="m-0 text-[15px] font-medium text-ink">Recent Orders</h3>
                        {canOrders && (
                            <button onClick={canOrders ? () => router.push("/admin/orders") : undefined} className="font-mono text-[11px] text-grey hover:text-pink-dark">
                                View all →
                            </button>
                        )}
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

                {/* Low Stock and Expiring Soon are the same underlying task, so they share one panel as labeled sections. */}
                <div className="flex h-full flex-col border border-ink/10 bg-white shadow-card">
                    <div className="flex items-center justify-between border-b border-ink/10 bg-off/50 px-6 py-4.5">
                        <h3 className="m-0 text-[15px] font-medium text-ink">Inventory Alerts</h3>
                        {canInventory && (
                            <button onClick={canInventory ? () => router.push("/admin/inventory") : undefined} className="font-mono text-[11px] text-grey hover:text-pink-dark">
                                View all →
                            </button>
                        )}
                    </div>
                    <div className="grid flex-1 grid-cols-1 divide-y divide-ink/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                        <div className="flex min-w-0 flex-col">
                            <div className="px-4 pt-3.5 pb-1.5 font-mono text-[11px] tracking-[.1em] text-grey uppercase">
                                Low Stock — {lowStockCount}
                            </div>
                            {lowStockProducts.length === 0 ? (
                                <div className="flex flex-1 items-center justify-center p-6 text-center text-[12.5px] text-grey">Well stocked.</div>
                            ) : (
                                <div className="flex min-w-0 flex-1 flex-col px-2 pb-2">
                                    {lowStockProducts.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setActiveLowStock(p)}
                                            className="flex min-w-0 items-center gap-3 px-2 py-2.5 text-left transition hover:bg-off/50"
                                        >
                                            <span className="relative h-9 w-9 flex-none overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft">
                                                <Image src={p.image} alt="" fill sizes="36px" unoptimized={typeof p.image === "string"} className="object-cover" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-[12.5px] font-medium text-ink">{p.name}</span>
                                                <span className="block font-mono text-[10.5px] text-grey">{p.sku}</span>
                                            </span>
                                            <StatusBadge
                                                label={productStockStatus(p) === "out" ? "Out" : `${productStock(p)} left`}
                                                tone={productStockStatus(p) === "out" ? "alert" : "warning"}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex min-w-0 flex-col">
                            <div className="px-4 pt-3.5 pb-1.5 font-mono text-[11px] tracking-[.1em] text-grey uppercase">
                                Expiring Soon — within {EXPIRY_WARNING_DAYS}d
                            </div>
                            {expiringSoonProducts.length === 0 ? (
                                <div className="flex flex-1 items-center justify-center p-6 text-center text-[12.5px] text-grey">Nothing expiring.</div>
                            ) : (
                                <div className="flex min-w-0 flex-1 flex-col px-2 pb-2">
                                    {expiringSoonProducts.map((p) => {
                                        const days = daysUntilExpiry(p.expiry) ?? 0;
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => setActiveExpiring(p)}
                                                className="flex min-w-0 items-center gap-3 px-2 py-2.5 text-left transition hover:bg-off/50"
                                            >
                                                <span className="relative h-9 w-9 flex-none overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft">
                                                    <Image src={p.image} alt="" fill sizes="36px" unoptimized={typeof p.image === "string"} className="object-cover" />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-[12.5px] font-medium text-ink">{p.name}</span>
                                                    <span className="block font-mono text-[10.5px] text-grey">{p.expiry}</span>
                                                </span>
                                                <StatusBadge label={days <= 0 ? "Expired" : `${days}d`} tone={days <= 14 ? "alert" : "warning"} />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
                <div className="flex h-full flex-col border border-ink/10 bg-white shadow-card">
                    <div className="flex items-center justify-between border-b border-ink/10 bg-off/50 px-6 py-4.5">
                        <h3 className="m-0 text-[15px] font-medium text-ink">Sales Trend</h3>
                        <select value={salesRange} onChange={(e) => setSalesRange(e.target.value as ChartRange)} className={RANGE_SELECT}>
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                        </select>
                    </div>
                    <div className="flex flex-1 flex-col justify-center px-6 pt-5 pb-1">
                        {hasSales(salesData) ? (
                            <SalesTrendChart data={salesData} locations={locations} />
                        ) : (
                            <p className="py-16 text-center text-[13px] text-grey">No sales in this period yet.</p>
                        )}
                    </div>
                </div>

                <div className="flex h-full flex-col border border-ink/10 bg-white shadow-card">
                    <div className="flex items-center justify-between border-b border-ink/10 bg-off/50 px-6 py-4.5">
                        <h3 className="m-0 text-[15px] font-medium text-ink">Stock Health</h3>
                        <span className="font-mono text-[11px] text-grey">All products</span>
                    </div>
                    <div className="flex flex-1 items-center justify-center p-6">
                        <StockHealthDonut
                            products={products}
                            onSelect={canInventory ? (status) => router.push(`/admin/inventory?sort=${status === "in" ? "stock-desc" : "stock-asc"}`) : undefined}
                        />
                    </div>
                </div>
            </div>

            <div className="border border-ink/10 bg-white shadow-card">
                <div className="flex items-center justify-between border-b border-ink/10 bg-off/50 px-6 py-4.5">
                    <h3 className="m-0 text-[15px] font-medium text-ink">Top Selling Products</h3>
                    <select value={topRange} onChange={(e) => setTopRange(e.target.value as ChartRange)} className={RANGE_SELECT}>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                </div>
                <div className="px-6 py-6">
                    {topData.length > 0 ? (
                        <TopProductsBars data={topData} onSelect={canInventory ? (name) => router.push(`/admin/inventory?q=${encodeURIComponent(name)}`) : undefined} />
                    ) : (
                        <p className="py-6 text-center text-[13px] text-grey">No products sold in this period yet.</p>
                    )}
                </div>
            </div>

            <OrderModal open={activeOrder !== null} order={activeOrder} onClose={() => setActiveOrder(null)} onStatusChange={updateOrderStatus} onReviewPayment={reviewPayment} />
            <LowStockViewModal open={activeLowStock !== null} product={activeLowStock} onClose={() => setActiveLowStock(null)} />
            <ProductViewModal open={activeExpiring !== null} product={activeExpiring} onClose={() => setActiveExpiring(null)} />
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-8">
                <div className="mb-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
                    <div className="flex h-full flex-col bg-navy px-5.5 py-5 shadow-card">
                        <Skeleton tone="onSolid" className="h-[10.5px] w-16" />
                        <Skeleton tone="onSolid" className="mt-2.5 h-[28px] w-28" />
                        <Skeleton tone="onSolid" className="mt-3 h-[96px] w-full" />
                    </div>
                    <div className="flex h-full flex-col bg-success px-5.5 py-5 shadow-card">
                        <Skeleton tone="onSolid" className="h-[10.5px] w-16" />
                        <Skeleton tone="onSolid" className="mt-2.5 h-[28px] w-12" />
                        <Skeleton tone="onSolid" className="mt-3 h-[96px] w-full" />
                    </div>
                    <div className="flex h-full flex-col bg-pink-btn px-5.5 py-5 shadow-card">
                        <div className="flex items-center justify-between gap-3">
                            <Skeleton tone="onSolid" className="h-[10.5px] w-16" />
                            <Skeleton tone="onSolid" className="h-[30px] w-24" />
                        </div>
                        <Skeleton tone="onSolid" className="mt-2.5 h-[28px] w-12" />
                        <Skeleton tone="onSolid" className="mt-3 h-[96px] w-full" />
                    </div>
                </div>

                <div className="border border-ink/10 bg-white shadow-card">
                    <div className="border-b border-ink/10 bg-off/50 px-6 py-4.5">
                        <Skeleton className="h-[15px] w-32" />
                    </div>
                    <div className="grid grid-cols-1 divide-y divide-ink/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between gap-4 px-6 py-5">
                                <div>
                                    <Skeleton className="h-[10.5px] w-20" />
                                    <Skeleton className="mt-2 h-[22px] w-10" />
                                </div>
                                {i > 0 && <Skeleton tone="outline" className="h-[23px] w-24 rounded-pill" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="flex h-full flex-col border border-ink/10 bg-white shadow-card">
                    <div className="flex items-center justify-between border-b border-ink/10 bg-off/50 px-6 py-4.5">
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
                    <div className="flex items-center justify-between border-b border-ink/10 bg-off/50 px-6 py-4.5">
                        <Skeleton className="h-[15px] w-28" />
                        <Skeleton tone="soft" className="h-[11px] w-16" />
                    </div>
                    <div className="grid flex-1 grid-cols-1 divide-y divide-ink/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                        {Array.from({ length: 2 }).map((_, col) => (
                            <div key={col} className="flex flex-col px-2 pt-3.5 pb-2">
                                <Skeleton tone="soft" className="mb-2 ml-2 h-[10px] w-24" />
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                                        <Skeleton tone="faint" className="h-9 w-9 flex-none" />
                                        <div className="min-w-0 flex-1">
                                            <Skeleton className="h-[12.5px] w-24" />
                                            <Skeleton tone="soft" className="mt-1.5 h-[10.5px] w-14" />
                                        </div>
                                        <Skeleton tone="outline" className="h-[17px] w-14 rounded-pill" />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
                <div className="flex h-full flex-col border border-ink/10 bg-white shadow-card">
                    <div className="flex items-center justify-between border-b border-ink/10 bg-off/50 px-6 py-4.5">
                        <Skeleton className="h-[15px] w-24" />
                        <Skeleton tone="outline" className="h-[30px] w-28" />
                    </div>
                    <div className="px-6 pt-5 pb-1">
                        <Skeleton tone="faint" className="h-[230px] w-full" />
                    </div>
                </div>

                <div className="flex h-full flex-col border border-ink/10 bg-white shadow-card">
                    <div className="flex items-center justify-between border-b border-ink/10 bg-off/50 px-6 py-4.5">
                        <Skeleton className="h-[15px] w-24" />
                        <Skeleton tone="soft" className="h-[11px] w-20" />
                    </div>
                    <div className="flex flex-1 items-center justify-center p-6">
                        <Skeleton tone="faint" className="h-[240px] w-[150px]" />
                    </div>
                </div>
            </div>

            <div className="border border-ink/10 bg-white shadow-card">
                <div className="flex items-center justify-between border-b border-ink/10 bg-off/50 px-6 py-4.5">
                    <Skeleton className="h-[15px] w-40" />
                    <Skeleton tone="outline" className="h-[30px] w-28" />
                </div>
                <div className="px-6 py-6">
                    <Skeleton tone="faint" className="h-[200px] w-full" />
                </div>
            </div>
        </SkeletonGroup>
    );
}
