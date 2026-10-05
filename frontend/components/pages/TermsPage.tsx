import { StaticPage } from "@/library/admin/types";

// Shared by the real /pages/terms route and the admin's live-preview pane (fed unsaved draft content).
export default function TermsPage({ page, preview = false }: { page: StaticPage; preview?: boolean }) {
    return (
        <div className={preview ? "px-9 py-6" : "mx-auto max-w-[640px] py-16"}>
            {preview ? (
                <span className="eyebrow text-grey">{page.category}</span>
            ) : (
                <div className="flex items-center gap-x-5">
                    <span className="eyebrow text-grey">{page.category}</span>
                    <span className="h-px flex-1 bg-gradient-to-r from-grey-light to-transparent" />
                </div>
            )}
            <h1 className={preview ? "mt-2 text-[22px] font-medium text-ink" : "mt-3 text-[clamp(30px,4vw,46px)] font-medium text-ink"}>{page.name}</h1>
            <div className={preview ? "mt-4 space-y-3 text-[12.5px] leading-relaxed text-ink/85" : "mt-8 space-y-5 text-[15px] leading-relaxed text-ink/85"}>
                {page.content.split("\n\n").filter(Boolean).map((para, i) => (
                    <p key={i}>{para}</p>
                ))}
            </div>
            {!preview && <p className="mt-10 font-mono text-[11px] text-grey">Last updated {page.updated}</p>}
        </div>
    );
}
