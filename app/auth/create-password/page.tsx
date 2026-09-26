import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { ReturnButton } from "@/components/auth/ReturnButton";

interface PageProps {
    searchParams: Promise<{ token?: string; error?: string }>;
}

// Opened from the "Create your password" email.
export default async function Page({ searchParams }: PageProps) {
    const { token, error } = await searchParams;

    return (
        <div className="w-full max-w-md mx-auto bg-white ring-1 ring-neutral-900/10 shadow-sm px-5 py-8 sm:px-8 sm:py-10 [clip-path:polygon(18px_0,100%_0,100%_calc(100%-18px),calc(100%-18px)_100%,0_100%,0_18px)] space-y-6">
            <div className="space-y-4">
                <ReturnButton href="/settings" label="Settings" />

                <h1 className="text-3xl font-bold">Create Password</h1>

                {token && !error ? (
                    <p className="text-muted-foreground">
                        Choose a password with at least 8 characters. After
                        this, you can sign in with your email and password as
                        well as your other sign-in methods.
                    </p>
                ) : (
                    <p className="text-destructive">
                        This link is invalid or has expired. Go to Settings,
                        then Authentication, to get a new one.
                    </p>
                )}
            </div>

            {token && !error && <ResetPasswordForm token={token} mode="create" />}
        </div>
    );
}
