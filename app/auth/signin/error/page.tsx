import { ReturnButton } from "@/components/auth/ReturnButton";

interface PageProps {
    searchParams: Promise<{ error: string }>;
}

export default async function page({ searchParams }: PageProps) {
    const params = await searchParams;

    return (
        <div className="w-full max-w-md mx-auto bg-white ring-1 ring-neutral-900/10 shadow-sm px-5 py-8 sm:px-8 sm:py-10 [clip-path:polygon(18px_0,100%_0,100%_calc(100%-18px),calc(100%-18px)_100%,0_100%,0_18px)] space-y-8">
            <div className="space-y-4">
                <ReturnButton href="/auth/signin" label="Sign In" />
                <h1 className="text-3xl font-bold">Sign In Error</h1>
            </div>

            <p className="text-destructive">
                {params.error === "account_not_linked"
                    ? "An account with this email already exists. Sign in with your email and password, then link this account in Settings under Authentication."
                    : "Oops! Something went wrong. Please try again."}
            </p>
        </div>
    );
}
