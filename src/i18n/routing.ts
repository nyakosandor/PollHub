import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["hu", "en"],
  defaultLocale: "hu",
  // Every route carries its locale, e.g. /hu/polls/poll-1 or /en/manager.
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
