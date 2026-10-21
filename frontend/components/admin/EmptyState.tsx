import EmptyState from "@/components/ui/EmptyState";

export function EmptyStateRow({ colSpan, message }: { colSpan: number; message: string }) {
    return (
        <tr>
            <td colSpan={colSpan}>
                <EmptyState bare message={message} />
            </td>
        </tr>
    );
}

export function EmptyStateBlock({ message }: { message: string }) {
    return <EmptyState bare message={message} />;
}
