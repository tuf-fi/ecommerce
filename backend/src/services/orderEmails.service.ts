import type { OrderStatus } from "../generated/prisma/client";
import { sendMail } from "./email.service";

type OrderMail = { number: string; shipEmail: string; shipName: string; total: number };

const peso = (n: number) => `₱${n.toLocaleString("en-US")}`;
const FOOTER = "\n\nThank you for shopping with Cindyrella.";

// Plain-language messages for the moments customers care about. Sent after the change is saved, never inside it, and a
// failure to send is only logged (see sendMail), so an email problem can never undo an order.
export function emailOrderPlaced(o: OrderMail) {
  return sendMail({
    to: o.shipEmail,
    subject: `We received your order ${o.number}`,
    text: `Hi ${o.shipName},\n\nThanks for your order ${o.number} (${peso(o.total)}).\n\nTo finish, send your payment and upload a screenshot of your receipt from My Purchase on our website. We'll confirm it shortly. Unpaid orders are released after 24 hours.${FOOTER}`,
  });
}

export function emailOrderStatus(o: OrderMail, status: OrderStatus, byCustomer: boolean, byShop: boolean) {
  const lines: Partial<Record<OrderStatus, { subject: string; body: string }>> = {
    PAID: { subject: `Payment received — order ${o.number}`, body: `We've confirmed your payment of ${peso(o.total)}. We'll prepare your order for shipping.` },
    SHIPPED: { subject: `Your order ${o.number} is on its way`, body: "Your order has been handed over for delivery." },
    DELIVERED: { subject: `Your order ${o.number} was delivered`, body: "Your order is marked as delivered. We hope you love it, and we'd be glad to read your review." },
    CANCELLED: {
      subject: `Your order ${o.number} was cancelled`,
      body: byCustomer
        ? "As you asked, your order has been cancelled."
        : byShop
          ? "Your order has been cancelled. If you already paid, we'll be in touch about your refund."
          : "Your order was cancelled because payment wasn't received in time. You're welcome to place it again.",
    },
  };
  const m = lines[status];
  if (!m) return Promise.resolve(false);
  return sendMail({ to: o.shipEmail, subject: m.subject, text: `Hi ${o.shipName},\n\n${m.body}${FOOTER}` });
}

export function emailRefund(o: OrderMail, amount: number) {
  return sendMail({
    to: o.shipEmail,
    subject: `Refund sent — order ${o.number}`,
    text: `Hi ${o.shipName},\n\nWe've refunded ${peso(amount)} for order ${o.number}. It may take a little while to show in your account.${FOOTER}`,
  });
}
