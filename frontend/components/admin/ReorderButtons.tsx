// `index`/`count` drive both the disabled state and the aria-label's position context (e.g. "Move up, position 2 of 6").
export default function ReorderButtons({
    index,
    count,
    onMove,
}: {
    index: number;
    count: number;
    onMove: (direction: "up" | "down") => void;
}) {
    return (
        <div className="flex flex-col gap-0.5 text-grey">
            <button
                type="button"
                disabled={index === 0}
                onClick={(e) => {
                    e.stopPropagation();
                    onMove("up");
                }}
                aria-label={`Move up (position ${index + 1} of ${count})`}
                className="flex h-4 w-4 items-center justify-center hover:text-ink disabled:opacity-25"
            >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 15l-6-6-6 6" />
                </svg>
            </button>
            <button
                type="button"
                disabled={index === count - 1}
                onClick={(e) => {
                    e.stopPropagation();
                    onMove("down");
                }}
                aria-label={`Move down (position ${index + 1} of ${count})`}
                className="flex h-4 w-4 items-center justify-center hover:text-ink disabled:opacity-25"
            >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>
        </div>
    );
}
