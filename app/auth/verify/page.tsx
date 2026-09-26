import { ReturnButton } from "@/components/auth/ReturnButton";
import { SendVerificationEmailForm } from "@/components/auth/SendVerificationEmailForm";
import { redirect } from "next/navigation";

interface PageProps {
    searchParams: Promise<{ error?: string }>;
}

// Where you land after tapping the link in the verification email.
const MESSAGES: Record<string, { title: string; text: string }> = {
    email_not_verified: {
        title: "Check your email",
        text: "Your email isn't verified yet, so we just sent you a new link. Open it to finish signing in (check spam too). It works for 1 hour.",
    },
    token_expired: {
        title: "That link expired",
        text: "Verification links only work for 1 hour. Send yourself a new one below.",
    },
    invalid_token: {
        title: "That link didn't work",
        text: "It may have been used already or copied wrong. Send yourself a new one below.",
    },
};

export default async function Page({ searchParams }: PageProps) {
    const error = (await searchParams).error?.toLowerCase();

    // No error = the link worked: you're verified (and signed in).
    if (!error) redirect("/?verified=1");

    const msg = MESSAGES[error] ?? {
        title: "Verify your email",
        text: "Something went wrong with that link. Send yourself a new one below.",
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white ring-1 ring-neutral-900/10 shadow-sm px-5 py-8 sm:px-8 sm:py-10 [clip-path:polygon(18px_0,100%_0,100%_calc(100%-18px),calc(100%-18px)_100%,0_100%,0_18px)] space-y-6">
            <div className="space-y-3">
                <ReturnButton href="/auth/signin" label="Sign In" />
                <h1 className="text-3xl font-bold">{msg.title}</h1>
                <p className="text-muted-foreground">{msg.text}</p>
            </div>

            <div className="space-y-2">
                <p className="text-sm font-medium">Didn&apos;t get it? Send a new link</p>
                <SendVerificationEmailForm />
            </div>
        </div>
    );
}
