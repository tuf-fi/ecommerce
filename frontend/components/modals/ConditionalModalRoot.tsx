"use client";

import { usePathname } from "next/navigation";
import ModalRoot from "./ModalRoot";

export default function ConditionalModalRoot() {
    const pathname = usePathname();
    if (pathname.startsWith("/admin")) return null;
    return <ModalRoot />;
}
