import { StaticPage } from "@/library/admin/types";

// Pure/presentational, fed the page data directly — used by both the real
// /pages/privacy-policy route and the admin's live-preview pane (fed the
// draft content as it's being typed, before Save).
export default function PrivacyPolicyPage({ page, preview = false }: { page: StaticPage; preview?: boolean }) {
    return (
        <div className={preview ? "" : "mx-auto max-w-[640px] py-16"}>
            <span className="eyebrow text-grey">Pages</span>
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
