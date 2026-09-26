import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ReturnButton } from "@/components/auth/ReturnButton";

export default function Page() {
    return (
        <div className="w-full max-w-md mx-auto bg-white ring-1 ring-neutral-900/10 shadow-sm px-5 py-8 sm:px-8 sm:py-10 [clip-path:polygon(18px_0,100%_0,100%_calc(100%-18px),calc(100%-18px)_100%,0_100%,0_18px)] space-y-6">
            <div className="space-y-4">
                <ReturnButton href="/auth/signin" label="Sign In" />

                <h1 className="text-3xl font-bold">Forgot Password</h1>

                <p className="text-muted-foreground">
                    Please enter your email address to receive a password reset
                    link.
                </p>
            </div>

            <ForgotPasswordForm />
        </div>
    );
}
