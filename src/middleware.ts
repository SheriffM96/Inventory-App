import { NextRequest, NextResponse } from "next/server";
import { ROLE_HOME, Role, SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Each route prefix lists which roles may access it. A prefix with no entry
// here is open to any authenticated role (e.g. /stock-take, which itself
// enforces STOREKEEPER/MANAGER via requireRole at the page level).
const PREFIX_ROLES: Record<string, Role[]> = {
  "/dashboard": ["MANAGER"],
  "/reports": ["MANAGER"],
  "/items": ["MANAGER"],
  "/users": ["MANAGER"],
  "/api/reports": ["MANAGER"],
  "/api/items": ["MANAGER"],
  "/log": ["STOREKEEPER", "KITCHEN", "BAR"],
  "/supervisor": ["SUPERVISOR"],
};
const PUBLIC_PATHS = ["/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith("/api/public")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const matchedPrefix = Object.keys(PREFIX_ROLES)
    .filter((p) => pathname.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];

  if (matchedPrefix && !PREFIX_ROLES[matchedPrefix].includes(session.role)) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon\\.|apple-icon\\.|.*\\.(?:jpg|jpeg|png|svg|gif|webp|ico)$).*)",
  ],
};
