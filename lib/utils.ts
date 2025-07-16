import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getValidDomains() {
    const domains = [
        "gmail.com",
        "yahoo.com",
        "outlook.com",
        "hotmail.com",
        "icloud.com",
        "protonmail.com",
        "zoho.com",
        "mail.utoronto.ca",
    ];
    return domains;
}

export function normalizeName(name: string) {
    return name
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[^a-zA-Z\s'-]/g, "")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}
