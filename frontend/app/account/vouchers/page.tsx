"use client";

import { useEffect, useState } from "react";
import PageHeading from "@/components/ui/PageHeading";
import { useStore } from "@/library/store";
import { listMyVouchers, MyVoucher } from "@/library/api/marketing";

export default function VouchersPage() {
    const { showToast, isLoggedIn } = useStore();
    const [vouchers, setVouchers] = useState<MyVoucher[] | null>(null);

    useEffect(() => {
        if (!isLoggedIn) return;
        let alive = true;
        listMyVouchers()
            .then((list) => alive && setVouchers(list))
            .catch(() => alive && setVouchers([]));
        return () => {
            alive = false;
        };
    }, [isLoggedIn]);

    function copyCode(code: string) {
        navigator.clipboard
            .writeText(code)
            .then(() => showToast("success", `Code "${code}" copied.`))
            .catch(() => showToast("error", "Couldn't copy the code."));
    }

    return (
        <div>
            <PageHeading>My Vouchers</PageHeading>

            {vouchers === null ? (
                <p className="text-[13px] text-grey">Loading…</p>
            ) : vouchers.length === 0 ? (
                <p className="border border-ink/10 p-8 text-center text-[13px] text-grey">
                    You don&apos;t have any vouchers right now. Claim your welcome code from the pop-up on the home page, and it will appear here.
                </p>
            ) : (
                <div className="flex flex-col gap-3">
                    {vouchers.map((v) => (
                        <div key={v.code} className="flex flex-wrap items-center gap-x-6 gap-y-3 border border-ink/10 p-5 transition hover:border-pink-btn/40">
                            <div className="min-w-0 flex-1">
                                <div className="font-mono text-[14px] font-semibold tracking-[.04em] text-ink">{v.code}</div>
                                <div className="mt-1 text-[12.5px] text-grey">{v.description}</div>
                            </div>

                            <div className="flex flex-none items-center gap-4 border-l border-dashed border-ink/15 pl-5">
                                <span className="font-mono text-[10px] uppercase tracking-[.14em] text-grey">
                                    {v.expiresAt ? `Expires ${new Date(v.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : "No expiry"}
                                </span>
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
            )}
        </div>
    );
}
