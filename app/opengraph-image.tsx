import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// The preview picture shown when someone shares an Inkference link
// (Discord, iMessage, X, LinkedIn...). Same black & white "hard-surface"
// look as the welcome page, with live counts.

export const alt = "Inkference: build your portfolio, plan your work, find your people";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

const getStats = unstable_cache(
    async () => {
        const [users, projects, posts] = await Promise.all([
            prisma.user.count({ where: { username: { not: null } } }),
            prisma.project.count(),
            prisma.post.count({ where: { type: "post" } }),
        ]);
        return { users, projects, posts };
    },
    ["og-stats"],
    { revalidate: 3600 }
);

export default async function Image() {
    const [stats, logo] = await Promise.all([
        getStats().catch(() => ({ users: 0, projects: 0, posts: 0 })),
        readFile(join(process.cwd(), "public/assets/brand/logo-mark-white.png")).then(
            (b) => `data:image/png;base64,${b.toString("base64")}`,
            () => null
        ),
    ]);

    const tiles = [
        { code: "U-01", label: "BUILDERS", value: stats.users },
        { code: "U-02", label: "PROJECTS", value: stats.projects },
        { code: "U-03", label: "POSTS", value: stats.posts },
    ];

    const bracket = (pos: Record<string, number>, sides: string[]) => (
        <div
            style={{
                position: "absolute",
                width: 22,
                height: 22,
                ...pos,
                ...Object.fromEntries(sides.map((s) => [`border${s}`, "3px solid rgba(255,255,255,0.8)"])),
            }}
        />
    );

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "56px 64px",
                    backgroundColor: "#0b0b0b",
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                    color: "white",
                    fontFamily: "sans-serif",
                    position: "relative",
                }}
            >
                {/* Decorative rings, like the welcome page drawing */}
                <div
                    style={{
                        position: "absolute",
                        right: 70,
                        top: 90,
                        width: 300,
                        height: 300,
                        borderRadius: 9999,
                        border: "2px solid rgba(255,255,255,0.18)",
                        display: "flex",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        right: 150,
                        top: 170,
                        width: 140,
                        height: 140,
                        borderRadius: 9999,
                        border: "2px solid rgba(255,255,255,0.35)",
                        display: "flex",
                    }}
                />
                <div style={{ position: "absolute", right: 214, top: 234, width: 12, height: 12, borderRadius: 9999, background: "white", display: "flex" }} />
                <div style={{ position: "absolute", right: 0, top: 239, width: 480, height: 2, background: "rgba(255,255,255,0.22)", display: "flex" }} />

                {/* Top: logo + label */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div
                            style={{
                                width: 52,
                                height: 52,
                                border: "3px solid white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {logo && (
                                <img src={logo} width={32} height={32} alt="" />
                            )}
                        </div>
                        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 12 }}>INKFERENCE</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, letterSpacing: 5, color: "rgba(255,255,255,0.6)" }}>
                        <div style={{ width: 10, height: 10, background: "white", display: "flex" }} />
                        SYSTEM ONLINE
                    </div>
                </div>

                {/* Headline */}
                <div style={{ display: "flex", flexDirection: "column", fontSize: 76, fontWeight: 900, lineHeight: 1.02, letterSpacing: -2 }}>
                    <div style={{ display: "flex" }}>Build your portfolio.</div>
                    <div style={{ display: "flex" }}>Plan your work.</div>
                    <div style={{ display: "flex", color: "rgba(255,255,255,0.55)" }}>Find your people.</div>
                </div>

                {/* Live stats + hazard stripe */}
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 18 }}>
                        {tiles.map((t) => (
                            <div
                                key={t.code}
                                style={{
                                    position: "relative",
                                    display: "flex",
                                    flexDirection: "column",
                                    width: 200,
                                    padding: "18px 22px",
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.18)",
                                }}
                            >
                                {bracket({ left: -1, top: -1 }, ["Left", "Top"])}
                                {bracket({ right: -1, bottom: -1 }, ["Right", "Bottom"])}
                                <div style={{ fontSize: 14, letterSpacing: 4, color: "rgba(255,255,255,0.5)" }}>{t.code}</div>
                                <div style={{ fontSize: 48, fontWeight: 800, marginTop: 4 }}>{t.value.toLocaleString()}</div>
                                <div style={{ fontSize: 15, letterSpacing: 4, color: "rgba(255,255,255,0.6)" }}>{t.label}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
                        <div
                            style={{
                                width: 220,
                                height: 16,
                                display: "flex",
                                backgroundImage: "repeating-linear-gradient(135deg, #ffffff 0 12px, transparent 12px 24px)",
                                opacity: 0.8,
                            }}
                        />
                        <div style={{ fontSize: 22, letterSpacing: 4, color: "rgba(255,255,255,0.75)" }}>inkference.app</div>
                    </div>
                </div>
            </div>
        ),
        size
    );
}
