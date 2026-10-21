import type { Metadata } from "next";
import WishlistPageView from "@/components/pages/WishlistPageView";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default function Page() {
    return <WishlistPageView />;
}
