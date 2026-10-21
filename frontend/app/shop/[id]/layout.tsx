import type { Metadata } from "next";
import { fetchCatalog } from "@/library/api/products";
import { parseDescription } from "@/library/products";

export async function generateMetadata({ params }: LayoutProps<"/shop/[id]">): Promise<Metadata> {
    const { id } = await params;
    const product = (await fetchCatalog()).find((p) => p.id === Number(id));

    if (!product) {
        return {
            title: "Product not found | Cindyrella",
            description: "That product doesn't exist.",
        };
    }

    // Only the intro paragraph: the ## sections would show up as raw markers in search snippets and social cards.
    const summary = parseDescription(product.desc).intro || `${product.title}: ${product.category.toLowerCase()} by Cindyrella.`;

    return {
        title: `${product.title} | Cindyrella`,
        description: summary,
        twitter: { card: "summary_large_image", title: product.title, description: summary },
        openGraph: {
            title: product.title,
            description: summary,
            images: [{ url: typeof product.image === "string" ? product.image : product.image.src }],
        },
    };
}

export default function ProductLayout({ children }: LayoutProps<"/shop/[id]">) {
    return children;
}
