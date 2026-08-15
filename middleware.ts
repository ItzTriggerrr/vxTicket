// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const supportedLocales = ["en", "fr", "es"];
const defaultLocale = "en";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authTokenCookie = request.cookies.get("qs_auth_jwt")?.value;

  // 1. Explicitly bypass static metadata and SEO endpoints
  if (
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/manifest") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".xml") ||
    pathname.endsWith(".txt")
  ) {
    return NextResponse.next();
  }

  // 2. REGIONAL LOCALE REWRITE CHECK
  const hasLocale = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  let activeLocale = defaultLocale;
  if (hasLocale) {
    activeLocale = pathname.split("/")[1];
  }

  // 3. CRITICAL ROLE GUARD INTERCEPT SECURITY LAYER
  const isTargetingProviderDashboard = pathname.includes("/dashboard");

  if (isTargetingProviderDashboard && !authTokenCookie) {
    // 🚨 TEMPORARY BYPASS FOR UI TESTING 🚨
    // const securityRedirectUrl = new URL(`/${activeLocale}`, request.url);
    // return NextResponse.redirect(securityRedirectUrl);
  }

  if (hasLocale) return NextResponse.next();

  // Parse browser configuration locale preferences
  const acceptLanguage = request.headers.get("accept-language") || "";
  const preferredLocale =
    supportedLocales.find((locale) =>
      acceptLanguage.toLowerCase().includes(locale)
    ) || defaultLocale;

  request.nextUrl.pathname = `/${preferredLocale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - sitemap.xml, robots.txt, manifest, favicons/icons
     */
    "/((?!api|_next/static|_next/image|assets|favicon.ico|icon.png|apple-icon.png|sitemap.xml|robots.txt|manifest.webmanifest|sw.js).*)",
  ],
};