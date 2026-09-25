import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Offline",
};

export default function Page() {
    return (
        <main className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
            <h1 className="text-2xl font-semibold">You&apos;re offline</h1>
            <p className="text-muted-foreground">
                Check your internet connection and try again.
            </p>
        </main>
    );
}
