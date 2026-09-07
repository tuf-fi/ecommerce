import type { Metadata } from "next";
import { RITUALS_DEFAULT } from "@/library/admin/content";

export async function generateMetadata({ params }: LayoutProps<"/rituals/[id]">): Promise<Metadata> {
    const { id } = await params;
    const ritual = RITUALS_DEFAULT.find((r) => r.id === Number(id));

    if (!ritual) {
        return {
            title: "Ritual Not Found | Cindyrella",
            description: "That ritual doesn't exist.",
        };
    }

    const image = typeof ritual.image === "string" ? ritual.image : ritual.image?.src;

    return {
        title: `${ritual.title} | Cindyrella`,
        description: ritual.copy,
        openGraph: {
            title: ritual.title,
            description: ritual.copy,
            images: image ? [{ url: image }] : undefined,
        },
    };
}

export default function RitualLayout({ children }: LayoutProps<"/rituals/[id]">) {
    return children;
}
