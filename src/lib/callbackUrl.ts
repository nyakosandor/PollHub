/**
 * Accepts only same-site paths such as "/hu/polls/1", so a crafted
 * ?callbackUrl= can't send a user to another site after signing in.
 */
export function safeCallbackUrl(callbackUrl: string | undefined, fallback: string) {
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return fallback;
  }
  // Backslashes are treated like slashes by some browsers ("/\evil.com").
  if (callbackUrl.includes("\\")) return fallback;
  return callbackUrl;
}
