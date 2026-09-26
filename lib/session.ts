import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { activeBan, getAccount } from "@/lib/admin";

/** The signed-in person's session, even if they're banned (for the ban screen). */
export const getRawSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/**
 * The signed-in person's session, or null. Banned people count as signed
 * out here, so they can't do anything until the ban ends.
 */
export const getSession = cache(async () => {
    const session = await getRawSession();
    if (!session) return null;
    if (activeBan(await getAccount(session.user.id))) return null;
    return session;
});
