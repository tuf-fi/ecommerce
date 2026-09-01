"use client";

import ReactPaginate from "react-paginate";

function Chevron({ direction }: { direction: "left" | "right" }) {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"} />
        </svg>
    );
}

export default function Pagination({
    page,
    totalPages,
    onChange,
}: {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
}) {
    if (totalPages <= 1) return null;

    return (
        <ReactPaginate
            forcePage={page - 1}
            pageCount={totalPages}
            onPageChange={({ selected }) => onChange(selected + 1)}
            pageRangeDisplayed={2}
            marginPagesDisplayed={1}
            previousLabel={
                <>
                    <Chevron direction="left" /> Back
                </>
            }
            nextLabel={
                <>
                    Next <Chevron direction="right" />
                </>
            }
            breakLabel="…"
            containerClassName="mt-8 flex list-none items-center justify-center gap-1.5"
            pageLinkClassName="flex h-8 min-w-8 items-center justify-center border border-ink/10 px-2.5 text-[12px] text-ink transition hover:border-ink/25 hover:bg-off"
            activeLinkClassName="!border-navy !bg-navy !font-semibold !text-white hover:!border-navy hover:!bg-navy"
            previousLinkClassName="flex h-8 items-center justify-center gap-1 border border-ink/10 px-2.5 text-[12px] text-ink transition hover:border-ink/25 hover:bg-off"
            nextLinkClassName="flex h-8 items-center justify-center gap-1 border border-ink/10 px-2.5 text-[12px] text-ink transition hover:border-ink/25 hover:bg-off"
            disabledLinkClassName="!pointer-events-none !opacity-30 hover:!border-ink/10 hover:!bg-transparent"
            breakLinkClassName="flex h-8 min-w-8 items-center justify-center text-[12px] text-grey"
            ariaLabelBuilder={(pageIndex) => `Page ${pageIndex}`}
        />
    );
}
