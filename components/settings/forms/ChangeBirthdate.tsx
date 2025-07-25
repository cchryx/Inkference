"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/general/Loader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/general/Skeleton";

const ChangeBirthdate = () => {
    const [isPending, setIsPending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [year, setYear] = useState("");
    const [month, setMonth] = useState("");
    const [day, setDay] = useState("");

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1899 }, (_, i) =>
        (1900 + i).toString()
    );
    const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false); // simulate loading
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
        evt.preventDefault();
        setIsPending(true);

        if (!year || !month || !day) {
            alert("Please select year, month, and day");
            setIsPending(false);
            return;
        }

        const date = new Date(
            Date.UTC(Number(year), Number(month) - 1, Number(day))
        );
        const unixTimestamp = Math.floor(date.getTime() / 1000);

        alert(`Unix timestamp: ${unixTimestamp}`);
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

            <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="year">Year</Label>
                    <select
                        id="year"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        disabled={isPending}
                        className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-900 shadow-inner focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    >
                        <option value="">Year</option>
                        {years.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="month">Month</Label>
                    <select
                        id="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        disabled={isPending}
                        className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-900 shadow-inner focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    >
                        <option value="">Month</option>
                        {months.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="day">Day</Label>
                    <select
                        id="day"
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        disabled={isPending}
                        className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-900 shadow-inner focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    >
                        <option value="">Day</option>
                        {days.map((d) => (
                            <option key={d} value={d}>
                                {d}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <Button
                type="submit"
                className="cursor-pointer"
                disabled={isPending}
            >
                {isPending && <Loader size={5} color="text-white" />}
                Change Birthdate
            </Button>
        </form>
    );
};

export default ChangeBirthdate;
