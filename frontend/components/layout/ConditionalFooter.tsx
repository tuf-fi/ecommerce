"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

const FOOTER_PATHS = ["/", "/shop", "/wishlist"];
// Prefixes cover a section's dynamic detail route (e.g. /shop/[id]) via a single prefix entry.
const FOOTER_PREFIXES = ["/journal/", "/shop/", "/rituals/"];

export default function ConditionalFooter() {
    const pathname = usePathname();
    const onPrefixedRoute = FOOTER_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (!FOOTER_PATHS.includes(pathname) && !onPrefixedRoute) return null;
    return <Footer />;
}
