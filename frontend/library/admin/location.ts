// A chartered city is unambiguous alone; a municipality needs its province since names repeat across provinces.
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
