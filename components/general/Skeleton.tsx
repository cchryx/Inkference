import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "relative overflow-hidden bg-gray-400 dark:bg-gray-600",
                className
            )}
        >
            <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(0,0,0,0.2),transparent)]" />
        </div>
    );
}
