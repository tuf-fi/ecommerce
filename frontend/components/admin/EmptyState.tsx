// `variant` distinguishes "filtered" (search excludes all items) from "empty" (collection is genuinely empty) even though both render identically today.
export type EmptyStateVariant = "filtered" | "empty";

export function EmptyStateRow({
    colSpan,
    message,
}: {
    colSpan: number;
    variant: EmptyStateVariant;
    message: string;
}) {
    return (
        <tr>
            <td colSpan={colSpan} className="px-5 py-16 text-center text-[13px] text-grey">
                {message}
            </td>
        </tr>
    );
}

export function EmptyStateBlock({ message }: { variant: EmptyStateVariant; message: string }) {
    return <div className="px-5 py-16 text-center text-[13px] text-grey">{message}</div>;
}
