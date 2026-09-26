import { ReturnButton } from "@/components/auth/ReturnButton";

export default function Page() {
    return (
        <div className="w-full max-w-md mx-auto bg-white ring-1 ring-neutral-900/10 shadow-sm px-5 py-8 sm:px-8 sm:py-10 [clip-path:polygon(18px_0,100%_0,100%_calc(100%-18px),calc(100%-18px)_100%,0_100%,0_18px)] space-y-6">
            <div className="space-y-4">
                <ReturnButton href="/auth/signin" label="Sign In" />

                <h1 className="text-3xl font-bold">Success</h1>

                <p className="text-muted-foreground">
                    Success! You have re-sent a verification link to your email.
                </p>
            </div>
        </div>
    );
}
