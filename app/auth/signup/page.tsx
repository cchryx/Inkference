import { ReturnButton } from "@/components/auth/ReturnButton";
import { SigninOathButton } from "@/components/auth/SigninOathButton";
import { SignupForm } from "@/components/auth/SignupForm";
import Link from "next/link";

export default function page() {
    return (
        <div className="w-full max-w-md mx-auto bg-white ring-1 ring-neutral-900/10 shadow-sm px-5 py-8 sm:px-8 sm:py-10 [clip-path:polygon(18px_0,100%_0,100%_calc(100%-18px),calc(100%-18px)_100%,0_100%,0_18px)] space-y-8">
            <div className="space-y-8">
                <ReturnButton href="/" label="Welcome" />{" "}
                <h1 className="text-3xl font-bold">Sign Up</h1>
            </div>

            <SignupForm />

            <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                    Already have an account?{" "}
                    <Link
                        href="/auth/signin"
                        className="hover:text-foreground underline"
                    >
                        Sign in
                    </Link>
                </p>
                <hr className="max-w-sm mx-auto" />
            </div>

            <div className="flex flex-col gap-4 max-w-sm mx-auto">
                <SigninOathButton signUp provider="google" />
                <SigninOathButton signUp provider="github" />
            </div>
        </div>
    );
}
