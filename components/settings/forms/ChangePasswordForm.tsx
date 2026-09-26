"use client";

import { useState } from "react";
import { changePasswordAction } from "@/actions/auth/changePassword";
import { requestCreatePassword } from "@/actions/auth/requestCreatePassword";
import { PasswordInput } from "@/components/auth/PasswordInput";
import Loader from "@/components/general/Loader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Props = {
    hasPassword: boolean;
};

const ChangePasswordForm = ({ hasPassword }: Props) => {
    return hasPassword ? <ChangePassword /> : <CreatePassword />;
};

// Users without a password (signed up with Google/GitHub) get an email with
// a link, like "forgot password", and create their password there.
const CreatePassword = () => {
    const [isPending, setIsPending] = useState(false);
    const [sentTo, setSentTo] = useState<string | null>(null);

    async function handleClick() {
        setIsPending(true);
        const result = await requestCreatePassword();
        setIsPending(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            setSentTo(result.email ?? null);
            toast.success("Check your email for a link to create your password.");
        }
    }

    return (
        <div className="w-full space-y-3 border-gray-200 border p-4 rounded-md">
            <h1 className="text-base font-semibold">Create Password</h1>

            <p className="text-sm text-muted-foreground">
                You don&apos;t have a password yet. Add one to also sign in
                with your email and password. We&apos;ll email you a link to
                create it.
            </p>

            {sentTo && (
                <p className="text-sm">
                    Email sent to <span className="font-medium">{sentTo}</span>.
                    The link expires in 1 hour.
                </p>
            )}

            <Button
                type="button"
                className="cursor-pointer"
                disabled={isPending}
                onClick={handleClick}
            >
                {isPending && <Loader size={5} color="text-white" />}
                {sentTo ? "Resend Email" : "Send Email"}
            </Button>
        </div>
    );
};

const ChangePassword = () => {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
        evt.preventDefault();
        const form = evt.currentTarget;
        setIsPending(true);

        const { error } = await changePasswordAction(new FormData(form));

        if (error) {
            toast.error(error);
        } else {
            toast.success("Password changed successfully.");
            form.reset();
            router.refresh();
        }

        setIsPending(false);
    }

    return (
        <form
            className="w-full space-y-3 border-gray-200 border p-4 rounded-md"
            onSubmit={handleSubmit}
        >
            <h1 className="text-base font-semibold">Change Password</h1>

            <div className="flex flex-col gap-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <PasswordInput
                    id="currentPassword"
                    name="currentPassword"
                    disabled={isPending}
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordInput
                    id="newPassword"
                    name="newPassword"
                    disabled={isPending}
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    disabled={isPending}
                />
            </div>

            <Button
                type="submit"
                className="cursor-pointer"
                disabled={isPending}
            >
                {isPending && <Loader size={5} color="text-white" />}
                Change Password
            </Button>
        </form>
    );
};

export default ChangePasswordForm;
