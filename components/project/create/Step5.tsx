"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Label } from "@radix-ui/react-label";
import InfoTooltip from "@/components/general/InfoToolTip";

type Props = {
    onChange: (dates: {
        status: "In Progress" | "Complete";
        startDate: number | null;
        endDate: number | null;
    }) => void;
    initialValue?: {
        status: "In Progress" | "Complete";
        startDate: number | null;
        endDate: number | null;
    };
};

const Step5 = ({ onChange, initialValue }: Props) => {
    const [status, setStatus] = useState<"In Progress" | "Complete">(
        initialValue?.status || "In Progress"
    );

    const toParts = (timestamp: number | null) => {
        if (!timestamp) return { y: "", m: "", d: "" };
        const date = new Date(timestamp * 1000);
        return {
            y: date.getUTCFullYear().toString(),
            m: (date.getUTCMonth() + 1).toString(),
            d: date.getUTCDate().toString(),
        };
    };

    const start = toParts(initialValue?.startDate || null);
    const end = toParts(initialValue?.endDate || null);

    const [startYear, setStartYear] = useState(start.y);
    const [startMonth, setStartMonth] = useState(start.m);
    const [startDay, setStartDay] = useState(start.d);

    const [endYear, setEndYear] = useState(end.y);
    const [endMonth, setEndMonth] = useState(end.m);
    const [endDay, setEndDay] = useState(end.d);

    const [startOpen, setStartOpen] = useState({
        y: false,
        m: false,
        d: false,
    });
    const [endOpen, setEndOpen] = useState({ y: false, m: false, d: false });
    const [statusOpen, setStatusOpen] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1899 }, (_, i) =>
        (1900 + i).toString()
    ).reverse();
    const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const allDays = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

    const getDaysInMonth = (yearStr: string, monthStr: string): string[] => {
        const y = parseInt(yearStr);
        const m = parseInt(monthStr);
        if (!y || !m) return allDays;

        const daysInMonth = new Date(y, m, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) =>
            (i + 1).toString()
        );
    };

    useEffect(() => {
        const max = getDaysInMonth(startYear, startMonth).length;
        if (startDay && parseInt(startDay) > max) {
            setStartDay(max.toString());
        }
    }, [startYear, startMonth]);

    useEffect(() => {
        const max = getDaysInMonth(endYear, endMonth).length;
        if (endDay && parseInt(endDay) > max) {
            setEndDay(max.toString());
        }
    }, [endYear, endMonth]);

    useEffect(() => {
        const startValid = startYear && startMonth && startDay;
        const endValid = endYear && endMonth && endDay;

        const toUnix = (y: string, m: string, d: string) =>
            Math.floor(Date.UTC(+y, +m - 1, +d) / 1000);

        onChange({
            status,
            startDate: startValid
                ? toUnix(startYear, startMonth, startDay)
                : null,
            endDate:
                status === "Complete" && endValid
                    ? toUnix(endYear, endMonth, endDay)
                    : null,
        });
    }, [status, startYear, startMonth, startDay, endYear, endMonth, endDay]);

    const renderDropdown = (
        label: string | null,
        value: string,
        items: string[],
        isOpen: boolean,
        setOpen: (open: boolean) => void,
        onSelect: (val: string) => void,
        fullWidth?: boolean
    ) => (
        <div
            className={`relative ${fullWidth ? "w-full" : "w-[100px]"} text-sm`}
        >
            {label && <Label className="mb-1 block">{label}</Label>}
            <button
                type="button"
                onClick={() => setOpen(!isOpen)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                className="w-full text-left px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border rounded-md flex justify-between items-center cursor-pointer"
            >
                {value || "Select"}
                <ChevronDown className="w-4 h-4 opacity-60" />
            </button>
            {isOpen && (
                <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-white dark:bg-gray-800 text-sm shadow-md">
                    {items.map((item) => (
                        <li
                            key={item}
                            onClick={() => {
                                onSelect(item);
                                setOpen(false);
                            }}
                            className="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            {item}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Status */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1">
                    <Label htmlFor="status">Status</Label>
                    <InfoTooltip text="Select project status." />
                </div>
                {renderDropdown(
                    null,
                    status,
                    ["In Progress", "Complete"],
                    statusOpen,
                    setStatusOpen,
                    (val) => setStatus(val as "In Progress" | "Complete"),
                    true
                )}
            </div>

            {/* Start Date */}
            <div>
                <div className="flex items-center gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <InfoTooltip text="When did you begin the project?" />
                </div>
                <div className="flex gap-2 mt-1">
                    {renderDropdown(
                        "Year",
                        startYear,
                        years,
                        startOpen.y,
                        (v) => setStartOpen({ ...startOpen, y: v }),
                        setStartYear
                    )}
                    {renderDropdown(
                        "Month",
                        startMonth,
                        months,
                        startOpen.m,
                        (v) => setStartOpen({ ...startOpen, m: v }),
                        setStartMonth
                    )}
                    {renderDropdown(
                        "Day",
                        startDay,
                        allDays,
                        startOpen.d,
                        (v) => setStartOpen({ ...startOpen, d: v }),
                        setStartDay
                    )}
                </div>
            </div>

            {/* End Date */}
            {status === "Complete" && (
                <div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <InfoTooltip text="When did you finish the project?" />
                    </div>
                    <div className="flex gap-2 mt-1">
                        {renderDropdown(
                            "Year",
                            endYear,
                            years,
                            endOpen.y,
                            (v) => setEndOpen({ ...endOpen, y: v }),
                            setEndYear
                        )}
                        {renderDropdown(
                            "Month",
                            endMonth,
                            months,
                            endOpen.m,
                            (v) => setEndOpen({ ...endOpen, m: v }),
                            setEndMonth
                        )}
                        {renderDropdown(
                            "Day",
                            endDay,
                            allDays,
                            endOpen.d,
                            (v) => setEndOpen({ ...endOpen, d: v }),
                            setEndDay
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Step5;
