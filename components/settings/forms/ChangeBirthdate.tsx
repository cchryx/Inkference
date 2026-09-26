"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/general/Loader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/general/Skeleton";
import { changeProfileAction } from "@/actions/profile/changeProfile";
import { getProfileChangeStatus } from "@/actions/profile/getProfileChangeStatus";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import Dropdown from "@/components/general/Dropdown";
import { useRouter } from "next/navigation";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Props = {
    birthdate: number | null;
    isLoading?: boolean;
};

const ChangeBirthdate = ({ birthdate, isLoading }: Props) => {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [year, setYear] = useState("");
    const [month, setMonth] = useState("");
    const [day, setDay] = useState("");
    const [status, setStatus] = useState<{
        canChange: boolean;
        timeLeft: string | null;
    }>({ canChange: true, timeLeft: null });

    useEffect(() => {
        if (!isLoading && birthdate) {
            const date = new Date(birthdate * 1000);
            setDay(date.getDate().toString());
            setMonth((date.getMonth() + 1).toString());
            setYear(date.getFullYear().toString());

            getProfileChangeStatus("birthdate").then(setStatus);
        }
    }, [isLoading, birthdate]);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1899 }, (_, i) =>
        (1900 + i).toString()
    ).reverse();
    const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

    async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
        evt.preventDefault();
        setIsPending(true);

        if (!year || !month || !day) {
            toast.error("Please select year, month, and day.");
            setIsPending(false);
            return;
        }

        const date = new Date(
            Date.UTC(Number(year), Number(month) - 1, Number(day))
        );
        const unixTimestamp = Math.floor(date.getTime() / 1000);

        const formData = new FormData(evt.currentTarget);
        formData.set("birthdate", String(unixTimestamp));

        const { error } = await changeProfileAction(formData, "birthdate");

        if (error) {
            toast.error(error);
        } else {
            toast.success("Birthdate changed successfully.");
            getProfileChangeStatus("birthdate").then(setStatus);
            router.refresh();
        }

        setIsPending(false);
    }

    if (isLoading) {
        return (
            <div className="w-full space-y-3 border-gray-200 border p-4 rounded-md">
                <Skeleton className="h-6 w-1/4 rounded-md" />
                <div className="flex flex-wrap gap-4">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-10 rounded-md" />
                        <Skeleton className="h-10 w-[100px] rounded-md" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-14 rounded-md" />
                        <Skeleton className="h-10 w-[100px] rounded-md" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-8 rounded-md" />
                        <Skeleton className="h-10 w-[100px] rounded-md" />
                    </div>
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                </div>
                <Skeleton className="h-10 w-[160px] rounded-md" />
            </div>
        );
    }

    return (
        <form
            className="w-full space-y-3 border-gray-200 border p-4 rounded-md"
            onSubmit={handleSubmit}
        >
            <h1 className="text-base font-semibold">Change Birthdate</h1>

            <div className="flex flex-wrap gap-2 relative">
                {[
                    { label: "Year", value: year, items: years.map((y) => ({ value: y, label: y })), set: setYear },
                    {
                        label: "Month",
                        value: month,
                        items: months.map((m) => ({ value: m, label: MONTH_NAMES[Number(m) - 1] })),
                        set: setMonth,
                    },
                    { label: "Day", value: day, items: days.map((d) => ({ value: d, label: d })), set: setDay },
                ].map((f) => (
                    <div key={f.label} className="w-[100px] text-sm">
                        <Label className="mb-1 text-sm font-medium text-gray-700">{f.label}</Label>
                        <Dropdown
                            value={f.value}
                            options={f.items}
                            onChange={f.set}
                            placeholder={f.label}
                            disabled={isPending || !status.canChange}
                            aria-label={f.label}
                            className="w-full"
                        />
                    </div>
                ))}

                <p className="text-xs text-muted-foreground">
                    <AlertCircle className="w-5 h-5 inline align-middle mr-1" />
                    {status.canChange
                        ? "You can change your birthdate now. You'll be limited to one change every 120 days."
                        : `You can change your birthdate again in ${status.timeLeft}.`}
                </p>
            </div>

            <Button
                type="submit"
                className="cursor-pointer"
                disabled={isPending || !status.canChange}
            >
                {isPending && <Loader size={5} color="text-white" />}
                Change Birthdate
            </Button>
        </form>
    );
};

export default ChangeBirthdate;
