import { api } from "./client";

export type PaymentMethodId = "gcash" | "maya" | "bank";

export const PAYMENT_METHOD_LABEL: Record<PaymentMethodId, string> = { gcash: "GCash", maya: "Maya", bank: "Bank transfer" };

export type PaymentMethodDetails = {
    id: PaymentMethodId;
    label: string;
    accountName: string;
    // GCash/Maya number, or bank name + account number.
    accountNumber: string;
    notes: string;
};

// Where and how customers send money. Edited in Admin → Settings → Payment Details and stored as CMS content.
export type PaymentInstructions = { intro: string; methods: PaymentMethodDetails[] };

export const EMPTY_PAYMENT_INSTRUCTIONS: PaymentInstructions = {
    intro: "Send the exact order total, then upload a screenshot of your receipt so we can verify it.",
    methods: [
        { id: "gcash", label: "GCash", accountName: "", accountNumber: "", notes: "" },
        { id: "maya", label: "Maya", accountName: "", accountNumber: "", notes: "" },
        { id: "bank", label: "Bank transfer", accountName: "", accountNumber: "", notes: "" },
    ],
};

// Nothing saved yet (404) or an unreachable API both fall back to the empty template.
export async function getPaymentInstructions(): Promise<PaymentInstructions> {
    try {
        const { data } = await api<{ data: Partial<PaymentInstructions> }>("/content/paymentInstructions");
        return { intro: data.intro ?? EMPTY_PAYMENT_INSTRUCTIONS.intro, methods: data.methods ?? EMPTY_PAYMENT_INSTRUCTIONS.methods };
    } catch {
        return EMPTY_PAYMENT_INSTRUCTIONS;
    }
}

export const savePaymentInstructions = (data: PaymentInstructions) =>
    api<{ section: string }>("/content/paymentInstructions", { method: "PATCH", body: JSON.stringify({ data }) });
