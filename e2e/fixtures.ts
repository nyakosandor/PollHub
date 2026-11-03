import { Page, test as base } from "@playwright/test";
import { createTranslator } from "next-intl";
import en from "../messages/en.json";
import hu from "../messages/hu.json";
import { DEMO_USERS, DemoUser } from "../prisma/seed-data";
import { resetDb } from "./db";

export type AppLocale = "hu" | "en";

export const LOCALES: AppLocale[] = ["hu", "en"];

const MESSAGES = { hu, en };

/** Translates with the app's own catalogs, so assertions follow the copy. */
export const translatorFor = (locale: AppLocale) =>
  createTranslator({ locale, messages: MESSAGES[locale] });

export type Translate = ReturnType<typeof translatorFor>;

/**
 * Signs in through NextAuth's credentials endpoint, the same request the
 * login form makes. The session cookie lands in the page's browser context.
 */
export async function signInAs(page: Page, user: DemoUser | { email: string; password: string }) {
  const { email, password } = typeof user === "string" ? DEMO_USERS[user] : user;
  const csrf = await page.request.get("/api/auth/csrf");
  const { csrfToken } = await csrf.json();
  const response = await page.request.post("/api/auth/callback/credentials", {
    form: { csrfToken, email, password, json: "true" },
  });
  if (!response.ok()) throw new Error(`Sign-in failed with ${response.status()}`);
  const cookies = await page.context().cookies();
  if (!cookies.some(({ name }) => name.includes("next-auth.session-token"))) {
    throw new Error(`Sign-in as ${email} did not create a session`);
  }
}

export interface TestOptions {
  /** The locale segment the tests browse under, e.g. "hu" for /hu/... */
  appLocale: AppLocale;
  /** Who is signed in when a test starts; null for a visitor. */
  account: DemoUser | null;
}

interface Fixtures {
  t: Translate;
  /** Prefixes an app path with the active locale: "/polls/x" → "/hu/polls/x". */
  localePath: (path: string) => string;
  /** Joins items like the app does, e.g. "A and B" or "A és B". */
  formatList: (items: string[]) => string;
  /** Switches the signed-in user mid-test. */
  loginAs: (user: DemoUser) => Promise<void>;
}

// Fixture setup functions name their callback `provide`, not `use`, so the
// React hooks lint rule does not mistake it for React.use.
export const test = base.extend<TestOptions & Fixtures>({
  appLocale: ["hu", { option: true }],
  account: ["participant", { option: true }],
  // Every test starts from the seed, signed in as `account`.
  page: async ({ page, account }, provide) => {
    await resetDb();
    if (account) await signInAs(page, account);
    await provide(page);
  },
  loginAs: async ({ page }, provide) => {
    await provide(async (user) => {
      await page.context().clearCookies();
      await signInAs(page, user);
    });
  },
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
