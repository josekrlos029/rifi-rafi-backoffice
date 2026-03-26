import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  extractAuthContextFromToken,
  isBackofficeRole,
  isTokenExpired,
} from "@/lib/auth-token";

const DEFAULT_AUTH_REDIRECT = "/gym-configs";
const ADMIN_ONLY_PATHS = ["/categories", "/difficulties"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loginUrl = new URL("/login", request.url);
  const token = request.cookies.get("rifi-auth-token")?.value;
  const authContext = extractAuthContextFromToken(token);

  // Allow login page and static assets
  if (
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    if (
      pathname === "/login" &&
      token &&
      !isTokenExpired(token) &&
      isBackofficeRole(authContext.role)
    ) {
      const nextUrl = new URL(DEFAULT_AUTH_REDIRECT, request.url);
      return NextResponse.redirect(nextUrl);
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  if (isTokenExpired(token)) {
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("rifi-auth-token");
    return response;
  }

  if (!isBackofficeRole(authContext.role)) {
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("rifi-auth-token");
    return response;
  }

  if (
    authContext.role === "COMPANY" &&
    ADMIN_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  ) {
    const redirectUrl = new URL(DEFAULT_AUTH_REDIRECT, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
