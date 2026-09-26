import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { getPaymentProvider } from "@/lib/payments";

// The payment company calls this when something happens (a coffee was
// paid, an account finished setting up...). Stripe: /api/webhooks/payments/stripe
export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
    const { provider: name } = await params;
    const provider = getPaymentProvider(name);
    if (!provider) return new Response("Unknown provider", { status: 404 });

    let events;
    try {
        events = await provider.handleWebhook(request);
    } catch (err) {
        console.error("payment webhook rejected:", err);
        return new Response("Invalid signature", { status: 400 });
    }

    for (const e of events) {
        try {
            if (e.type === "tip.paid") {
                // Only the first "paid" counts (providers can send an event twice).
                const { count } = await prisma.tip.updateMany({
                    where: { id: e.tipId, status: { not: "paid" } },
                    data: { status: "paid", paidAt: new Date() },
                });
                if (count) {
                    const tip = await prisma.tip.findUnique({ where: { id: e.tipId } });
                    if (tip) {
                        await notify({
                            recipientId: tip.toUserId,
                            actorId: tip.fromUserId,
                            type: "tip",
                            targetId: tip.id,
                            preview: tip.message,
                        });
                    }
                }
            } else if (e.type === "tip.failed") {
                await prisma.tip.updateMany({ where: { id: e.tipId, status: "pending" }, data: { status: "failed" } });
            } else if (e.type === "tip.refunded") {
                await prisma.tip.updateMany({ where: { id: e.tipId }, data: { status: "refunded" } });
            } else if (e.type === "account.updated") {
                await prisma.payoutAccount.updateMany({ where: { externalId: e.externalId }, data: e.status });
            }
        } catch (err) {
            console.error("payment webhook event failed:", e, err);
        }
    }

    return Response.json({ received: true });
}
