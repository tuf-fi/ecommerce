export default function PageHeading({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="mb-6 flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-ink/10 pb-4">
            <h2 className="text-lg font-medium text-ink">{children}</h2>
            {action}
        </div>
    );
}
