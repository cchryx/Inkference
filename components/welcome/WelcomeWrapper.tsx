"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    ArrowRight,
    BellRing,
    BriefcaseBusiness,
    AlarmClock,
    Coffee,
    Compass,
    Flag,
    Flame,
    Images,
    KanbanSquare,
    ShieldCheck,
    StickyNote,
    Tv,
} from "lucide-react";

/*
 * Welcome / landing page.
 * Look: black & white "hard-surface" futuristic UI. Angular cut corners,
 * thin panel lines, a faint blueprint grid and monospace system labels.
 */

type Stats = { users: number; projects: number; posts: number };

type Props = {
    stats: Stats;
    signedInAs: string | null;
};

// Panel with two cut corners (top-left and bottom-right).
const CUT = "[clip-path:polygon(18px_0,100%_0,100%_calc(100%-18px),calc(100%-18px)_100%,0_100%,0_18px)]";
const CUT_SM = "[clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]";

const FEATURES = [
    {
        code: "01",
        icon: BriefcaseBusiness,
        title: "Your portfolio, in one place",
        text: "Projects, experience, education, skills, awards and your resume on one profile. Choose which tabs show and in what order.",
    },
    {
        code: "02",
        icon: Images,
        title: "Posts & galleries",
        text: "Share photo posts, crop them to the perfect shape, and swipe through full-screen galleries on your phone.",
    },
    {
        code: "03",
        icon: Compass,
        title: "A feed made for you",
        text: "For You, Following and Friends feeds that skip what you've already seen, with comments and likes.",
    },
    {
        code: "04",
        icon: Flame,
        title: "Explore & trending",
        text: "Search people, projects, posts and #tags, and see what's hot today or this week.",
    },
    {
        code: "05",
        icon: KanbanSquare,
        title: "Planners on real dates",
        text: "Boards with board, week and month views. Drag cards between days, add times, and never miss what's overdue.",
    },
    {
        code: "06",
        icon: AlarmClock,
        title: "Reminders & weekly recap",
        text: "Set a reminder on any card or to-do and get a push when it's due, plus a Sunday summary of your week ahead.",
        isNew: true,
    },
    {
        code: "07",
        icon: Tv,
        title: "Watch trackers",
        text: "Keep every show on the right episode. One tap opens the next episode and counts it, and completed ones tidy away.",
        isNew: true,
    },
    {
        code: "08",
        icon: StickyNote,
        title: "Drive, notes & to-dos",
        text: "Notes that save as you type, to-do lists with Today and Upcoming, all private to you.",
    },
    {
        code: "09",
        icon: Coffee,
        title: "Buy me a coffee",
        text: "Let people support your work with a coffee. You see exactly where every dollar goes before you turn it on.",
        isNew: true,
    },
    {
        code: "10",
        icon: ShieldCheck,
        title: "Privacy you control",
        text: "Choose who sees each post, project and gallery, hide things from certain people, and block anyone, anytime.",
    },
    {
        code: "11",
        icon: Flag,
        title: "A safe community",
        text: "Report anything that crosses the line. Real people review reports, and you can appeal if something of yours is flagged.",
        isNew: true,
    },
    {
        code: "12",
        icon: BellRing,
        title: "Works like an app",
        text: "Add Inkference to your home screen and get push notifications for likes, comments, friends and reminders.",
    },
];

const STEPS = [
    { title: "Create your account", text: "Sign up with email, Google or GitHub, then pick a username." },
    { title: "Build your profile", text: "Add projects, experience, skills, photos and your resume in a few minutes." },
    { title: "Share, plan & connect", text: "Post your work, plan your week with reminders, and find builders who make things like you." },
];

// Counts up from 0 when the number scrolls into view.
function CountUp({ value }: { value: number }) {
    const [shown, setShown] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let frame = 0;

        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            const start = performance.now();
            const duration = 1200;
            const tick = (now: number) => {
                const t = Math.min(1, (now - start) / duration);
                const eased = 1 - Math.pow(1 - t, 3);
                setShown(Math.round(value * eased));
                if (t < 1) frame = requestAnimationFrame(tick);
            };
            frame = requestAnimationFrame(tick);
        });

        observer.observe(el);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }, [value]);

    return <span ref={ref}>{shown.toLocaleString()}</span>;
}

// Small monospace "system" label, e.g. [ SYS // 01 ]
function Label({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase ${
                dark ? "text-white/60" : "text-neutral-500"
            }`}
        >
            <span className={`h-1.5 w-1.5 ${dark ? "bg-white" : "bg-neutral-900"}`} />
            {children}
        </span>
    );
}

// Decorative corner brackets around a box.
function Brackets({ dark = false }: { dark?: boolean }) {
    const c = dark ? "border-white/70" : "border-neutral-900";
    return (
        <>
            <span className={`pointer-events-none absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 ${c}`} />
            <span className={`pointer-events-none absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 ${c}`} />
            <span className={`pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 ${c}`} />
            <span className={`pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 ${c}`} />
        </>
    );
}

const WelcomeWrapper = ({ stats, signedInAs }: Props) => {
    const primaryHref = signedInAs ? "/" : "/auth/signup";
    const primaryLabel = signedInAs ? "Open Inkference" : "Get started free";

    const STAT_ITEMS = [
        { label: "Builders", value: stats.users },
        { label: "Projects", value: stats.projects },
        { label: "Posts", value: stats.posts },
    ];

    return (
        <div
            className="h-dvh w-full overflow-y-auto bg-[#f3f3f1] text-neutral-900 selection:bg-neutral-900 selection:text-white"
            style={{
                // Faint blueprint grid
                backgroundImage:
                    "linear-gradient(rgba(0,0,0,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.045) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
            }}
        >
            {/* ---------- Top bar ---------- */}
            <header className="sticky top-0 z-30 border-b border-neutral-900/15 bg-[#f3f3f1]/85 backdrop-blur">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <Link href="/" className="flex items-center gap-2">
                        {/* App icon (white pen nib) inside the cut-corner plate */}
                        <span className="grid h-5 w-5 place-items-center bg-neutral-900 [clip-path:polygon(5px_0,100%_0,100%_calc(100%-5px),calc(100%-5px)_100%,0_100%,0_5px)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/assets/brand/logo-mark-white.png"
                                alt=""
                                width={14}
                                height={14}
                                className="h-3.5 w-3.5 select-none"
                                draggable={false}
                            />
                        </span>
                        <span className="font-mono text-sm font-bold tracking-[0.3em]">INKFERENCE</span>
                    </Link>

                    <nav className="flex items-center gap-2">
                        {!signedInAs && (
                            <Link
                                href="/auth/signin"
                                className="px-3 py-1.5 text-sm font-medium hover:underline underline-offset-4"
                            >
                                Sign in
                            </Link>
                        )}
                        <Link
                            href={primaryHref}
                            className={`bg-neutral-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-neutral-700 ${CUT_SM}`}
                        >
                            {signedInAs ? "Open app" : "Sign up"}
                        </Link>
                    </nav>
                </div>
            </header>

            <main>
                {/* ---------- Hero ---------- */}
                <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:pb-24">
                    {/* Decorative angled panel lines */}
                    <svg
                        aria-hidden
                        className="pointer-events-none absolute right-0 top-6 hidden h-[420px] w-[420px] text-neutral-900 lg:block"
                        viewBox="0 0 400 400"
                        fill="none"
                    >
                        <path d="M40 360 L200 40 L360 360" stroke="currentColor" strokeOpacity="0.12" strokeWidth="2" />
                        <path d="M90 360 L200 140 L310 360" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
                        <path d="M200 140 L200 360" stroke="currentColor" strokeOpacity="0.12" strokeWidth="2" strokeDasharray="6 8" />
                        <path d="M0 250 H120 L150 220 H250 L280 250 H400" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
                        <circle cx="200" cy="220" r="46" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
                        <circle cx="200" cy="220" r="6" fill="currentColor" />
                        <path d="M200 160 V185 M200 255 V280 M140 220 H165 M235 220 H260" stroke="currentColor" strokeWidth="2" />
                    </svg>

                    <div className="relative max-w-2xl space-y-6">
                        <Label>System online // v4</Label>

                        <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
                            Build your portfolio.
                            <br />
                            Plan your work.
                            <br />
                            <span className="relative inline-block">
                                Find your people.
                                <span className="absolute -bottom-1 left-0 h-2 w-full bg-neutral-900/15" />
                            </span>
                        </h1>

                        <p className="max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
                            Inkference is where builders show their work and get it done. Put your
                            projects, skills and resume on one profile, share posts, plan your week with
                            reminders, track what you&apos;re watching, and connect with people who make
                            things too.
                        </p>

                        {signedInAs && (
                            <p className="font-mono text-sm text-neutral-500">
                                &gt; Welcome back, {signedInAs}.
                            </p>
                        )}

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={primaryHref}
                                className={`group inline-flex items-center gap-2 bg-neutral-900 px-6 py-3 font-semibold text-white transition hover:bg-neutral-700 ${CUT}`}
                            >
                                {primaryLabel}
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                            {!signedInAs && (
                                <Link
                                    href="/auth/signin"
                                    className={`inline-flex items-center border-2 border-neutral-900 bg-white px-6 py-3 font-semibold transition hover:bg-neutral-100 ${CUT}`}
                                >
                                    I have an account
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* ---------- Live stats ---------- */}
                    <div className="relative mt-12 grid grid-cols-3 gap-2 sm:mt-16 sm:gap-4">
                        {STAT_ITEMS.map((s, i) => (
                            <div
                                key={s.label}
                                className={`relative bg-neutral-900 p-4 text-white sm:p-6 ${CUT}`}
                            >
                                <Label dark>{`U-0${i + 1}`}</Label>
                                <p className="mt-2 font-mono text-2xl font-bold sm:text-5xl">
                                    <CountUp value={s.value} />
                                </p>
                                <p className="mt-1 text-xs uppercase tracking-widest text-white/60 sm:text-sm">
                                    {s.label}
                                </p>
                                {/* thin progress-style line */}
                                <span className="absolute bottom-3 right-4 hidden h-0.5 w-16 bg-white/30 sm:block" />
                            </div>
                        ))}
                    </div>
                    <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                        Live counts · updated every few minutes
                    </p>
                </section>

                {/* Hazard stripe divider */}
                <div
                    aria-hidden
                    className="h-3 w-full"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(135deg, #171717 0 12px, transparent 12px 24px)",
                        opacity: 0.85,
                    }}
                />

                {/* ---------- Features ---------- */}
                <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
                    <Label>Modules</Label>
                    <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">What you can do</h2>
                    <p className="mt-2 max-w-xl text-neutral-600">
                        Show your work, plan it, track it, and grow. Twelve modules, one app.
                    </p>

                    <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                        {FEATURES.map(({ code, icon: Icon, title, text, isNew }) => (
                            <div
                                key={code}
                                className={`group relative border border-neutral-900/20 bg-white p-6 transition hover:-translate-y-0.5 hover:border-neutral-900 ${CUT}`}
                            >
                                <div className="flex items-start justify-between">
                                    <span className={`grid h-11 w-11 place-items-center bg-neutral-900 text-white ${CUT_SM}`}>
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <span className="flex items-center gap-2 font-mono text-xs text-neutral-400">
                                        {isNew && (
                                            <span className={`bg-neutral-900 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-white ${CUT_SM}`}>
                                                NEW
                                            </span>
                                        )}
                                        MOD-{code}
                                    </span>
                                </div>
                                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{text}</p>
                                <span className="absolute bottom-0 left-6 h-0.5 w-0 bg-neutral-900 transition-all duration-300 group-hover:w-16" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* ---------- How it works ---------- */}
                <section className="bg-neutral-900 text-white">
                    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
                        <Label dark>Launch sequence</Label>
                        <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                            Up and running in 3 steps
                        </h2>

                        <ol className="mt-10 grid gap-4 md:grid-cols-3">
                            {STEPS.map((step, i) => (
                                <li key={step.title} className="relative border border-white/20 p-6">
                                    <Brackets dark />
                                    <span className="font-mono text-5xl font-black text-white/15">
                                        0{i + 1}
                                    </span>
                                    <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
                                    <p className="mt-1 text-sm text-white/70">{step.text}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* ---------- Final call to action ---------- */}
                <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
                    <div className="relative border-2 border-neutral-900 bg-white p-8 text-center sm:p-12">
                        <Brackets />
                        <Label>Ready</Label>
                        <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">
                            Join {stats.users.toLocaleString()} builders on Inkference
                        </h2>
                        <p className="mx-auto mt-3 max-w-lg text-neutral-600">
                            It&apos;s free. Set up your profile, share your first project, and plan what&apos;s next.
                        </p>
                        <Link
                            href={primaryHref}
                            className={`group mt-8 inline-flex items-center gap-2 bg-neutral-900 px-8 py-3.5 font-semibold text-white transition hover:bg-neutral-700 ${CUT}`}
                        >
                            {primaryLabel}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="border-t border-neutral-900/15">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 font-mono text-xs uppercase tracking-[0.2em] text-neutral-500 sm:flex-row sm:px-6">
                    <span>© {new Date().getFullYear()} Inkference</span>
                    <span>End of transmission</span>
                </div>
            </footer>
        </div>
    );
};

export default WelcomeWrapper;
