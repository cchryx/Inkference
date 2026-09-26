// How a coffee's money is split. Plain math, safe to use in the browser
// (to show the breakdown) and on the server (to charge it).
//
// If we switch to our own payment system later, only PROCESSING changes
// (it could even be 0), and everything else keeps working.

export const TIP_CURRENCY = "cad";

/** Inkference's cut of the coffee price. */
export const PLATFORM_FEE_PERCENT = 5;

/**
 * What the card processor charges per payment (Stripe, Canadian cards).
 * Check stripe.com/en-ca/pricing if Stripe changes its prices.
 * The supporter pays this on top, so the recipient isn't charged for it.
 */
export const PROCESSING = { percent: 2.9, fixedCents: 30 };

export const TIP_PRESETS = [300, 500, 1000]; // $3, $5, $10
export const TIP_MIN = 200; // $2
export const TIP_MAX = 50_000; // $500

export type TipBreakdown = {
    /** The coffee price the supporter picked. */
    amount: number;
    /** Card processing fee, added on top. */
    processingFee: number;
    /** Inkference's 5%, taken from the coffee price. */
    platformFee: number;
    /** What the supporter's card is charged. */
    total: number;
    /** What the recipient receives. */
    toRecipient: number;
};

/** All values in cents. */
export function tipBreakdown(amount: number): TipBreakdown {
    const platformFee = Math.round((amount * PLATFORM_FEE_PERCENT) / 100);
    const toRecipient = amount - platformFee;
    // Charge enough that after the processor takes its cut, the coffee
    // price is still whole.
    const total = Math.ceil((amount + PROCESSING.fixedCents) / (1 - PROCESSING.percent / 100));
    return { amount, processingFee: total - amount, platformFee, total, toRecipient };
}

export function formatMoney(cents: number, currency = TIP_CURRENCY) {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}
