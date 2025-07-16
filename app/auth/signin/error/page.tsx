import { ReturnButton } from "@/components/auth/ReturnButton";

interface PageProps {
    searchParams: Promise<{ error: string }>;
}

export default async function page({ searchParams }: PageProps) {
    const params = await searchParams;

    return (
        <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md px-8 py-12 space-y-8">
            <div className="space-y-4">
                <ReturnButton href="/auth/signin" label="Sign In" />
                <h1 className="text-3xl font-bold">Sign In Error</h1>
            </div>

            <p className="text-destructive">
                {params.error === "account_not_linked"
                    ? "This account is not linked to another sign-in method."
                    : "Oops! Something went wrong. Please try again."}
            </p>
        </div>
    );
}
