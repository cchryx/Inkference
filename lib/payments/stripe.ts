import Stripe from "stripe";
import type { PaymentEvent, PaymentProvider, PayoutStatus } from "./types";

/*
 * Stripe Connect with Accounts v2 (what Stripe wants new platforms to use).
 * Each person who turns on tips gets a connected account with the
 * "recipient" configuration: Stripe checks their ID and pays their bank,
 * and they get the Express dashboard.
 * Money path for one coffee (a "destination charge"):
 *   supporter's card -> Stripe -> recipient's Stripe account -> their bank
 *   the recipient gets exactly their share (`transfer_data.amount`) and
 *   Inkference keeps the rest (5% + processing, out of which Stripe takes
 *   its card fee).
 */

let client: Stripe | null = null;
function stripe() {
    if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY!);
    return client;
}

const INCLUDE = ["configuration.recipient", "requirements", "identity", "defaults"] as const;

function toStatus(a: Stripe.V2.Core.Account): PayoutStatus {
    const balance = a.configuration?.recipient?.capabilities?.stripe_balance;
    const transfers = balance?.stripe_transfers?.status === "active";
    const payouts = balance?.payouts ? balance.payouts.status === "active" : transfers;
    // Done when nothing is waiting on the person to fill in.
    const waitingOnUser = (a.requirements?.entries ?? []).some((e) => e.awaiting_action_from === "user");
    return {
        canReceive: transfers,
        canPayout: payouts,
        setupDone: transfers && !waitingOnUser,
        country: a.identity?.country ?? null,
        currency: a.defaults?.currency ?? null,
    };
}

async function statusOf(accountId: string) {
    return toStatus(await stripe().v2.core.accounts.retrieve(accountId, { include: [...INCLUDE] }));
}

export const stripeProvider: PaymentProvider = {
    id: "stripe",

    async createPayoutAccount({ userId, email, country }) {
        const account = await stripe().v2.core.accounts.create({
            contact_email: email,
            display_name: email,
            dashboard: "express",
            identity: { country: (country || process.env.PAYOUT_DEFAULT_COUNTRY || "CA").toLowerCase() },
            defaults: {
                currency: "cad",
                // Inkference (the platform) pays Stripe's fees and covers disputes.
                responsibilities: { fees_collector: "application", losses_collector: "application" },
            },
            configuration: {
                recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } },
            },
            metadata: { userId },
        });
        return { externalId: account.id };
    },

    async getOnboardingLink(externalId, { returnUrl, refreshUrl }) {
        const link = await stripe().v2.core.accountLinks.create({
            account: externalId,
            use_case: {
                type: "account_onboarding",
                account_onboarding: {
                    configurations: ["recipient"],
                    return_url: returnUrl,
                    refresh_url: refreshUrl,
                },
            },
        });
        return link.url;
    },

    async getPayoutStatus(externalId) {
        return statusOf(externalId);
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
                // Send the recipient exactly their share. Inkference keeps
                // the rest (its 5% + the processing fee, which Stripe then
                // takes out). This way the recipient's Stripe dashboard shows
                // a clean "+$2.85" with no fee line.
                transfer_data: { destination: recipientExternalId, amount: breakdown.toRecipient },
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
        // Accounts v2 updates arrive as small "thin" events that only say
        // which account changed; look the account up for its new status.
        let isThin = false;
        try {
            isThin = JSON.parse(body)?.object === "v2.core.event";
        } catch {
            throw new Error("Webhook body isn't JSON");
        }
        if (isThin) {
            for (const secret of secrets) {
                try {
                    const note = stripe().parseEventNotification(body, signature, secret);
                    const id = (note as unknown as { related_object?: { id?: string } }).related_object?.id;
                    if (String(note.type).startsWith("v2.core.account") && id) {
                        return [{ type: "account.updated", externalId: id, status: await statusOf(id) }];
                    }
                    return [];
                } catch {
                    // try the next secret
                }
            }
            throw new Error("Webhook signature didn't match");
        }

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
                // Older-style update for a connected account.
                const a = event.data.object as Stripe.Account;
                return [{ type: "account.updated", externalId: a.id, status: await statusOf(a.id) }];
            }
            default:
                return [] as PaymentEvent[];
        }
    },
};
