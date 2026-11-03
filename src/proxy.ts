import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import createMiddleware from "next-intl/middleware";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

// Detects the visitor's locale (cookie, then Accept-Language, then the default
// "hu") and redirects unprefixed URLs such as / to /hu or /en.
const handleI18nRouting = createMiddleware(routing);

/** Pages anyone may open; everything else requires a signed-in user. */
const PUBLIC_PATHS = ["/login", "/register"];

/**
 * Optimistic auth check: only reads the session cookie, never the database,
 * because the proxy runs on every request (including prefetches). The pages
 * and Server Actions verify the user again through the Data Access Layer.
 */
export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const [, firstSegment, ...rest] = pathname.split("/");

  // Unprefixed paths are first redirected to their localized version, and
  // checked on that request.
  if (hasLocale(routing.locales, firstSegment)) {
    const appPath = `/${rest.join("/")}`;
    const isPublic = PUBLIC_PATHS.some(
      (path) => appPath === path || appPath.startsWith(`${path}/`)
    );
    if (!isPublic) {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      if (!token) {
        const loginUrl = new URL(`/${firstSegment}/login`, request.url);
        loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  // Skip API routes, Next.js internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
