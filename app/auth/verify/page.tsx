import { ReturnButton } from "@/components/auth/ReturnButton";
import { SendVerificationEmailForm } from "@/components/auth/SendVerificationEmailForm";
import { redirect } from "next/navigation";

interface PageProps {
    searchParams: Promise<{ error: string }>;
}

export default async function Page({ searchParams }: PageProps) {
    const error = (await searchParams).error;

    if (!error) redirect("/profile");

    return (
        <div className="w-full max-w-md mx-auto bg-white ring-1 ring-neutral-900/10 shadow-sm px-5 py-8 sm:px-8 sm:py-10 [clip-path:polygon(18px_0,100%_0,100%_calc(100%-18px),calc(100%-18px)_100%,0_100%,0_18px)] space-y-8">
            <div className="space-y-4">
                <ReturnButton href="/auth/signin" label="Sign In" />

                <h1 className="text-3xl font-bold">Verify Email</h1>
            </div>

            <p className="text-destructive">
                <span className="capitalize">
                    {error.replace(/_/g, " ").replace(/-/g, " ")}
                </span>{" "}
                - Please request a new verification email.
            </p>

            <SendVerificationEmailForm />
        </div>
    );
}
