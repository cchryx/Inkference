import { ReturnButton } from "@/components/auth/ReturnButton";
import { SigninForm } from "@/components/auth/SigninForm";
import { SigninOathButton } from "@/components/auth/SigninOathButton";
import Link from "next/link";

export default function page() {
    return (
        <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md px-8 py-12 space-y-8">
            <div className="space-y-8">
                <ReturnButton href="/welcome" label="Welcome" />
                <h1 className="text-3xl font-bold">Sign In</h1>
            </div>

            <div className="space-y-4">
                <SigninForm />

                <p className="text-muted-foreground text-sm">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/auth/signup"
                        className="hover:text-foreground underline"
                    >
                        Sign up
                    </Link>
                </p>
                <hr className="max-w-sm mx-auto" />
            </div>

            <div className="flex flex-col gap-4 max-w-sm mx-auto">
                <SigninOathButton provider="google" />
                <SigninOathButton provider="github" />
            </div>
        </div>
    );
}
