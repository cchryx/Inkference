import type { PaymentProvider } from "./types";
import { stripeProvider } from "./stripe";

/**
 * The payment company tips go through. Set PAYMENT_PROVIDER in .env
 * ("stripe" today). Returns null if payments aren't set up, and the app
 * then simply hides the coffee button.
 */
export function getPaymentProvider(name = process.env.PAYMENT_PROVIDER || "stripe"): PaymentProvider | null {
    if (name === "stripe" && process.env.STRIPE_SECRET_KEY) return stripeProvider;
    return null;
}

export type { PaymentProvider, PaymentEvent, PayoutStatus } from "./types";
