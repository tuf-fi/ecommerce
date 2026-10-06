// Previous / Next for the settings lists that are read straight from the server one page at a time.
export default function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (pages <= 1) return null;
    const btn = "border border-ink/15 px-4 py-2 text-[12.5px] text-ink transition hover:bg-off disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";
    return (
        <div className="mt-5 flex items-center justify-between gap-3 text-[12.5px] text-grey">
            <span>
                Page {page} of {pages} · {total.toLocaleString()} total
            </span>
            <div className="flex gap-2">
                <button className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>
                    Previous
                </button>
                <button className={btn} disabled={page >= pages} onClick={() => onPage(page + 1)}>
                    Next
                </button>
            </div>
        </div>
    );
}
