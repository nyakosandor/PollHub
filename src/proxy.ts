import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// Detects the visitor's locale (cookie, then Accept-Language, then the default
// "hu") and redirects unprefixed URLs such as / to /hu or /en.
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next.js internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\..*).*)",
};
