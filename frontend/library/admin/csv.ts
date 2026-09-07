// Shared by Orders/Inventory's "Export selected" bulk action — one CSV
// encoder + download trigger so both tables produce the same file shape
// instead of two bespoke implementations.
export function toCsv<T>(rows: T[], columns: { header: string; value: (row: T) => string | number }[]): string {
    const escape = (v: string | number) => {
        const s = String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [columns.map((c) => escape(c.header)).join(",")];
    for (const row of rows) {
        lines.push(columns.map((c) => escape(c.value(row))).join(","));
    }
    return lines.join("\n");
}

export function downloadCsv(filename: string, csv: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
