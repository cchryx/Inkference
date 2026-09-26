import Stripe from "stripe";
import type { PaymentEvent, PaymentProvider, PayoutStatus } from "./types";

/*
 * Stripe Connect ("Express" accounts). Each person who turns on tips gets
 * their own Stripe account; Stripe checks their ID and pays their bank.
 * Money path for one coffee (a "destination charge"):
 *   supporter's card -> Stripe -> recipient's Stripe account -> their bank
 *   and Inkference keeps the `application_fee_amount` (5% + processing,
 *   out of which Stripe takes its card fee).
 */

let client: Stripe | null = null;
function stripe() {
    if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY!);
    return client;
}

const toStatus = (a: Stripe.Account): PayoutStatus => ({
    canReceive: !!a.charges_enabled,
    canPayout: !!a.payouts_enabled,
    setupDone: !!a.details_submitted,
    country: a.country ?? null,
    currency: a.default_currency ?? null,
});

export const stripeProvider: PaymentProvider = {
    id: "stripe",

    async createPayoutAccount({ userId, email, country }) {
        const account = await stripe().accounts.create({
            type: "express",
            email,
            country: country || process.env.PAYOUT_DEFAULT_COUNTRY || "CA",
            capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
            business_type: "individual",
            metadata: { userId },
        });
        return { externalId: account.id };
    },

    async getOnboardingLink(externalId, { returnUrl, refreshUrl }) {
        const link = await stripe().accountLinks.create({
            account: externalId,
            type: "account_onboarding",
            return_url: returnUrl,
            refresh_url: refreshUrl,
        });
        return link.url;
    },

    async getPayoutStatus(externalId) {
        return toStatus(await stripe().accounts.retrieve(externalId));
    },

    async getDashboardLink(externalId) {
        try {
            const link = await stripe().accounts.createLoginLink(externalId);
            return link.url;
        } catch {
            return null; // not finished setting up yet
        }
    },

    async createTipCheckout({ tipId, recipientExternalId, recipientName, breakdown, currency, successUrl, cancelUrl, supporterEmail }) {
        const session = await stripe().checkout.sessions.create({
            mode: "payment",
            customer_email: supporterEmail,
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency,
                        unit_amount: breakdown.total,
                        product_data: {
                            name: `Coffee for ${recipientName}`,
                            description: "Includes card processing. 95% of the coffee goes to them, 5% to Inkference.",
                        },
                    },
                },
            ],
            payment_intent_data: {
                // Inkference's part: its 5% plus the processing fee
                // (which Stripe then takes out of it).
                application_fee_amount: breakdown.total - breakdown.toRecipient,
                transfer_data: { destination: recipientExternalId },
                metadata: { tipId },
            },
            metadata: { tipId },
            success_url: successUrl,
            cancel_url: cancelUrl,
        });
        if (!session.url) throw new Error("Stripe didn't return a checkout link");
        return { externalId: session.id, url: session.url };
    },

    async handleWebhook(request) {
        const signature = request.headers.get("stripe-signature") ?? "";
        const body = await request.text();
        // Stripe gives each webhook endpoint its own secret: one for your
        // own account's events (payments) and one for connected accounts'
        // events (people finishing payout setup). Accept either.
        const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET].filter(
            (x): x is string => !!x
        );
        let event: Stripe.Event | null = null;
        for (const secret of secrets) {
            try {
                event = stripe().webhooks.constructEvent(body, signature, secret);
                break;
            } catch {
                // try the next secret
            }
        }
        if (!event) throw new Error("Webhook signature didn't match");

        switch (event.type) {
            case "checkout.session.completed":
            case "checkout.session.async_payment_succeeded": {
                const s = event.data.object as Stripe.Checkout.Session;
                const tipId = s.metadata?.tipId;
                if (tipId && s.payment_status === "paid") return [{ type: "tip.paid", tipId }];
                return [];
            }
            case "checkout.session.expired":
            case "checkout.session.async_payment_failed": {
                const s = event.data.object as Stripe.Checkout.Session;
                return s.metadata?.tipId ? [{ type: "tip.failed", tipId: s.metadata.tipId }] : [];
            }
            case "charge.refunded": {
                const charge = event.data.object as Stripe.Charge;
                const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
                if (!piId) return [];
                const pi = await stripe().paymentIntents.retrieve(piId);
                return pi.metadata?.tipId ? [{ type: "tip.refunded", tipId: pi.metadata.tipId }] : [];
            }
            case "account.updated": {
                const a = event.data.object as Stripe.Account;
                return [{ type: "account.updated", externalId: a.id, status: toStatus(a) }];
            }
            default:
                return [] as PaymentEvent[];
        }
    },
};
