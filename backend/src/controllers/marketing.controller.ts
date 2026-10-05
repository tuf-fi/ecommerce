import type { Request, Response } from "express";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";
import { sendMail } from "../services/email.service";

const email = z.string().trim().toLowerCase().email().max(200);
const subscribeSchema = z.object({ email });
const contactSchema = z.object({
  name: z.string().trim().min(1, "Add your name").max(100),
  email,
  message: z.string().trim().min(5, "Add a message").max(3000),
});

function parse<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid request");
  return parsed.data;
}

export async function subscribeNewsletter(req: Request, res: Response) {
  const { email: address } = parse(subscribeSchema, req.body);
  const existing = await prisma.subscriber.findUnique({ where: { email: address } });
  if (!existing) {
    await prisma.subscriber.create({ data: { email: address, source: "newsletter" } });
    void sendMail({ to: address, subject: "Welcome to Cindyrella", text: "Thanks for subscribing — you'll hear from us about new formulas and rituals." });
  }
  // Same answer whether or not they were already on the list.
  res.json({ ok: true });
}

export async function submitContact(req: Request, res: Response) {
  const d = parse(contactSchema, req.body);
  await prisma.contactMessage.create({ data: d });
  const inbox = process.env.CONTACT_INBOX;
  if (inbox) {
    void sendMail({ to: inbox, replyTo: d.email, subject: `Website message from ${d.name}`, text: `From: ${d.name} <${d.email}>\n\n${d.message}` });
  }
  res.json({ ok: true });
}

// No 0/O/1/I so a code read off an email can't be mistyped.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PROMO_PERCENT = 10;
const PROMO_VALID_DAYS = 30;

function newCode() {
  return "WELCOME-" + Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

// One welcome code per email address. Asking again re-sends the same code instead of minting another.
export async function subscribePromo(req: Request, res: Response) {
  const { email: address } = parse(subscribeSchema, req.body);
  await prisma.subscriber.upsert({ where: { email: address }, create: { email: address, source: "promo" }, update: {} });

  let voucher = await prisma.voucher.findFirst({ where: { forEmail: address } });
  if (!voucher) {
    voucher = await prisma.voucher.create({
      data: {
        code: newCode(),
        description: `${PROMO_PERCENT}% off your first order`,
        percentOff: PROMO_PERCENT,
        expiresAt: new Date(Date.now() + PROMO_VALID_DAYS * 24 * 60 * 60 * 1000),
        forEmail: address,
      },
    });
  }
  void sendMail({
    to: address,
    subject: "Your Cindyrella welcome code",
    text: `Use code ${voucher.code} for ${PROMO_PERCENT}% off your first order. It can be used once and expires on ${voucher.expiresAt?.toDateString()}.`,
  });
  // The code is only ever delivered by email.
  res.json({ ok: true });
}
