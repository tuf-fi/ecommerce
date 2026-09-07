import type { Metadata } from "next";
import { getProduct } from "@/library/products";

export async function generateMetadata({ params }: LayoutProps<"/shop/[id]">): Promise<Metadata> {
    const { id } = await params;
    const product = getProduct(Number(id));

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
            images: [{ url: product.image.src }],
        },
    };
}

export default function ProductLayout({ children }: LayoutProps<"/shop/[id]">) {
    return children;
}
