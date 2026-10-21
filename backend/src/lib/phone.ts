import { z } from "zod";

// Philippine mobile numbers, stored as 09XXXXXXXXX whether typed as 09…, 9…, 639… or +639…
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  const m = /^(?:\+?63|0)?(9\d{9})$/.exec(digits);
  return m ? `0${m[1]}` : null;
}

export const phoneField = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const phone = normalizePhone(v);
    if (!phone) ctx.addIssue({ code: "custom", message: "Enter a valid mobile number, e.g. 0917 123 4567" });
    return phone ?? "";
  });
