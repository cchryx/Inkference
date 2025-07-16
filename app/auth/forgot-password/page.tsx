import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ReturnButton } from "@/components/auth/ReturnButton";

export default function Page() {
    return (
        <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md px-8 py-12 space-y-6">
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
