import type { TipBreakdown } from "./fees";

/*
 * What any payment company has to be able to do for tips. Stripe is the
 * first one (lib/payments/stripe.ts). A future in-house system just needs
 * to implement this too; the rest of the app doesn't change.
 */

export type PayoutStatus = {
    canReceive: boolean;
    canPayout: boolean;
    setupDone: boolean;
    country?: string | null;
    currency?: string | null;
};

/** Things the provider tells us happened (from its webhook). */
export type PaymentEvent =
    | { type: "tip.paid"; tipId: string }
    | { type: "tip.failed"; tipId: string }
    | { type: "tip.refunded"; tipId: string }
    | { type: "account.updated"; externalId: string; status: PayoutStatus };

export interface PaymentProvider {
    id: string;

    /** Make an account for someone to get paid into. */
    createPayoutAccount(input: { userId: string; email: string; country?: string }): Promise<{ externalId: string }>;
    /** Link to the provider's sign-up (bank details, ID check). */
    getOnboardingLink(externalId: string, urls: { returnUrl: string; refreshUrl: string }): Promise<string>;
    getPayoutStatus(externalId: string): Promise<PayoutStatus>;
    /** Link to see their balance and payouts, if the provider has one. */
    getDashboardLink(externalId: string): Promise<string | null>;

    /** Start paying for a coffee. Returns where to send the supporter. */
    createTipCheckout(input: {
        tipId: string;
        recipientExternalId: string;
        recipientName: string;
        breakdown: TipBreakdown;
        currency: string;
        successUrl: string;
        cancelUrl: string;
        supporterEmail?: string;
    }): Promise<{ externalId: string; url: string }>;

    /** Check a webhook is really from the provider and read what happened. */
    handleWebhook(request: Request): Promise<PaymentEvent[]>;
}
