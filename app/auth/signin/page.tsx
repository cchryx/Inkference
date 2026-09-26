import { ReturnButton } from "@/components/auth/ReturnButton";
import { SigninForm } from "@/components/auth/SigninForm";
import { SigninOathButton } from "@/components/auth/SigninOathButton";
import Link from "next/link";

export default function page() {
    return (
        <div className="w-full max-w-md mx-auto bg-white ring-1 ring-neutral-900/10 shadow-sm px-5 py-8 sm:px-8 sm:py-10 [clip-path:polygon(18px_0,100%_0,100%_calc(100%-18px),calc(100%-18px)_100%,0_100%,0_18px)] space-y-8">
            <div className="space-y-8">
                <ReturnButton href="/" label="Welcome" />
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
