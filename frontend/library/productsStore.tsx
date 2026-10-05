"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PRODUCTS, Product, setCatalog } from "./products";
import { fetchCatalogClient } from "./api/products";

type ProductsContextValue = {
    // Bumps whenever the catalogue changes so anything reading PRODUCTS/getProduct re-renders (exposed via useStore/useAdminStore).
    version: number;
    refresh: () => Promise<void>;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

// `initial` comes from the server (root layout) so the first paint — SSR included — already has the real catalogue.
export function ProductsProvider({ initial, children }: { initial: Product[]; children: React.ReactNode }) {
    // Runs once per mount, before any child renders, on both server and client.
    useState(() => setCatalog(initial));
    const [version, setVersion] = useState(0);

    const refresh = useCallback(async () => {
        try {
            const next = await fetchCatalogClient();
            if (JSON.stringify(next) === JSON.stringify(PRODUCTS)) return;
            setCatalog(next);
            setVersion((v) => v + 1);
        } catch {
            // API unreachable — keep showing the last known catalogue.
        }
    }, []);

    useEffect(() => {
        // Server data can be up to a revalidate window old; this picks up changes made since.
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
        refresh();
    }, [refresh]);

    const value = useMemo(() => ({ version, refresh }), [version, refresh]);
    return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
    const ctx = useContext(ProductsContext);
    if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
    return ctx;
}
