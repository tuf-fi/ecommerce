"use client";

import { useEffect, useState } from "react";
import { fetchProofImage } from "@/library/api/orders";

// Payment screenshots are private, so they can't be a plain <img src>: they are fetched with the signed-in cookie and
// shown from a temporary in-memory URL, which is released when the component goes away.
export default function ProofImage({ orderNo, proofId, className = "" }: { orderNo: string; proofId: number; className?: string }) {
    const [state, setState] = useState<{ key: string; url: string | null }>({ key: "", url: null });
    const key = `${orderNo}/${proofId}`;

    useEffect(() => {
        let revoked = false;
        let objectUrl: string | null = null;
        fetchProofImage(orderNo, proofId)
            .then((url) => {
                objectUrl = url;
                if (revoked) URL.revokeObjectURL(url);
                else setState({ key, url });
            })
            .catch(() => !revoked && setState({ key, url: null }));
        return () => {
            revoked = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [orderNo, proofId, key]);

    if (state.key !== key) return <div className={`animate-pulse bg-off ${className}`} aria-label="Loading screenshot" />;
    if (!state.url) return <div className={`flex items-center justify-center bg-off text-[12px] text-grey ${className}`}>Couldn&apos;t load screenshot</div>;
    return (
        <a href={state.url} target="_blank" rel="noreferrer" aria-label="Open screenshot full size">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.url} alt="Payment screenshot" className={className} />
        </a>
    );
}
