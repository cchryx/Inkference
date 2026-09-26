import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { ReturnButton } from "@/components/auth/ReturnButton";
import { redirect } from "next/navigation";

interface PageProps {
    searchParams: Promise<{ token: string }>;
}

export default async function Page({ searchParams }: PageProps) {
    const token = (await searchParams).token;

    if (!token) redirect("/auth/signin");

    return (
        <div className="w-full max-w-md mx-auto bg-white ring-1 ring-neutral-900/10 shadow-sm px-5 py-8 sm:px-8 sm:py-10 [clip-path:polygon(18px_0,100%_0,100%_calc(100%-18px),calc(100%-18px)_100%,0_100%,0_18px)] space-y-6">
            <div className="space-y-4">
                <ReturnButton href="/auth/signin" label="Sign In" />

                <h1 className="text-3xl font-bold">Reset Password</h1>

                <p className="text-muted-foreground">
                    Please enter your new password. Make sure it is at least 8
                    characters.
                </p>
            </div>

            <ResetPasswordForm token={token} />
        </div>
    );
}
