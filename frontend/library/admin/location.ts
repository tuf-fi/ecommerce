// Reduces a shipping address ("<street>, <City>, <Province>") to the label a
// sales breakdown should group by. A chartered city ("Quezon City") is
// nationally unambiguous on its own; a municipality ("Bacoor") needs its
// province to be placeable, since several provinces share town names.
export function extractLocation(address: string): string {
    const parts = address
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    if (parts.length < 2) return parts[0] ?? address.trim();

    const city = parts[parts.length - 2];
    const province = parts[parts.length - 1];
    return /\bcity$/i.test(city) ? city : `${city}, ${province}`;
}
