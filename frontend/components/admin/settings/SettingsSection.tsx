import PageHeading from "@/components/ui/PageHeading";

// Pass `aside` for a form/task needing a short intro line under the heading; omit it for a self-explanatory list.
export function SettingsSection({
    title,
    action,
    aside,
    children,
}: {
    title: string;
    action?: React.ReactNode;
    aside?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="mb-12 last:mb-0">
            <PageHeading action={action}>{title}</PageHeading>
            {aside ? (
                <div>
                    <p className="mb-7 max-w-[56ch] text-[13px] leading-relaxed text-grey">{aside}</p>
                    {children}
                </div>
            ) : (
                children
            )}
        </section>
    );
}

export function SettingsRow({
    label,
    description,
    control,
}: {
    label: React.ReactNode;
    description?: React.ReactNode;
    control: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-4">
            <div>
                <div className="text-[13.5px] text-ink">{label}</div>
                {description && <div className="mt-0.5 text-[12px] text-grey">{description}</div>}
            </div>
            {control}
        </div>
    );
}

export function SettingsList({ children }: { children: React.ReactNode }) {
    return <div className="flex flex-col divide-y divide-ink/10 border-b border-ink/10">{children}</div>;
}
