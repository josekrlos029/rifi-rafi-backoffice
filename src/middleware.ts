import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  extractAuthContextFromToken,
  type AuthRole,
  isBackofficeRole,
  isTokenExpired,
} from "@/lib/auth-token";

const DEFAULT_AUTH_REDIRECT = "/gym-configs";
const ADMIN_ONLY_PATHS = ["/categories", "/difficulties"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loginUrl = new URL("/login", request.url);
  const token = request.cookies.get("rifi-auth-token")?.value;
  const roleCookieValue = request.cookies.get("rifi-auth-role")?.value;
  const roleCookie: AuthRole =
    roleCookieValue === "ADMIN" || roleCookieValue === "COMPANY" ? roleCookieValue : "UNKNOWN";
  const authContext = extractAuthContextFromToken(token);
  const effectiveRole = authContext.role !== "UNKNOWN" ? authContext.role : roleCookie;

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
      isBackofficeRole(effectiveRole)
    ) {
      const nextUrl = new URL(DEFAULT_AUTH_REDIRECT, request.url);
      return NextResponse.redirect(nextUrl);
    }
    return NextResponse.next();
  }

  if (!token) {
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("rifi-auth-role");
    return response;
  }

  if (isTokenExpired(token)) {
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("rifi-auth-token");
    response.cookies.delete("rifi-auth-role");
    return response;
  }

  if (!isBackofficeRole(effectiveRole)) {
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("rifi-auth-token");
    response.cookies.delete("rifi-auth-role");
    return response;
  }

  if (
    effectiveRole === "COMPANY" &&
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
