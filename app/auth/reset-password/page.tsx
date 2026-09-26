import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { ReturnButton } from "@/components/auth/ReturnButton";
import { redirect } from "next/navigation";

interface PageProps {
    searchParams: Promise<{ token?: string; error?: string }>;
}

const box =
    "w-full max-w-md mx-auto bg-white ring-1 ring-neutral-900/10 shadow-sm px-5 py-8 sm:px-8 sm:py-10 [clip-path:polygon(18px_0,100%_0,100%_calc(100%-18px),calc(100%-18px)_100%,0_100%,0_18px)] space-y-6";

export default async function Page({ searchParams }: PageProps) {
    const { token, error } = await searchParams;

    // The link was old or already used: offer a new one right here.
    if (error || !token) {
        if (!error) redirect("/auth/forgot-password");
        return (
            <div className={box}>
                <div className="space-y-3">
                    <ReturnButton href="/auth/signin" label="Sign In" />
                    <h1 className="text-3xl font-bold">That link expired</h1>
                    <p className="text-muted-foreground">
                        Password links only work for 1 hour and only once. Enter your email to get a new one.
                    </p>
                </div>
                <ForgotPasswordForm />
            </div>
        );
    }

    return (
        <div className={box}>
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
