import bcrypt from "bcryptjs";
import { Page } from "@playwright/test";
import { db } from "./db";
import { expect, test, Translate } from "./fixtures";
import { DEMO_USERS } from "../prisma/seed-data";

// These tests start signed out.
test.use({ account: null });

const field = (page: Page, t: Translate, key: "email" | "password" | "confirmPassword") =>
  page.getByLabel(t(`auth.${key}`), { exact: true });

async function fillLogin(page: Page, t: Translate, email: string, password: string) {
  await field(page, t, "email").fill(email);
  await field(page, t, "password").fill(password);
  await page.getByTestId("login-submit").click();
}

type AuthError = keyof (typeof import("../messages/en.json"))["auth"]["errors"];

async function expectAuthError(page: Page, t: Translate, error: AuthError) {
  const message = page.getByTestId("auth-error");
  await expect(message).toHaveAttribute("data-error", error);
  await expect(message).toHaveText(t(`auth.errors.${error}`));
}

test("protected pages redirect visitors to the login page and back", async ({
  page,
  t,
  localePath,
}) => {
  await page.goto(localePath("/polls/poll-1"));
  await expect(page).toHaveURL(
    `${localePath("/login")}?callbackUrl=${encodeURIComponent(localePath("/polls/poll-1"))}`
  );
  await expect(page.getByRole("heading", { name: t("auth.loginTitle") })).toBeVisible();
  await expect(page.getByTestId("user-menu")).toHaveCount(0);

  await fillLogin(page, t, DEMO_USERS.participant.email, DEMO_USERS.participant.password);
  await expect(page).toHaveURL(localePath("/polls/poll-1"));
  await expect(page.getByTestId("user-email")).toHaveText(DEMO_USERS.participant.email);
  await expect(page.getByTestId("user-role")).toHaveText(t("nav.roles.PARTICIPANT"));
});

test("every app page requires a session", async ({ page, localePath }) => {
  for (const path of ["/", "/manager", "/polls/poll-2"]) {
    await page.goto(localePath(path));
    await expect(page).toHaveURL(new RegExp(`${localePath("/login")}\\?callbackUrl=`));
  }
});

test("a wrong password is rejected", async ({ page, t, localePath }) => {
  await page.goto(localePath("/login"));
  await fillLogin(page, t, DEMO_USERS.manager.email, "wrong-password");
  await expectAuthError(page, t, "invalidCredentials");
  await expect(page).toHaveURL(localePath("/login"));

  // Unknown accounts get the same message, so emails can't be probed.
  await fillLogin(page, t, "nobody@pollhub.local", "whatever123");
  await expectAuthError(page, t, "invalidCredentials");
});

test("a manager signs in, sees the badge and the dashboard link, then logs out", async ({
  page,
  t,
  localePath,
}) => {
  await page.goto(localePath("/login"));
  await fillLogin(page, t, DEMO_USERS.manager.email, DEMO_USERS.manager.password);

  await expect(page).toHaveURL(localePath("/"));
  await expect(page.getByTestId("user-role")).toHaveAttribute("data-role", "MANAGER");
  await expect(page.getByTestId("user-role")).toHaveText(t("nav.roles.MANAGER"));
  await expect(page.getByTestId("nav-manager-dashboard")).toBeVisible();

  await page.getByTestId("logout").click();
  await expect(page).toHaveURL(localePath("/login"));
  await expect(page.getByTestId("user-menu")).toHaveCount(0);

  await page.goto(localePath("/manager"));
  await expect(page).toHaveURL(new RegExp(`${localePath("/login")}\\?callbackUrl=`));
});

test.describe("registration", () => {
  const NEW_USER = { email: "New.User@Example.com", password: "s3cret-pass" };

  async function register(
    page: Page,
    t: Translate,
    { email, password, confirm = password, role }: {
      email: string;
      password: string;
      confirm?: string;
      role?: "MANAGER" | "PARTICIPANT";
    }
  ) {
    await field(page, t, "email").fill(email);
    await field(page, t, "password").fill(password);
    await field(page, t, "confirmPassword").fill(confirm);
    if (role) {
      await page.locator("label").filter({ has: page.getByTestId(`register-role-${role}`) }).click();
    }
    await page.getByTestId("register-submit").click();
  }

  test("creates a manager account with a hashed password and signs it in", async ({
    page,
    t,
    localePath,
  }) => {
    await page.goto(localePath("/login"));
    await page.getByTestId("go-register").click();
    await expect(page).toHaveURL(localePath("/register"));
    await expect(page.getByRole("heading", { name: t("auth.registerTitle") })).toBeVisible();

    await register(page, t, { ...NEW_USER, role: "MANAGER" });

    await expect(page).toHaveURL(localePath("/"));
    // Emails are stored lowercase, so sign-in ignores letter case.
    const email = NEW_USER.email.toLowerCase();
    await expect(page.getByTestId("user-email")).toHaveText(email);
    await expect(page.getByTestId("user-role")).toHaveAttribute("data-role", "MANAGER");

    const user = await db.user.findUniqueOrThrow({ where: { email } });
    expect(user.role).toBe("MANAGER");
    expect(user.password).not.toBe(NEW_USER.password);
    expect(await bcrypt.compare(NEW_USER.password, user.password)).toBe(true);

    // The new account can create polls right away.
    await page.getByTestId("nav-manager-dashboard").click();
    await expect(page).toHaveURL(localePath("/manager"));
  });

  test("new accounts are participants by default", async ({ page, t, localePath }) => {
    await page.goto(localePath("/register"));
    await register(page, t, NEW_USER);
    await expect(page.getByTestId("user-role")).toHaveAttribute("data-role", "PARTICIPANT");
    await expect(page.getByTestId("nav-manager-dashboard")).toHaveCount(0);
  });

  test("validates the input and rejects a taken email", async ({ page, t, localePath }) => {
    await page.goto(localePath("/register"));
    const userCount = await db.user.count();

    await register(page, t, { email: "not-an-email", password: NEW_USER.password });
    await expectAuthError(page, t, "emailInvalid");

    await register(page, t, { email: NEW_USER.email, password: "short" });
    await expectAuthError(page, t, "passwordTooShort");

    await register(page, t, { ...NEW_USER, confirm: "something-else" });
    await expectAuthError(page, t, "passwordMismatch");

    await register(page, t, {
      email: DEMO_USERS.participant.email.toUpperCase(),
      password: NEW_USER.password,
    });
    await expectAuthError(page, t, "emailTaken");

    expect(await db.user.count()).toBe(userCount);
  });
});

test("signed-in users skip the login and registration pages", async ({ page, localePath, loginAs }) => {
  await loginAs("participant");
  await page.goto(localePath("/login"));
  await expect(page).toHaveURL(localePath("/"));
  await page.goto(localePath("/register"));
  await expect(page).toHaveURL(localePath("/"));
});

test("a callback URL to another site is ignored", async ({ page, t, localePath }) => {
  await page.goto(`${localePath("/login")}?callbackUrl=${encodeURIComponent("//evil.example")}`);
  await fillLogin(page, t, DEMO_USERS.participant.email, DEMO_USERS.participant.password);
  await expect(page).toHaveURL(localePath("/"));
});
