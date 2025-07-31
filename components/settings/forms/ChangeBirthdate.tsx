"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/general/Loader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/general/Skeleton";
import { changeProfileAction } from "@/actions/profile/changeProfile";
import { getProfileChangeStatus } from "@/actions/profile/getProfileChangeStatus";
import { toast } from "sonner";
import { AlertCircle, ChevronDown } from "lucide-react";

type Props = {
    birthdate: number | null;
    isLoading?: boolean;
};

const ChangeBirthdate = ({ birthdate, isLoading }: Props) => {
    const [isPending, setIsPending] = useState(false);
    const [year, setYear] = useState("");
    const [month, setMonth] = useState("");
    const [day, setDay] = useState("");
    const [yearOpen, setYearOpen] = useState(false);
    const [monthOpen, setMonthOpen] = useState(false);
    const [dayOpen, setDayOpen] = useState(false);
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
        }

        setIsPending(false);
    }

    if (isLoading) {
        return (
            <div className="w-full space-y-4 border-gray-200 border-2 p-6 rounded-md">
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
            className="w-full space-y-4 border-gray-200 border-2 p-6 rounded-md"
            onSubmit={handleSubmit}
        >
            <h1 className="text-lg">Change Birthdate</h1>

            <div className="flex flex-wrap gap-2 relative">
                {/* YEAR */}
                <div className="relative w-[100px] text-sm">
                    <Label
                        htmlFor="year"
                        className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                        Year
                    </Label>
                    <button
                        type="button"
                        disabled={isPending || !status.canChange}
                        onClick={() => {
                            setYearOpen(!yearOpen);
                            setMonthOpen(false);
                            setDayOpen(false);
                        }}
                        onBlur={() => setTimeout(() => setYearOpen(false), 200)}
                        className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-inner focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 w-full text-left flex justify-between items-center"
                    >
                        {year || "Year"}
                        <ChevronDown className="w-4 h-4 opacity-60" />
                    </button>
                    {yearOpen && (
                        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-300 bg-white dark:bg-gray-800 text-sm shadow-md">
                            {years.map((y) => (
                                <li
                                    key={y}
                                    onClick={() => {
                                        setYear(y);
                                        setYearOpen(false);
                                    }}
                                    className="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    {y}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* MONTH */}
                <div className="relative w-[100px] text-sm">
                    <Label
                        htmlFor="month"
                        className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                        Month
                    </Label>
                    <button
                        type="button"
                        disabled={isPending || !status.canChange}
                        onClick={() => {
                            setMonthOpen(!monthOpen);
                            setYearOpen(false);
                            setDayOpen(false);
                        }}
                        onBlur={() =>
                            setTimeout(() => setMonthOpen(false), 200)
                        }
                        className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-inner focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 w-full text-left flex justify-between items-center"
                    >
                        {month || "Month"}
                        <ChevronDown className="w-4 h-4 opacity-60" />
                    </button>
                    {monthOpen && (
                        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-300 bg-white dark:bg-gray-800 text-sm shadow-md">
                            {months.map((m) => (
                                <li
                                    key={m}
                                    onClick={() => {
                                        setMonth(m);
                                        setMonthOpen(false);
                                    }}
                                    className="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    {m}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* DAY */}
                <div className="relative w-[100px] text-sm">
                    <Label
                        htmlFor="day"
                        className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                        Day
                    </Label>
                    <button
                        type="button"
                        disabled={isPending || !status.canChange}
                        onClick={() => {
                            setDayOpen(!dayOpen);
                            setMonthOpen(false);
                            setYearOpen(false);
                        }}
                        onBlur={() => setTimeout(() => setDayOpen(false), 200)}
                        className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-inner focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 w-full text-left flex justify-between items-center"
                    >
                        {day || "Day"}
                        <ChevronDown className="w-4 h-4 opacity-60" />
                    </button>
                    {dayOpen && (
                        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-300 bg-white dark:bg-gray-800 text-sm shadow-md">
                            {days.map((d) => (
                                <li
                                    key={d}
                                    onClick={() => {
                                        setDay(d);
                                        setDayOpen(false);
                                    }}
                                    className="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    {d}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

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
