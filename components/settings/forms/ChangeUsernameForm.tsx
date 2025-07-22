import Loader from "@/components/general/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const ChangeUsernameForm = () => {
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
        evt.preventDefault();
        setIsPending(true);

        // const formData = new FormData(evt.currentTarget);

        // const { error } = await changePasswordAction(formData);

        // if (error) {
        //     toast.error(error);
        // } else {
        //     toast.success("Password changed successfully.");
        //     (evt.target as HTMLFormElement).reset();
        // }

        setIsPending(false);
    }

    return (
        <form
            className="w-full space-y-4 border-gray-200 border-2 p-6 rounded-md"
            onSubmit={handleSubmit}
        >
            <h1 className="text-lg">Change Username</h1>
            <div className="flex flex-col gap-2">
                <Label htmlFor="newUsername">New Username</Label>
                <Input id="newUsername" name="v" disabled={isPending} />
            </div>

            <Button
                type="submit"
                className="cursor-pointer"
                disabled={isPending}
            >
                {isPending && <Loader size={5} color="text-white" />}
                Change Username
            </Button>
        </form>
    );
};

export default ChangeUsernameForm;
