import type { Metadata } from "next";
import CartPageView from "@/components/pages/CartPageView";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default function Page() {
    return <CartPageView />;
}
