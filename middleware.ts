// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const supportedLocales = ["en", "fr", "es"];
const defaultLocale = "en";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authTokenCookie = request.cookies.get("qs_auth_jwt")?.value;

  // 1. REGIONAL LOCALE REWRITE CHECK
  const hasLocale = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  let activeLocale = defaultLocale;
  if (hasLocale) {
    activeLocale = pathname.split("/")[1];
  }

  // 2. CRITICAL ROLE GUARD INTERCEPT SECURITY LAYER
  // Detects if the unauthenticated user is trying to access protected provider subfolders
  const isTargetingProviderDashboard = pathname.includes("/dashboard");

  if (isTargetingProviderDashboard && !authTokenCookie) {
    // 🚨 TEMPORARY BYPASS FOR UI TESTING 🚨
    // We commented out the redirect so you can view your new form without logging in.
    // REMEMBER TO UNCOMMENT THIS LATER!
    
    // const securityRedirectUrl = new URL(`/${activeLocale}`, request.url);
    // return NextResponse.redirect(securityRedirectUrl);
  }

  if (hasLocale) return NextResponse.next();

  // Parse browser configuration locale preferences
  const acceptLanguage = request.headers.get("accept-language") || "";
  const preferredLocale = supportedLocales.find((locale) => 
    acceptLanguage.toLowerCase().includes(locale)
  ) || defaultLocale;

  request.nextUrl.pathname = `/${preferredLocale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)",
  ],
};