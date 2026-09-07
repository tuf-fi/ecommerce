import { ScaleLoader } from "react-spinners";

export default function AdminLoading() {
    return (
        <div role="status" aria-live="polite" aria-label="Loading" className="flex min-h-screen flex-col items-center justify-center bg-navy px-6 py-24 text-center">
            <div className="mb-7 flex w-full max-w-[360px] items-center gap-x-4">
                <span className="font-mono text-[10.5px] text-grey-light">00</span>
                <span className="font-mono text-[10.5px] uppercase tracking-[.16em] text-white/70">Loading</span>
                <span className="h-px flex-1 bg-gradient-to-r from-white/25 to-transparent" />
            </div>
            <ScaleLoader color="#DA6E93" height={16} width={2} radius={1} margin={3} speedMultiplier={0.85} />
        </div>
    );
}
