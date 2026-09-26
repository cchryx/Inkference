"use server";

import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/siteUrl";
import { isBlockedBetween } from "@/lib/visibility";
import { getPaymentProvider } from "@/lib/payments";
import { TIP_CURRENCY, TIP_MAX, TIP_MIN, tipBreakdown } from "@/lib/payments/fees";
import { getSession } from "@/lib/session";

async function me() {
    const session = await getSession();
    return session?.user ?? null;
}

// ---------- Getting paid (the recipient's side) ----------

export type MyPayouts = {
    available: boolean; // payments are set up on the server
    connected: boolean;
    canReceive: boolean;
    canPayout: boolean;
    setupDone: boolean;
    tipsEnabled: boolean;
};

/** Your payout account status (refreshed from the provider while setting up). */
export async function getMyPayouts(): Promise<MyPayouts | null> {
    const user = await me();
    if (!user) return null;
    const provider = getPaymentProvider();
    let account = await prisma.payoutAccount.findUnique({ where: { userId: user.id } });

    // Still setting up: ask the provider for the latest status.
    if (account && provider && account.provider === provider.id && !(account.canReceive && account.setupDone)) {
        try {
            const status = await provider.getPayoutStatus(account.externalId);
            account = await prisma.payoutAccount.update({ where: { id: account.id }, data: status });
        } catch (err) {
            console.error("payout status refresh failed:", err);
        }
    }

    return {
        available: !!provider,
        connected: !!account,
        canReceive: !!account?.canReceive,
        canPayout: !!account?.canPayout,
        setupDone: !!account?.setupDone,
        tipsEnabled: account?.tipsEnabled ?? true,
    };
}

/** Start (or continue) the provider's sign-up. Returns where to send you. */
export async function startPayoutSetup(): Promise<{ error: string | null; url: string | null }> {
    const user = await me();
    if (!user) return { error: "Sign in first.", url: null };
    const provider = getPaymentProvider();
    if (!provider) return { error: "Payments aren't available yet.", url: null };

    try {
        let account = await prisma.payoutAccount.findUnique({ where: { userId: user.id } });
        if (!account) {
            const { externalId } = await provider.createPayoutAccount({ userId: user.id, email: user.email });
            account = await prisma.payoutAccount.create({
                data: { userId: user.id, provider: provider.id, externalId },
            });
        }
        const back = `${SITE_URL}/settings?section=payments`;
        const url = await provider.getOnboardingLink(account.externalId, {
            returnUrl: `${back}&payouts=done`,
            refreshUrl: `${back}&payouts=retry`,
        });
        return { error: null, url };
    } catch (err) {
        console.error("startPayoutSetup failed:", err);
        return { error: "Couldn't start the setup. Please try again.", url: null };
    }
}

export async function openPayoutDashboard(): Promise<{ error: string | null; url: string | null }> {
    const user = await me();
    if (!user) return { error: "Sign in first.", url: null };
    const provider = getPaymentProvider();
    const account = await prisma.payoutAccount.findUnique({ where: { userId: user.id } });
    if (!provider || !account) return { error: "Set up payouts first.", url: null };
    const url = await provider.getDashboardLink(account.externalId);
    return url ? { error: null, url } : { error: "Finish setting up payouts first.", url: null };
}

export async function setTipsEnabled(enabled: boolean) {
    const user = await me();
    if (!user) return { error: "Sign in first." };
    const { count } = await prisma.payoutAccount.updateMany({
        where: { userId: user.id },
        data: { tipsEnabled: !!enabled },
    });
    return count ? { error: null } : { error: "Set up payouts first." };
}

// ---------- Buying a coffee (the supporter's side) ----------

/** Can this person receive coffees right now? Used to show the button. */
export async function getTipTarget(userId: string) {
    if (!getPaymentProvider()) return { canTip: false };
    const account = await prisma.payoutAccount.findUnique({
        where: { userId },
        select: { canReceive: true, tipsEnabled: true },
    });
    return { canTip: !!account?.canReceive && account.tipsEnabled, currency: TIP_CURRENCY };
}

export async function createTipCheckout(input: { toUserId: string; amount: number; message?: string }) {
    const user = await me();
    if (!user) return { error: "Sign in to buy someone a coffee.", url: null };
    const provider = getPaymentProvider();
    if (!provider) return { error: "Payments aren't available yet.", url: null };

    const amount = Math.round(Number(input.amount));
    if (!Number.isFinite(amount) || amount < TIP_MIN || amount > TIP_MAX) {
        return { error: `Pick an amount between $${TIP_MIN / 100} and $${TIP_MAX / 100}.`, url: null };
    }
    if (input.toUserId === user.id) return { error: "You can't buy yourself a coffee.", url: null };

    const [recipient, account] = await Promise.all([
        prisma.user.findUnique({ where: { id: input.toUserId }, select: { id: true, name: true, username: true } }),
        prisma.payoutAccount.findUnique({ where: { userId: input.toUserId } }),
    ]);
    if (!recipient?.username || !account?.canReceive || !account.tipsEnabled || account.provider !== provider.id) {
        return { error: "This person can't receive coffees right now.", url: null };
    }
    if (await isBlockedBetween(user.id, recipient.id)) {
        return { error: "You can't buy this person a coffee.", url: null };
    }

    const breakdown = tipBreakdown(amount);
    const message = input.message?.trim().slice(0, 200) || null;

    const tip = await prisma.tip.create({
        data: {
            provider: provider.id,
            fromUserId: user.id,
            toUserId: recipient.id,
            ...breakdown,
            currency: TIP_CURRENCY,
            message,
        },
    });

    try {
        const profile = `${SITE_URL}/profile/${encodeURIComponent(recipient.username)}`;
        const { externalId, url } = await provider.createTipCheckout({
            tipId: tip.id,
            recipientExternalId: account.externalId,
            recipientName: recipient.name || `@${recipient.username}`,
            breakdown,
            currency: TIP_CURRENCY,
            successUrl: `${profile}?coffee=thanks`,
            cancelUrl: `${profile}?coffee=cancelled`,
            supporterEmail: user.email,
        });
        await prisma.tip.update({ where: { id: tip.id }, data: { externalId } });
        return { error: null, url };
    } catch (err) {
        console.error("createTipCheckout failed:", err);
        await prisma.tip.update({ where: { id: tip.id }, data: { status: "failed" } });
        return { error: "Couldn't start the payment. Please try again.", url: null };
    }
}

// ---------- History ----------

export type TipRow = {
    id: string;
    amount: number;
    toRecipient: number;
    currency: string;
    message: string | null;
    status: string;
    createdAt: string;
    person: { name: string; username: string | null; image: string | null } | null;
};

/** Coffees you received (paid ones) and your totals. */
export async function getMyTips() {
    const user = await me();
    if (!user) return null;
    const [received, totals] = await Promise.all([
        prisma.tip.findMany({
            where: { toUserId: user.id, status: { in: ["paid", "refunded"] } },
            orderBy: { createdAt: "desc" },
            take: 50,
        }),
        prisma.tip.aggregate({
            where: { toUserId: user.id, status: "paid" },
            _sum: { toRecipient: true },
            _count: true,
        }),
    ]);
    const people = await prisma.user.findMany({
        where: { id: { in: received.map((t) => t.fromUserId).filter((x): x is string => !!x) } },
        select: { id: true, name: true, username: true, image: true },
    });
    const byId = new Map(people.map((p) => [p.id, p]));
    const rows: TipRow[] = received.map((t) => {
        const p = t.fromUserId ? byId.get(t.fromUserId) : null;
        return {
            id: t.id,
            amount: t.amount,
            toRecipient: t.toRecipient,
            currency: t.currency,
            message: t.message,
            status: t.status,
            createdAt: t.createdAt.toISOString(),
            person: p ? { name: p.name, username: p.username, image: p.image } : null,
        };
    });
    return { rows, totalEarned: totals._sum.toRecipient ?? 0, count: totals._count };
}
