export default function StarRating({ rating, count }: { rating: number; count?: number }) {
    const percentage = (rating / 5) * 100;

    return (
        <div
            className="flex items-center gap-x-2 mb-2"
            aria-label={count !== undefined ? `${rating} out of 5 stars, ${count} reviews` : `${rating} out of 5 stars`}
        >
            <div className="relative inline-block w-fit text-[14px] leading-none text-grey-light">
                ★★★★★
                <div className="absolute inset-0 overflow-hidden text-gold" style={{ width: `${percentage}%` }}>
                    ★★★★★
                </div>
            </div>
            {count !== undefined && (
                <span className="text-[12px] text-grey">
                    {rating} ({count})
                </span>
            )}
        </div>
    );
}
