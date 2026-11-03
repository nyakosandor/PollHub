import { test as base } from "@playwright/test";
import { createTranslator } from "next-intl";
import en from "../messages/en.json";
import hu from "../messages/hu.json";

export type AppLocale = "hu" | "en";

export const LOCALES: AppLocale[] = ["hu", "en"];

const MESSAGES = { hu, en };

/** Translates with the app's own catalogs, so assertions follow the copy. */
export const translatorFor = (locale: AppLocale) =>
  createTranslator({ locale, messages: MESSAGES[locale] });

export type Translate = ReturnType<typeof translatorFor>;

export interface TestOptions {
  /** The locale segment the tests browse under, e.g. "hu" for /hu/... */
  appLocale: AppLocale;
}

interface LocaleFixtures {
  t: Translate;
  /** Prefixes an app path with the active locale: "/polls/x" → "/hu/polls/x". */
  localePath: (path: string) => string;
  /** Joins items like the app does, e.g. "A and B" or "A és B". */
  formatList: (items: string[]) => string;
}

// Fixture setup functions name their callback `provide`, not `use`, so the
// React hooks lint rule does not mistake it for React.use.
export const test = base.extend<TestOptions & LocaleFixtures>({
  appLocale: ["hu", { option: true }],
  t: async ({ appLocale }, provide) => {
    await provide(translatorFor(appLocale));
  },
  localePath: async ({ appLocale }, provide) => {
    await provide((path) => `/${appLocale}${path === "/" ? "" : path}`);
  },
  formatList: async ({ appLocale }, provide) => {
    const listFormat = new Intl.ListFormat(appLocale, { type: "conjunction" });
    await provide((items) => listFormat.format(items));
  },
});

export { expect } from "@playwright/test";
