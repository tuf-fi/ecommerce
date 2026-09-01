"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

const FOOTER_PATHS = ["/", "/shop", "/wishlist"];

export default function ConditionalFooter() {
    const pathname = usePathname();
    if (!FOOTER_PATHS.includes(pathname)) return null;
    return <Footer />;
}
