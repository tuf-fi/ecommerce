"use client";

import PageHeading from "@/components/ui/PageHeading";
import { useStore } from "@/library/store";

const VOUCHERS = [
    { code: "RITUAL10", desc: "10% off your first order", expires: "No expiry" },
] as const;

export default function VouchersPage() {
    const { showToast } = useStore();

    function copyCode(code: string) {
        navigator.clipboard
            .writeText(code)
            .then(() => showToast("success", `Code "${code}" copied.`))
            .catch(() => showToast("error", "Couldn't copy the code."));
    }

    return (
        <div>
            <PageHeading>My Vouchers</PageHeading>

            <div className="flex flex-col gap-3">
                {VOUCHERS.map((v) => (
                    <div
                        key={v.code}
                        className="flex flex-wrap items-center gap-x-6 gap-y-3 border border-ink/10 p-5 transition hover:border-ink/20"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="font-mono text-[14px] font-semibold tracking-[.04em] text-ink">{v.code}</div>
                            <div className="mt-1 text-[12.5px] text-grey">{v.desc}</div>
                        </div>

                        <div className="flex flex-none items-center gap-4 border-l border-dashed border-ink/15 pl-5">
                            <span className="font-mono text-[10px] uppercase tracking-[.14em] text-grey">{v.expires}</span>
                            <button
                                onClick={() => copyCode(v.code)}
                                className="border border-ink/15 px-4 py-2 text-[11.5px] font-semibold text-ink transition hover:border-pink-btn hover:bg-pink-btn hover:text-white"
                            >
                                Copy Code
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <p className="mt-8 text-center text-[12.5px] text-grey">New vouchers appear here as they become available.</p>
        </div>
    );
}
