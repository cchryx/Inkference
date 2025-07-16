import { ReturnButton } from "@/components/auth/ReturnButton";
import { SigninOathButton } from "@/components/auth/SigninOathButton";
import { SignupForm } from "@/components/auth/SignupForm";
import Link from "next/link";

export default function page() {
    return (
        <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md px-8 py-12 space-y-8">
            <div className="space-y-8">
                <ReturnButton href="/welcome" label="Welcome" />{" "}
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
