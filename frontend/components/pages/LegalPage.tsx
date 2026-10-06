import { StaticPage } from "@/library/admin/types";
import PageHeading from "@/components/ui/PageHeading";
import BackLink from "./BackLink";

type Section = { heading: string | null; blocks: ({ kind: "p"; text: string } | { kind: "ul"; items: string[] })[] };

// Content is plain text from the admin editor: blank line = new block, "## " starts a section, "- " lines make a list.
function parse(content: string): Section[] {
    const sections: Section[] = [{ heading: null, blocks: [] }];
    for (const block of content.split("\n\n").map((b) => b.trim()).filter(Boolean)) {
        if (block.startsWith("## ")) {
            const [first, ...rest] = block.split("\n");
            sections.push({ heading: first.slice(3).trim(), blocks: [] });
            if (rest.join("\n").trim()) sections[sections.length - 1].blocks.push({ kind: "p", text: rest.join(" ").trim() });
        } else if (block.split("\n").every((l) => l.startsWith("- "))) {
            sections[sections.length - 1].blocks.push({ kind: "ul", items: block.split("\n").map((l) => l.slice(2).trim()) });
        } else {
            sections[sections.length - 1].blocks.push({ kind: "p", text: block });
        }
    }
    return sections.filter((s) => s.heading || s.blocks.length > 0);
}

const anchor = (i: number) => `section-${i + 1}`;

// "Orders: what you ordered" -> bold lead-in when the part before the first colon is a short label.
function ListItem({ text }: { text: string }) {
    const i = text.indexOf(": ");
    const lead = i > 0 && i <= 28 ? text.slice(0, i) : null;
    return (
        <li className="relative pl-5 before:absolute before:top-[.8em] before:left-0 before:h-px before:w-2.5 before:bg-ink/40">
            {lead ? (
                <>
                    <span className="font-medium text-ink">{lead}.</span> {text.charAt(i + 2).toUpperCase() + text.slice(i + 3)}
                </>
            ) : (
                text
            )}
        </li>
    );
}

function PolicyBody({ sections, anchors = false }: { sections: Section[]; anchors?: boolean }) {
    let n = 0;
    return (
        <div className="max-w-[72ch]">
            {sections.map((section, si) => {
                if (section.heading) n += 1;
                return (
                    <section
                        key={si}
                        id={anchors && section.heading ? anchor(n - 1) : undefined}
                        className={`${section.heading ? `border-t border-ink/10 pt-8 ${si === 0 ? "" : "mt-10"}` : ""} scroll-mt-[calc(var(--navbar-h,68px)+24px)]`}
                    >
                        {section.heading && (
                            <h2 className="mb-4 flex items-baseline gap-3 font-display text-[18px] font-medium text-ink">
                                <span className="font-mono text-[11px] tracking-[.08em] text-grey">{String(n).padStart(2, "0")}</span>
                                {section.heading}
                            </h2>
                        )}
                        <div className={`space-y-4 text-[14.5px] leading-[1.75] ${section.heading ? "text-ink/85" : "text-[15.5px] text-ink/75"}`}>
                            {section.blocks.map((b, bi) =>
                                b.kind === "p" ? (
                                    <p key={bi}>{b.text}</p>
                                ) : (
                                    <ul key={bi} className="space-y-2.5">
                                        {b.items.map((item, ii) => (
                                            <ListItem key={ii} text={item} />
                                        ))}
                                    </ul>
                                )
                            )}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}

function Updated({ page }: { page: StaticPage }) {
    return page.updated ? <p className="font-mono text-[11px] text-grey">Last updated {page.updated}</p> : null;
}

// Shared by the Privacy Policy, Terms of Service and Shipping & Returns: the public routes, the account area, and the admin live-preview pane (fed unsaved draft content).
// `embedded` renders inside the signed-in account area, which already supplies the sidebar.
export default function LegalPage({ page, preview = false, embedded = false }: { page: StaticPage; preview?: boolean; embedded?: boolean }) {
    const sections = parse(page.content);

    if (preview) {
        return (
            <div className="px-9 py-6">
                <span className="eyebrow text-grey!">{page.category}</span>
                <h1 className="mt-2 text-[22px] font-medium text-ink">{page.name}</h1>
                <div className="mt-6">
                    <PolicyBody sections={sections} />
                </div>
            </div>
        );
    }

    if (embedded) {
        return (
            <div>
                <PageHeading>{page.name}</PageHeading>
                <div className="-mt-2 mb-8">
                    <Updated page={page} />
                </div>
                <PolicyBody sections={sections} />
            </div>
        );
    }

    const headed = sections.filter((s) => s.heading);

    return (
        <div className="mx-auto max-w-[1040px] py-0 md:py-8">
            <BackLink />
            <header className="mb-8 border-b border-ink/10 pb-8 md:mb-12 md:pb-10">
                <h1 className="m-0 font-display text-[clamp(30px,4.5vw,46px)] leading-[1.05] font-medium tracking-tight text-balance text-ink">{page.name}</h1>
                <div className="mt-4">
                    <Updated page={page} />
                </div>
            </header>

            <div className={headed.length > 0 ? "grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16" : ""}>
                {headed.length > 0 && (
                    <nav aria-label="On this page" className="hidden lg:block">
                        <div className="sticky top-[calc(var(--navbar-h,68px)+24px)]">
                            <span className="mb-4 block font-mono text-[10px] uppercase tracking-[.16em] text-grey">On this page</span>
                            <ol className="flex flex-col gap-0.5 border-l border-ink/10">
                                {headed.map((s, i) => (
                                    <li key={i}>
                                        <a
                                            href={`#${anchor(i)}`}
                                            className="-ml-px block border-l border-transparent py-1.5 pl-4 text-[12.5px] leading-snug text-grey transition hover:border-pink-btn hover:text-ink"
                                        >
                                            {s.heading}
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </nav>
                )}
                <PolicyBody sections={sections} anchors />
            </div>
        </div>
    );
}
