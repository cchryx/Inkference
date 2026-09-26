import Link from "next/link";
import { BriefcaseBusiness, KanbanSquare, Users } from "lucide-react";

/*
 * The dark panel next to the sign in / sign up forms. Same look as the
 * welcome page: black "hard-surface" UI, cut corners, blueprint grid.
 */

const CUT = "[clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]";
const GRID = {
    backgroundImage:
        "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
    backgroundSize: "32px 32px",
};

const POINTS = [
    { icon: BriefcaseBusiness, title: "Show your work", text: "Projects, skills and posts on one profile." },
    { icon: KanbanSquare, title: "Plan it on real dates", text: "Boards, week and month views, to-dos." },
    { icon: Users, title: "Find your people", text: "Follow builders and see what's trending." },
];

export function Logo({ dark = false }: { dark?: boolean }) {
    return (
        <Link href="/" className="flex items-center gap-2">
            <span
                className={`grid h-6 w-6 place-items-center ${dark ? "bg-white" : "bg-neutral-900"} [clip-path:polygon(6px_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%,0_6px)]`}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/assets/brand/logo-mark-white.png"
                    alt=""
                    width={16}
                    height={16}
                    className={`h-4 w-4 select-none ${dark ? "invert" : ""}`}
                    draggable={false}
                />
            </span>
            <span className="font-mono text-sm font-bold tracking-[0.3em]">INKFERENCE</span>
        </Link>
    );
}

export default function AuthSidePanel() {
    return (
        <aside className="relative hidden h-full w-[42%] max-w-[640px] flex-col justify-between overflow-hidden bg-neutral-900 p-10 text-white md:flex" style={GRID}>
            {/* Decorative panel lines (same as the welcome page) */}
            <svg
                aria-hidden
                className="pointer-events-none absolute -right-16 top-1/2 h-[520px] w-[520px] -translate-y-1/2 text-white"
                viewBox="0 0 400 400"
                fill="none"
            >
                <path d="M40 360 L200 40 L360 360" stroke="currentColor" strokeOpacity="0.1" strokeWidth="2" />
                <path d="M90 360 L200 140 L310 360" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" />
                <path d="M200 140 L200 360" stroke="currentColor" strokeOpacity="0.1" strokeWidth="2" strokeDasharray="6 8" />
                <path d="M0 250 H120 L150 220 H250 L280 250 H400" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2" />
                <circle cx="200" cy="220" r="46" stroke="currentColor" strokeOpacity="0.28" strokeWidth="2" />
                <circle cx="200" cy="220" r="6" fill="currentColor" />
                <path d="M200 160 V185 M200 255 V280 M140 220 H165 M235 220 H260" stroke="currentColor" strokeOpacity="0.8" strokeWidth="2" />
            </svg>

            <div className="relative">
                <Logo dark />
            </div>

            <div className="relative max-w-sm space-y-8">
                <div className="space-y-4">
                    <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
                        <span className="h-1.5 w-1.5 bg-white" /> Access terminal
                    </span>
                    <h2 className="text-4xl font-black leading-[1.05] tracking-tight lg:text-5xl">
                        Build.
                        <br />
                        Plan.
                        <br />
                        Share.
                    </h2>
                </div>

                <ul className="space-y-3">
                    {POINTS.map(({ icon: Icon, title, text }) => (
                        <li key={title} className={`flex items-start gap-3 border border-white/15 bg-white/[0.03] p-4 ${CUT}`}>
                            <span className="grid h-9 w-9 shrink-0 place-items-center bg-white text-neutral-900 [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]">
                                <Icon className="h-4 w-4" />
                            </span>
                            <span>
                                <span className="block font-semibold">{title}</span>
                                <span className="block text-sm text-white/60">{text}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="relative space-y-3">
                <div
                    aria-hidden
                    className="h-2 w-40"
                    style={{ backgroundImage: "repeating-linear-gradient(135deg, #fff 0 8px, transparent 8px 16px)", opacity: 0.5 }}
                />
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Secure link · encrypted session</p>
            </div>
        </aside>
    );
}
