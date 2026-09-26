"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { autocomplete } from "@/lib/googleMaps";

import Loader from "@/components/general/Loader";
import { Skeleton } from "@/components/general/Skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProfileChangeStatus } from "@/actions/profile/getProfileChangeStatus";
import { AlertCircle } from "lucide-react";
import { changeProfileAction } from "@/actions/profile/changeProfile";
import { useRouter } from "next/navigation";

function useClickOutside(
    ref: React.RefObject<HTMLElement | null>,
    handler: () => void
) {
    useEffect(() => {
        const listener = (event: MouseEvent) => {
            const el = ref.current;
            if (!el || el.contains(event.target as Node)) return;
            handler();
        };

        document.addEventListener("mousedown", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
        };
    }, [ref, handler]);
}

type Props = {
    address: string | null;
    isLoading?: boolean;
};

export default function ChangeAddressForm({ address, isLoading }: Props) {
    const router = useRouter();
    const [input, setInput] = useState(address ?? "");
    const [isPending, setIsPending] = useState(false);
    const [suggestions, setSuggestions] = useState<
        { description: string; place_id: string }[]
    >([]);
    const [selected, setSelected] = useState("");
    const [focused, setFocused] = useState(false);
    const [status, setStatus] = useState<{
        canChange: boolean;
        timeLeft: string | null;
    }>({ canChange: true, timeLeft: null });

    const wrapperRef = useRef<HTMLDivElement>(null);

    useClickOutside(wrapperRef, () => {
        setSuggestions([]);
    });

    useEffect(() => {
        if (!isLoading) {
            setInput(address || "");
            getProfileChangeStatus("address").then(setStatus);
        }
    }, [isLoading]);

    useEffect(() => {
        if (input === selected || !input) {
            setSuggestions([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            const results = await autocomplete(input);
            const simplified = results.map((r: any) => ({
                description: r.formatted_address || r.name,
                place_id: r.place_id,
            }));
            setSuggestions(simplified);
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [input, selected]);

    async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
        evt.preventDefault();
        setIsPending(true);

        if (!selected) {
            toast.error("Please select a valid address from the suggestions.");
            setIsPending(false);
            return;
        }

        const formData = new FormData(evt.currentTarget);
        const { error } = await changeProfileAction(formData, "address");

        if (error) {
            toast.error(error);
        } else {
            toast.success("Address changed successfully.");
            getProfileChangeStatus("address").then(setStatus);
            router.refresh();
        }

        setIsPending(false);
    }

    if (isLoading) {
        return (
            <div className="w-full space-y-3 border-gray-200 border p-4 rounded-md">
                <Skeleton className="h-6 w-32 rounded-md" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                </div>
                <Skeleton className="h-10 w-40 rounded-md" />
            </div>
        );
    }

    return (
        <form
            className="w-full space-y-3 border-gray-200 border p-4 rounded-md"
            onSubmit={handleSubmit}
        >
            <h1 className="text-base font-semibold">Change Address</h1>

            <div className="flex flex-col gap-2 relative" ref={wrapperRef}>
                <Label htmlFor="address">New Address</Label>

                <div className="relative">
                    <Input
                        id="address"
                        name="address"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            setSelected("");
                        }}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        disabled={isPending || !status.canChange}
                        autoComplete="off"
                        placeholder="Start typing your address"
                    />

                    {focused && suggestions.length > 0 && (
                        <ul className="scroll-thin absolute left-0 right-0 top-full mt-1 w-full rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/10 max-h-56 overflow-y-auto z-20">
                            {suggestions.map((s) => (
                                <li
                                    key={s.place_id}
                                    className="cursor-pointer rounded-lg px-2.5 py-1.5 hover:bg-gray-100 text-sm"
                                    onMouseDown={() => {
                                        setInput(s.description);
                                        setSelected(s.description);
                                        setSuggestions([]);
                                    }}
                                >
                                    {s.description}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <p className="text-xs text-muted-foreground">
                    <AlertCircle className="w-5 h-5 inline align-middle mr-1" />
                    {status.canChange
                        ? "You can change your address now. You’ll be limited to one change every 7 days."
                        : `You can change your address again in ${status.timeLeft}.`}
                </p>
            </div>

            <Button
                type="submit"
                className="cursor-pointer"
                disabled={isPending || !status.canChange}
            >
                {isPending && <Loader size={5} color="text-white" />}
                Change Address
            </Button>
        </form>
    );
}
