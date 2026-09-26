import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Pages that need an account (these paths and everything under them).
const protectedRoutes = [
    "/settings",
    "/explore",
    "/library",
    "/social",
    "/inbox",
    "/portfolio",
    "/drive",
    "/productivity",
    "/moderation",
    "/admin",
];

export async function proxy(req: NextRequest) {
    const { nextUrl } = req;
    const sessionCookie = getSessionCookie(req);

    const res = NextResponse.next();

    const isLoggedIn = !!sessionCookie;
    const path = nextUrl.pathname;
    const isOnProtectedRoute = protectedRoutes.some(
        (route) => path === route || path.startsWith(`${route}/`)
    );
    // Password links from emails must work even when already signed in.
    // (Verify: after tapping the email link you're signed in, and the page
    // then sends you on to the app with a "verified" message.)
    const isPasswordLink = [
        "/auth/create-password",
        "/auth/reset-password",
        "/auth/verify",
    ].includes(nextUrl.pathname);
    const isOnAuthRoute =
        nextUrl.pathname.startsWith("/auth") && !isPasswordLink;

    // Logged-out visitors (and Google) opening the homepage see the landing
    // page right at "/" (no redirect), so Google can index inkference.app itself.
    if (path === "/" && !isLoggedIn) {
        return NextResponse.rewrite(new URL("/welcome", req.url));
    }

    if (isOnProtectedRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    if (isOnAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return res;
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};
