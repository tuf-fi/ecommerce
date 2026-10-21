// Philippine mobile numbers, kept as 09XXXXXXXXX (same rule as the API).
export function normalizePhone(input: string): string | null {
    const digits = input.replace(/[\s\-().]/g, "");
    const m = /^(?:\+?63|0)?(9\d{9})$/.exec(digits);
    return m ? `0${m[1]}` : null;
}

export const PHONE_ERROR = "Enter a valid mobile number, e.g. 0917 123 4567.";

export function formatPhone(phone: string): string {
    return /^09\d{9}$/.test(phone) ? `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}` : phone;
}
