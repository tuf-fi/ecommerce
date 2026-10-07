import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

// Route-transition fallback: a neutral page shape (heading, section rule, grid) that fits most customer pages.
export default function Loading() {
    return (
        <div role="status" aria-live="polite" aria-label="Loading" className="-mx-[var(--gutter)] min-h-screen w-[calc(100%+var(--gutter)*2)] bg-white px-[var(--gutter)] pt-[calc(var(--navbar-h,68px)+1.2rem)] pb-20">
            <SkeletonGroup>
                <div className="mb-8 border-b border-ink/10 pt-[4.75rem] pb-8 md:mb-12 md:pt-[5.5rem] md:pb-10">
                    <Skeleton className="h-[34px] w-[70%] max-w-[520px] sm:h-[42px]" />
                    <Skeleton className="mt-3 h-[34px] w-[45%] max-w-[340px] sm:h-[42px]" />
                </div>

                <div className="mb-8 flex items-center gap-x-4 sm:gap-x-5 md:mb-11">
                    <Skeleton className="h-[10.5px] w-3" />
                    <Skeleton className="h-[10.5px] w-24" />
                    <span className="h-px flex-1 bg-grey-light/40" />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex flex-col border border-ink/10">
                            <Skeleton tone="faint" className="aspect-[4/5] w-full" />
                            <div className="flex flex-col gap-2 p-5">
                                <Skeleton className="h-[10px] w-16" />
                                <Skeleton className="h-[16.5px] w-4/5" />
                                <Skeleton tone="soft" className="h-3 w-24" />
                            </div>
                        </div>
                    ))}
                </div>
            </SkeletonGroup>
        </div>
    );
}
