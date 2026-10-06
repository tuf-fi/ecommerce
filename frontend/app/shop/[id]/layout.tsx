import type { Metadata } from "next";
import { fetchCatalog } from "@/library/api/products";

export async function generateMetadata({ params }: LayoutProps<"/shop/[id]">): Promise<Metadata> {
    const { id } = await params;
    const product = (await fetchCatalog()).find((p) => p.id === Number(id));

    if (!product) {
        return {
            title: "Product Not Found | Cindyrella",
            description: "That product doesn't exist.",
        };
    }

    return {
        title: `${product.title} | Cindyrella`,
        description: product.desc,
        openGraph: {
            title: product.title,
            description: product.desc,
            images: [{ url: typeof product.image === "string" ? product.image : product.image.src }],
        },
    };
}

export default function ProductLayout({ children }: LayoutProps<"/shop/[id]">) {
    return children;
}
