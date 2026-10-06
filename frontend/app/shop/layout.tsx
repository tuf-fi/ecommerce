import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Shop",
    description: "The full Cindyrella catalogue — cleansers, treatments, and moisturizers built around a considered routine.",
};

export default function ShopLayout({ children }: LayoutProps<"/shop">) {
    return children;
}
