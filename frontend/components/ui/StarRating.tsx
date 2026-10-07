// `stack` puts the "No reviews yet" label under the stars on small screens, for narrow cards.
export default function StarRating({ rating, count, stack = false }: { rating: number; count?: number; stack?: boolean }) {
    const percentage = (rating / 5) * 100;
    const unrated = count === 0;

    return (
        <div
            className={`mb-2 flex gap-x-2 ${stack && unrated ? "flex-col items-start gap-y-1 sm:flex-row sm:items-center" : "items-center"}`}
            aria-label={unrated ? "No reviews yet" : count !== undefined ? `${rating} out of 5 stars, ${count} reviews` : `${rating} out of 5 stars`}
        >
            <div className="relative inline-block w-fit text-[14px] leading-none text-gold/25">
                ★★★★★
                <div className="absolute inset-0 overflow-hidden text-gold" style={{ width: `${percentage}%` }}>
                    ★★★★★
                </div>
            </div>
            {count !== undefined && (
                <span className="text-[12px] text-grey">{unrated ? "No reviews yet" : `${rating} (${count})`}</span>
            )}
        </div>
    );
}
