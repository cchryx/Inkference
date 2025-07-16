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
        <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md px-8 py-12 space-y-8">
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
