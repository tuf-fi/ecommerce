// Shared by Orders/Inventory's "Export selected" so both tables produce the same file shape.
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

// Symmetric with toCsv's escaping: handles quoted fields with commas/newlines and doubled `""` as an escaped quote.
export function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;
    // Normalize CRLF up front so \r never has to be handled as its own case.
    const src = text.replace(/\r\n/g, "\n");
    for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        if (inQuotes) {
            if (ch === '"') {
                if (src[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += ch;
            }
            continue;
        }
        if (ch === '"') {
            inQuotes = true;
        } else if (ch === ",") {
            row.push(field);
            field = "";
        } else if (ch === "\n") {
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else {
            field += ch;
        }
    }
    // A trailing newline leaves field empty and row already flushed, so this avoids an extra blank row.
    if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
    }
    return rows.filter((r) => !(r.length === 1 && r[0] === ""));
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
