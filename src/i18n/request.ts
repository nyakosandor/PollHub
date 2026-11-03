import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import type en from "../../messages/en.json";
import { Locale, routing } from "./routing";

type Messages = typeof en;

// Typing every loader as returning the English shape makes the compiler flag
// keys that are missing from another locale's catalog.
const messageLoaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  hu: () => import("../../messages/hu.json"),
  en: () => import("../../messages/en.json"),
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await messageLoaders[locale]()).default,
  };
});
