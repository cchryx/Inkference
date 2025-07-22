import Loader from "@/components/general/Loader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // using ShadCN textarea
import { useState } from "react";

const MAX_LINES = 8;

const ChangeBioForm = () => {
    const [isPending, setIsPending] = useState(false);
    const [bio, setBio] = useState("");

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

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const lineCount = value.split("\n").length;

        if (lineCount <= MAX_LINES) {
            setBio(value);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const lineCount = bio.split("\n").length;

        if (e.key === "Enter" && lineCount >= MAX_LINES) {
            e.preventDefault(); // prevent adding a new line
        }
    };

    return (
        <form
            className="w-full space-y-4 border-gray-200 border-2 p-6 rounded-md"
            onSubmit={handleSubmit}
        >
            <h1 className="text-lg">Change Bio</h1>
            <div className="flex flex-col gap-2">
                <Label htmlFor="newBio">New Bio</Label>
                <Textarea
                    id="newBio"
                    name="v"
                    value={bio}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={isPending}
                    rows={4}
                    className="resize-none max-h-[8lh] scrollbar-no-buttons"
                />
            </div>

            <Button
                type="submit"
                className="cursor-pointer"
                disabled={isPending}
            >
                {isPending && <Loader size={5} color="text-white" />}
                Change Bio
            </Button>
        </form>
    );
};

export default ChangeBioForm;
