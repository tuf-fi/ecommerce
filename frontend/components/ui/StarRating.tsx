export default function StarRating({ rating, count }: { rating: number; count: number }) {
    const percentage = (rating / 5) * 100;

    return (
        <div className="flex items-center gap-x-2 mb-2" aria-label={`${rating} out of 5 stars, ${count} reviews`}>
            <div className="relative inline-block w-fit text-[14px] leading-none text-grey-light">
                ★★★★★
                <div className="absolute inset-0 overflow-hidden text-gold" style={{ width: `${percentage}%` }}>
                    ★★★★★
                </div>
            </div>
            <span className="text-[12px] text-grey">
                {rating} ({count})
            </span>
        </div>
    );
}
