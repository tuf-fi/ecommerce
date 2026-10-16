import nodemailer, { type Transporter } from "nodemailer";

// Configure with SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / MAIL_FROM. With no SMTP_HOST set, emails are printed to
// the API console instead of sent (development), so every flow still works end to end without a mail account.
let transport: Transporter | null | undefined;

function getTransport() {
  if (transport !== undefined) return transport;
  const host = process.env.SMTP_HOST;
  transport = host
    ? nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      })
    : null;
  return transport;
}

export type Mail = { to: string; subject: string; text: string; replyTo?: string };

const RETRY_DELAYS_MS = [1_000, 4_000];

// Email is a side effect of a request that has already succeeded, so a failure is logged, never thrown.
// A failed send is retried twice before giving up.
export async function sendMail(mail: Mail): Promise<boolean> {
  const t = getTransport();
  if (!t) {
    if (process.env.NODE_ENV !== "production") console.log(`[mail] (not sent, SMTP_HOST unset) to=${mail.to} subject="${mail.subject}"\n${mail.text}`);
    else console.warn(`[mail] SMTP_HOST is not set; dropped "${mail.subject}" to ${mail.to}`);
    return false;
  }
  for (let attempt = 0; ; attempt++) {
    try {
      await t.sendMail({ from: process.env.MAIL_FROM ?? "Cindyrella <no-reply@cindyrella.ph>", ...mail });
      return true;
    } catch (err) {
      if (attempt >= RETRY_DELAYS_MS.length) {
        console.error("[mail] send failed", err);
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }
}
