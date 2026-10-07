import { currentPrice, isOnSale } from "@/library/products";

// The price a customer pays, with the regular price struck through beside it (or below it with `stack`) when a discount is running.
export default function PriceTag({
    price,
    salePrice,
    suffix,
    stack = false,
    className = "",
}: {
    price: number;
    salePrice?: number | null;
    suffix?: string;
    // Put the struck-through regular price on the line below instead of beside it.
    stack?: boolean;
    className?: string;
}) {
    const item = { price, salePrice };
    if (!isOnSale(item)) {
        return <span className={className}>₱{price.toLocaleString()}{suffix}</span>;
    }
    return (
        <span className={className}>
            ₱{currentPrice(item).toLocaleString()}{suffix}
            <s className={stack ? "mt-0.5 block text-[0.72em] leading-tight text-grey/70" : "ml-1.5 text-[0.85em] text-grey/70"}>₱{price.toLocaleString()}</s>
        </span>
    );
}
