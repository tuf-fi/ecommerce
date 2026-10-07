export type OrderStatus = "To Ship" | "To Receive" | "Completed" | "Cancelled" | "Return Refund";

// none: nothing sent yet · review: a screenshot is waiting for staff · rejected: the last one was refused · approved: verified
export type PaymentState = "none" | "review" | "rejected" | "approved";

export type ProofInfo = {
    id: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    method: string;
    reference: string | null;
    note: string | null;
    rejectReason: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
    createdAt: string;
};

export type OrderLine = { productId: number; name: string; qty: number; unitPrice: number };

export type Order = {
    status: OrderStatus;
    product: string;
    productId: number;
    qty: number;
    total: number;
    steps: string[];
    current: number;
    eta: string;
    date: string;
    // Every line on the order; `product`/`productId`/`qty` above summarise it for the list row.
    items?: OrderLine[];
    payment?: { state: PaymentState; rejectReason: string | null };
    // True while the server still has the order unpaid (its payment screenshot is being checked, or needs redoing).
    awaitingPayment?: boolean;
    // The money breakdown fixed when the order was placed (total = subtotal - discount + shippingFee).
    subtotal?: number;
    discount?: number;
    shippingFee?: number;
    voucherCode?: string;
    // Set once the shop has sent money back.
    refund?: { at: string; amount: number; note: string | null };
};

export const ORDER_STATUS_TABS = ["All", "To Ship", "To Receive", "Completed", "Cancelled", "Return Refund"] as const;
