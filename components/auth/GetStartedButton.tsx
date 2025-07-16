"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

export const GetStartedButton = () => {
    const { data: session, isPending } = useSession();

    if (isPending) {
        return (
            <Button size="lg" className="opacity-50" asChild>
                <span>Get Started</span>
            </Button>
        );
    }

    const href = session ? "/" : "/auth/signin";

    return (
        <div className="flex flex-col items-center gap-4">
            <Button size="lg" className="cursor-pointer" asChild>
                <Link href={href}>Get Started</Link>
            </Button>

            {session && <p>Welcome back, {session.user.name}! 👋</p>}
        </div>
    );
};
