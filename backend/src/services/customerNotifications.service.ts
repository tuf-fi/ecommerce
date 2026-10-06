import { prisma } from "../lib/prisma";
import { publish } from "../lib/notificationBus";

type Input = { type: "order" | "account" | "voucher"; title: string; body: string; href?: string };

// Never throws: a notification problem must not undo the order, payment or password change it describes.
export async function notifyCustomer(customerId: number, n: Input) {
  try {
    const row = await prisma.customerNotification.create({ data: { customerId, type: n.type, title: n.title, body: n.body, href: n.href ?? null } });
    publish(customerId, "notification", { id: row.id, type: row.type, title: row.title, body: row.body, href: row.href, read: false, createdAt: row.createdAt.toISOString() });
  } catch (err) {
    console.error("[notify] could not save notification", err);
  }
}

// For things addressed to an email (welcome and personal discount codes); does nothing if that person has no account yet.
export async function notifyCustomerByEmail(email: string, n: Input) {
  try {
    const customer = await prisma.customer.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
    if (customer) await notifyCustomer(customer.id, n);
  } catch (err) {
    console.error("[notify] could not look up customer", err);
  }
}

const peso = (v: number) => `₱${v.toLocaleString("en-US")}`;
const ORDERS = "/account/purchases";

type OrderRef = { customerId: number; number: string; total: number };

export const notifyOrderPlaced = (o: OrderRef) =>
  notifyCustomer(o.customerId, { type: "order", title: `Order ${o.number} placed`, body: `Total ${peso(o.total)}. Send your payment and upload a screenshot to confirm it.`, href: ORDERS });

export function notifyOrderStatus(o: OrderRef, status: string, byCustomer: boolean, byShop: boolean) {
  const copy: Record<string, { title: string; body: string }> = {
    PAID: { title: `Payment confirmed for ${o.number}`, body: "We're preparing your order for shipping." },
    SHIPPED: { title: `${o.number} is on its way`, body: "Your order has been handed over for delivery." },
    DELIVERED: { title: `${o.number} was delivered`, body: "We'd love to read your review." },
    CANCELLED: {
      title: `${o.number} was cancelled`,
      body: byCustomer ? "As you asked, your order was cancelled." : byShop ? "If you already paid, we'll be in touch about your refund." : "Payment wasn't received in time. You're welcome to order again.",
    },
  };
  const c = copy[status];
  return c ? notifyCustomer(o.customerId, { type: "order", ...c, href: ORDERS }) : Promise.resolve();
}

export const notifyPaymentRejected = (o: OrderRef, reason: string) =>
  notifyCustomer(o.customerId, { type: "order", title: `Payment screenshot not accepted for ${o.number}`, body: `${reason} Please upload a new screenshot.`, href: ORDERS });

export const notifyRefund = (o: OrderRef, amount: number) =>
  notifyCustomer(o.customerId, { type: "order", title: `Refund sent for ${o.number}`, body: `${peso(amount)} was sent back to you. It may take a little while to show in your account.`, href: ORDERS });

export const notifyPasswordChanged = (customerId: number) =>
  notifyCustomer(customerId, { type: "account", title: "Your password was changed", body: "Your other devices were signed out. If this wasn't you, reset your password and contact us.", href: "/account/password" });

export const notifyProfileUpdated = (customerId: number, what: string) =>
  notifyCustomer(customerId, { type: "account", title: "Profile updated", body: `Your ${what} was updated.`, href: "/account" });

export const notifyVoucher = (email: string, code: string, description: string, expiresAt: Date | null) =>
  notifyCustomerByEmail(email, {
    type: "voucher",
    title: `New discount code: ${code}`,
    body: `${description}.${expiresAt ? ` Valid until ${expiresAt.toLocaleDateString("en-PH", { dateStyle: "medium" })}.` : ""}`,
    href: "/account/vouchers",
  });
