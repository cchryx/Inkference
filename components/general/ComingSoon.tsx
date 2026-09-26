import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Sparkles } from "lucide-react";

type Props = {
    icon: LucideIcon;
    title: string;
    text: string;
    /** What it will do, shown as a short list. */
    planned: string[];
    back?: { href: string; label: string };
};

/** Friendly placeholder for a page that isn't built yet. */
export default function ComingSoon({ icon: Icon, title, text, planned, back }: Props) {
    return (
        <div className="flex h-full w-full items-center justify-center p-6">
            <div className="w-full max-w-md text-center">
                <div className="relative mx-auto mb-6 grid size-20 place-items-center rounded-2xl bg-gray-100">
                    <Icon className="size-9 text-gray-700" />
                    <span className="absolute -right-2 -top-2 flex items-center gap-1 rounded-full bg-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        <Sparkles className="size-3" /> Soon
                    </span>
                </div>

                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="mt-2 text-sm text-gray-500">{text}</p>

                <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left">
                    {planned.map((p) => (
                        <li key={p} className="flex items-start gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gray-900" />
                            {p}
                        </li>
                    ))}
                </ul>

                {back && (
                    <Link
                        href={back.href}
                        className="mt-8 inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                        <ArrowLeft className="size-4" /> {back.label}
                    </Link>
                )}
            </div>
        </div>
    );
}
