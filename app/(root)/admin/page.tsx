import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import AdminPanel, { RoleBadge } from "@/components/admin/AdminPanel";
import { getRawSession } from "@/lib/session";
import { getAccount, isAdminAccount, roleOf } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
    const [session, { user }] = await Promise.all([getRawSession(), searchParams]);
    const account = session ? await getAccount(session.user.id) : null;
    if (!isAdminAccount(account)) notFound(); // not staff: this page doesn't exist for you

    return (
        <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6 pb-24 md:px-6">
            <header className="flex items-center gap-3">
                <div className="rounded-xl bg-black p-2.5 text-white">
                    <ShieldCheck className="size-5" />
                </div>
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold leading-tight">
                        Admin <RoleBadge role={roleOf(account)} />
                    </h1>
                    <p className="text-sm text-gray-500">Reports, people and app settings. Only staff can see this page.</p>
                </div>
            </header>
            <AdminPanel initialUser={user} />
        </div>
    );
}
