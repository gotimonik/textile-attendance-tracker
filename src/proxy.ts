import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes anyone can reach without being signed in at all.
const PUBLIC_PAGE_PREFIXES = ["/login", "/signup", "/join"];
// /api/locale is deliberately public — it has to work before anyone is
// signed in (the login/signup/join pages need a language to render in), and
// it does its own auth check internally to decide whether to also persist
// the choice to a signed-in admin's or worker's profile.
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/organizations", "/api/public", "/api/locale"];

// Routes that belong to the worker portal — require a "worker" role session,
// distinct from the admin dashboard which requires an "admin" role session.
const WORKER_PREFIXES = ["/worker", "/api/worker"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Next.js 16 renamed the `middleware` file convention to `proxy`.
// This runs before every matched request to guard the authenticated app shell.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isApiRoute = pathname.startsWith("/api");
  const isAuthOnlyRoute = pathname.startsWith("/api/auth");

  if (isAuthOnlyRoute) {
    return NextResponse.next();
  }

  if (matchesPrefix(pathname, PUBLIC_PAGE_PREFIXES) || matchesPrefix(pathname, PUBLIC_API_PREFIXES)) {
    // A signed-in admin visiting /login or /signup should just land back on
    // their dashboard. Note: only an ADMIN-role token counts here — a token
    // issued before multi-org support (or a worker's token) is either
    // useless to the dashboard or belongs to a different area entirely, so
    // treating it as "already signed in" here would bounce the visitor into
    // a page that immediately bounces them back, looping forever.
    if (pathname === "/login" || pathname === "/signup") {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      if (token?.role === "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isWorkerArea = matchesPrefix(pathname, WORKER_PREFIXES);

  if (isWorkerArea) {
    if (token?.role === "worker") {
      return NextResponse.next();
    }
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // An admin poking at the worker portal gets sent home instead of to a
    // login screen that isn't theirs; anyone else goes to the admin login
    // (the closest thing to a front door — most workers arrive here via a
    // successful sign-in redirect, not by typing the URL cold).
    if (token?.role === "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Everything else is the admin dashboard/API surface.
  if (token?.role === "admin") {
    return NextResponse.next();
  }

  if (isApiRoute) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (token?.role === "worker") {
    return NextResponse.redirect(new URL("/worker", request.url));
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
