"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/general/Loader";
import { Skeleton } from "@/components/general/Skeleton";

const ChangeLocationForm = () => {
    const [location, setLocation] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isPending, setIsPending] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // ← For skeleton

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false); // Simulate loading
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const fetchSuggestions = async (query: string) => {
        if (!query) return;

        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                query
            )}`
        );
        const data = await res.json();

        const names = data.map((place: any) => place.display_name);
        setSuggestions(names.slice(0, 5));
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocation(value);
        await fetchSuggestions(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);

        if (!location) {
            alert("Please enter a location.");
            setIsPending(false);
            return;
        }

        alert(`Selected location: ${location}`);
        setIsPending(false);
    };

    if (isLoading) {
        return (
            <div className="w-full space-y-4 border-2 border-gray-200 p-6 rounded-md">
                <Skeleton className="h-6 w-1/4 rounded-md" />
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <Skeleton className="h-10 w-[160px] rounded-md" />
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full space-y-4 border-2 border-gray-200 p-6 rounded-md"
        >
            <h1 className="text-lg">Change Location</h1>

            <div className="flex flex-col gap-2 relative">
                <Label htmlFor="location">Location</Label>
                <Input
                    id="location"
                    value={location}
                    onChange={handleChange}
                    disabled={isPending}
                    placeholder="Enter a city, country..."
                    className="bg-gray-100"
                />
                {suggestions.length > 0 && (
                    <ul className="absolute z-10 top-full mt-1 bg-white border border-gray-300 shadow-md rounded-md w-full max-h-48 overflow-auto text-sm">
                        {suggestions.map((suggestion, idx) => (
                            <li
                                key={idx}
                                onClick={() => {
                                    setLocation(suggestion);
                                    setSuggestions([]);
                                }}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Button type="submit" disabled={isPending}>
                {isPending && <Loader size={5} color="text-white" />}
                Change Location
            </Button>
        </form>
    );
};

export default ChangeLocationForm;
