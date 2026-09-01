"use client";

import AboutPage from "@/components/pages/AboutPage";
import { useContent } from "@/library/content";

export default function AboutRoute() {
    const { pages } = useContent();
    const page = pages.find((p) => p.slug === "about");
    if (!page) return null;

    return (
        <div className="-mx-8 w-[calc(100%+4rem)] min-h-screen bg-white px-8 pt-25 pb-20">
            <AboutPage page={page} />
        </div>
    );
}
