import Link from "next/link";
import { ChevronRight } from "lucide-react";

const CLASS =
    "flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-1 text-sm font-medium text-gray-600 hover:bg-gray-200 hover:text-black transition-colors cursor-pointer";

/** The one "See all" style used everywhere. Pass `href` for a link or `onClick` for a button. */
export default function SeeAll({ href, onClick, label = "See all" }: { href?: string; onClick?: () => void; label?: string }) {
    const content = (
        <>
            {label} <ChevronRight className="size-4" />
        </>
    );
    return href ? (
        <Link href={href} className={CLASS}>
            {content}
        </Link>
    ) : (
        <button type="button" onClick={onClick} className={CLASS}>
            {content}
        </button>
    );
}
