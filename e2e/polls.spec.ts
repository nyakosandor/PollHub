import { Page, Route } from "@playwright/test";
import { db } from "./db";
import { expect, test, translatorFor, Translate } from "./fixtures";
import { DEMO_USERS } from "../prisma/seed-data";

const DAY_MS = 24 * 60 * 60 * 1000;

// Seed data is user content, so it is not translated.
const OPEN_POLL = {
  id: "poll-1",
  title: "Next quarter priorities",
  question: "Which feature should we prioritize next quarter?",
};
const CLOSED_POLL = {
  id: "poll-2",
  title: "Onboarding feedback",
  question: "How satisfied are you with our onboarding experience?",
};

const pollLink = (page: Page, title: string) =>
  page.getByRole("main").getByRole("link").filter({ hasText: title });

// The detail page shows a single status badge inside <main>.
const statusBadge = (page: Page) =>
  page.getByRole("main").getByTestId("status-badge").first();

async function expectStatus(page: Page, t: Translate, status: "open" | "closed") {
  const badge = statusBadge(page);
  await expect(badge).toHaveAttribute("data-status", status);
  await expect(badge).toHaveText(t(`status.${status}`));
}

type Kpi = "total-votes" | "leading-option" | "time-remaining";
const kpiCard = (page: Page, kpi: Kpi) => page.getByTestId(`kpi-${kpi}`);

const insightsSummary = (page: Page) => page.getByTestId("ai-insights-summary");

/**
 * Intercepts Server Action calls (POSTs with a Next-Action header). On a poll
 * page without user input, the only one is the AI insights request.
 */
const interceptServerActions = (page: Page, handle: (route: Route) => Promise<void>) =>
  page.route("**/*", async (route) => {
    const request = route.request();
    if (request.method() === "POST" && (await request.headerValue("next-action"))) {
      await handle(route);
    } else {
      await route.fallback();
    }
  });

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Moves the open poll's closing time in the database and reloads the page. */
async function closeOpenPollIn(page: Page, delayMs: number) {
  await db.poll.update({
    where: { id: OPEN_POLL.id },
    data: { closesAt: new Date(Date.now() + delayMs) },
  });
  await page.reload();
}

const newestPoll = () =>
  db.poll.findFirstOrThrow({
    orderBy: { createdAt: "desc" },
    include: { questions: { include: { options: { orderBy: { position: "asc" } } } } },
  });

async function openManagerDashboard(
  page: Page,
  t: Translate,
  localePath: (path: string) => string
) {
  await page.goto(localePath("/"));
  await page.getByTestId("nav-manager-dashboard").click();
  await expect(page).toHaveURL(localePath("/manager"));
  await expect(
    page.getByRole("heading", { name: t("manager.title") })
  ).toBeVisible();
}

const formField = (page: Page, t: Translate, field: "title" | "question" | "closingTime") =>
  page.getByLabel(t(`form.${field}`), { exact: true });

const optionInput = (page: Page, t: Translate, number: number) =>
  page.getByPlaceholder(t("form.optionPlaceholder", { number }));

async function fillPollForm(
  page: Page,
  t: Translate,
  { title, question }: { title: string; question: string }
) {
  await formField(page, t, "title").fill(title);
  await formField(page, t, "question").fill(question);
  await optionInput(page, t, 1).fill("Yes");
  await optionInput(page, t, 2).fill("No");
}

const submitPollForm = (page: Page) =>
  page.getByTestId("create-poll-submit").click();

async function expectFormError(
  page: Page,
  t: Translate,
  error:
    | "titleRequired"
    | "questionRequired"
    | "optionsRequired"
    | "closingTimeRequired"
    | "closingTimeInPast"
) {
  const message = page.getByTestId("form-error");
  await expect(message).toHaveAttribute("data-error", error);
  await expect(message).toHaveText(t(`form.errors.${error}`));
}

test.describe("dashboard", () => {
  test("lists polls by title with a status derived from closesAt", async ({
    page,
    t,
    localePath,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto(localePath("/"));
    await expect(page.getByRole("heading", { name: t("dashboard.title") })).toBeVisible();
    await expect(page.getByText(t("dashboard.subtitle.PARTICIPANT"))).toBeVisible();

    const openPoll = pollLink(page, OPEN_POLL.title);
    await expect(openPoll.getByTestId("status-badge")).toHaveText(t("status.open"));
    await expect(openPoll).toContainText(t("pollList.stats", { votes: 0, options: 4 }));

    const closedPoll = pollLink(page, CLOSED_POLL.title);
    await expect(closedPoll.getByTestId("status-badge")).toHaveText(t("status.closed"));
    await expect(closedPoll).toContainText(t("pollList.stats", { votes: 4, options: 4 }));

    // Polls render on the server too, so this also catches hydration mismatches.
    expect(errors).toEqual([]);
  });

  test("shows an empty state when there are no polls", async ({ page, t, localePath }) => {
    await db.poll.deleteMany();
    await page.goto(localePath("/"));
    const empty = page.getByTestId("poll-list-empty");
    await expect(empty).toContainText(t("pollList.empty"));
    await expect(empty).toContainText(t("pollList.emptyHint"));
  });
});

test.describe("participant", () => {
  test("votes once and the vote is stored for the signed-in user", async ({
    page,
    t,
    localePath,
  }) => {
    await page.goto(localePath(`/polls/${OPEN_POLL.id}`));

    await expect(
      page.getByRole("heading", { name: OPEN_POLL.title })
    ).toBeVisible();
    await expect(page.getByText(OPEN_POLL.question)).toHaveCount(2);

    const submit = page.getByTestId("submit-vote");
    await expect(submit).toHaveText(t("vote.submit"));
    await expect(submit).toBeDisabled();
    await page.getByRole("radio", { name: "Mobile app" }).check();
    await submit.click();

    const confirmation = page.getByTestId("vote-confirmation");
    await expect(confirmation).toContainText(t("vote.thanks"));
    await expect(kpiCard(page, "total-votes")).toContainText("1");
    await expect(kpiCard(page, "leading-option")).toContainText("Mobile app");

    // A new vote requests a new summary, for the new totals.
    await expect(insightsSummary(page)).toContainText(
      t("insights.lead", {
        count: 1,
        strength: "strong",
        leader: t("insights.quoted", { text: "Mobile app" }),
        share: 100,
      })
    );

    const participant = await db.user.findUniqueOrThrow({
      where: { email: DEMO_USERS.participant.email },
    });
    const votes = await db.vote.findMany({ where: { pollId: OPEN_POLL.id } });
    expect(votes).toHaveLength(1);
    expect(votes[0]).toMatchObject({
      userId: participant.id,
      questionId: "poll-1-q-1",
      optionId: "poll-1-opt-2",
    });

    await page.reload();
    await expect(confirmation).toHaveText(t("vote.alreadyVoted"));
    await expect(page.getByRole("radio")).toHaveCount(0);
    await expect(kpiCard(page, "total-votes")).toContainText("1");

    // The dashboard marks the poll as voted.
    await page.goto(localePath("/"));
    await expect(pollLink(page, OPEN_POLL.title)).toContainText(t("pollList.voted"));
  });

  test("the server rejects a second vote from a stale page", async ({
    page,
    t,
    localePath,
  }) => {
    // Two tabs of the same signed-in user, both showing the vote form.
    const otherTab = await page.context().newPage();
    await page.goto(localePath(`/polls/${OPEN_POLL.id}`));
    await otherTab.goto(localePath(`/polls/${OPEN_POLL.id}`));

    await page.getByRole("radio", { name: "Dark mode" }).check();
    await page.getByTestId("submit-vote").click();
    await expect(page.getByTestId("vote-confirmation")).toBeVisible();

    await otherTab.getByRole("radio", { name: "Mobile app" }).check();
    await otherTab.getByTestId("submit-vote").click();
    // The rejection refreshes the page, which then shows the earlier vote.
    await expect(otherTab.getByTestId("vote-confirmation")).toHaveText(
      t("vote.alreadyVoted")
    );

    const votes = await db.vote.findMany({ where: { pollId: OPEN_POLL.id } });
    expect(votes.map(({ optionId }) => optionId)).toEqual(["poll-1-opt-1"]);
  });

  test("the server rejects a vote once the poll has closed", async ({
    page,
    t,
    localePath,
  }) => {
    await page.goto(localePath(`/polls/${OPEN_POLL.id}`));
    await page.getByRole("radio", { name: "Dark mode" }).check();

    // Closed in the database while the form is still open in the browser.
    await db.poll.update({
      where: { id: OPEN_POLL.id },
      data: { closesAt: new Date(Date.now() - 1000) },
    });
    await page.getByTestId("submit-vote").click();

    const error = page.getByTestId("vote-error");
    await expect(error).toHaveAttribute("data-error", "pollClosed");
    await expect(error).toHaveText(t("vote.errors.pollClosed"));
    expect(await db.vote.count({ where: { pollId: OPEN_POLL.id } })).toBe(0);
  });

  test("cannot vote on a closed poll but sees its results", async ({
    page,
    t,
    localePath,
  }) => {
    await page.goto(localePath(`/polls/${CLOSED_POLL.id}`));

    await expectStatus(page, t, "closed");
    await expect(page.getByTestId("vote-closed")).toHaveText(t("vote.closed"));
    await expect(page.getByRole("radio")).toHaveCount(0);
    await expect(page.getByText(CLOSED_POLL.question)).toBeVisible();
    await expect(kpiCard(page, "total-votes")).toContainText("4");
  });

  test("is redirected away from the manager dashboard", async ({
    page,
    localePath,
  }) => {
    await page.goto(localePath("/manager"));
    await expect(page).toHaveURL(localePath("/"));
    await expect(page.getByTestId("nav-manager-dashboard")).toHaveCount(0);
  });

  test("gets a 404 for an unknown poll", async ({ page, t, localePath }) => {
    await page.goto(localePath("/polls/does-not-exist"));
    const notFound = page.getByTestId("not-found");
    await expect(notFound).toBeVisible();
    await expect(notFound).toContainText(t("notFound.title"));
  });
});

test.describe("manager", () => {
  test.use({ account: "manager" });

  test("creates a poll and its question as separate records", async ({
    page,
    t,
    localePath,
  }) => {
    await openManagerDashboard(page, t, localePath);
    await fillPollForm(page, t, { title: "Team lunch", question: "Pizza today?" });
    await submitPollForm(page);

    await expect(page.getByTestId("form-success")).toHaveText(t("form.success"));
    await expect(formField(page, t, "title")).toHaveValue("");
    // The list below the form is refreshed from the database.
    await expect(pollLink(page, "Team lunch")).toBeVisible();

    const poll = await newestPoll();
    expect(poll.title).toBe("Team lunch");
    expect(poll.questions).toHaveLength(1);
    expect(poll.questions[0]).toMatchObject({ pollId: poll.id, text: "Pizza today?" });
    expect(poll.questions[0].options.map(({ text }) => text)).toEqual(["Yes", "No"]);

    await pollLink(page, "Team lunch").click();
    await expect(page).toHaveURL(localePath(`/polls/${poll.id}`));
    await expect(
      page.getByRole("heading", { name: "Team lunch" })
    ).toBeVisible();
    await expect(page.getByText("Pizza today?")).toBeVisible();
    // Managers run polls; they don't vote on them.
    await expect(page.getByTestId("submit-vote")).toHaveCount(0);
  });

  test("closing time defaults to seven days from now", async ({
    page,
    t,
    localePath,
  }) => {
    await openManagerDashboard(page, t, localePath);
    await fillPollForm(page, t, { title: "Default", question: "Default close?" });

    const before = Date.now();
    await submitPollForm(page);
    await expect(page.getByTestId("form-success")).toBeVisible();

    const closesAt = (await newestPoll()).closesAt.getTime();
    // The input has minute precision, so the value can be up to a minute early.
    expect(closesAt).toBeGreaterThan(before + 7 * DAY_MS - 2 * 60 * 1000);
    expect(closesAt).toBeLessThanOrEqual(Date.now() + 7 * DAY_MS);

    await pollLink(page, "Default").click();
    await expect(kpiCard(page, "time-remaining")).toContainText(
      t("kpi.closesIn", { unit: "day", count: 7 })
    );
  });

  test("can set a custom closing time", async ({ page, t, localePath }) => {
    await openManagerDashboard(page, t, localePath);
    await fillPollForm(page, t, { title: "Custom", question: "Custom close?" });
    await formField(page, t, "closingTime").fill("2031-03-15T14:30");
    await submitPollForm(page);
    await expect(page.getByTestId("form-success")).toBeVisible();

    const expected = await page.evaluate(() =>
      new Date("2031-03-15T14:30").getTime()
    );
    expect((await newestPoll()).closesAt.getTime()).toBe(expected);
  });

  test("validates the form", async ({ page, t, localePath }) => {
    await openManagerDashboard(page, t, localePath);
    const pollCount = await db.poll.count();

    await submitPollForm(page);
    await expectFormError(page, t, "titleRequired");

    await formField(page, t, "title").fill("Validation");
    await submitPollForm(page);
    await expectFormError(page, t, "questionRequired");

    await formField(page, t, "question").fill("Valid?");
    await submitPollForm(page);
    await expectFormError(page, t, "optionsRequired");

    await optionInput(page, t, 1).fill("Yes");
    await optionInput(page, t, 2).fill("No");
    await formField(page, t, "closingTime").fill("2020-01-01T00:00");
    await submitPollForm(page);
    await expectFormError(page, t, "closingTimeInPast");

    await formField(page, t, "closingTime").fill("");
    await submitPollForm(page);
    await expectFormError(page, t, "closingTimeRequired");

    expect(await db.poll.count()).toBe(pollCount);
  });

  test("closing a poll sets closesAt to now and blocks voting", async ({
    page,
    t,
    localePath,
    loginAs,
  }) => {
    await openManagerDashboard(page, t, localePath);
    await pollLink(page, OPEN_POLL.title).click();
    await expectStatus(page, t, "open");

    const before = Date.now();
    const closeButton = page.getByTestId("close-poll");
    await expect(closeButton).toHaveText(t("poll.closePoll"));
    await closeButton.click();

    await expect(closeButton).toHaveText(t("poll.pollClosed"));
    await expect(closeButton).toBeDisabled();
    await expectStatus(page, t, "closed");

    const { closesAt } = await db.poll.findUniqueOrThrow({ where: { id: OPEN_POLL.id } });
    expect(closesAt.getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(closesAt.getTime()).toBeLessThanOrEqual(Date.now());

    await loginAs("participant");
    await page.reload();
    await expectStatus(page, t, "closed");
    await expect(page.getByTestId("vote-closed")).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(0);
  });

  test("sees the manager hint when there are no polls", async ({ page, t, localePath }) => {
    await db.poll.deleteMany();
    await page.goto(localePath("/"));
    await expect(page.getByTestId("poll-list-empty")).toContainText(
      t("pollList.emptyManagerHint")
    );
  });
});

test.describe("results view", () => {
  test("KPI cards summarize a closed poll", async ({ page, t, localePath }) => {
    await page.goto(localePath(`/polls/${CLOSED_POLL.id}`));

    const totalVotes = kpiCard(page, "total-votes");
    await expect(totalVotes).toContainText(t("kpi.totalVotes"));
    await expect(totalVotes).toContainText("4");
    await expect(totalVotes).toContainText(t("kpi.acrossOptions", { count: 4 }));

    const leading = kpiCard(page, "leading-option");
    await expect(leading).toContainText("Very satisfied");
    await expect(leading).toContainText(t("kpi.shareOfVotes", { share: 50 }));

    await expect(kpiCard(page, "time-remaining")).toContainText(t("kpi.closed"));
  });

  test("KPI cards handle a poll without votes", async ({ page, t, localePath }) => {
    await page.goto(localePath(`/polls/${OPEN_POLL.id}`));

    await expect(kpiCard(page, "total-votes")).toContainText("0");
    await expect(kpiCard(page, "leading-option")).toContainText(t("kpi.noVotesYet"));
    // Counts are formatted per locale, with digit grouping such as "1,155".
    const manyDays = t("kpi.closesIn", { unit: "day", count: 999 });
    await expect(kpiCard(page, "time-remaining")).toContainText(
      new RegExp(escapeRegExp(manyDays).replace("999", "\\d[\\d\\s,.]*"))
    );
    await expect(page.getByText(t("results.noVotes"))).toBeVisible();
    await expect(page.locator(".recharts-surface")).toHaveCount(0);
    await expect(insightsSummary(page)).toHaveText(t("insights.empty"));
  });

  test("time remaining counts down in the largest fitting unit", async ({
    page,
    t,
    localePath,
  }) => {
    await page.goto(localePath(`/polls/${OPEN_POLL.id}`));
    const timeRemaining = kpiCard(page, "time-remaining");

    await closeOpenPollIn(page, 3 * 60 * 60 * 1000);
    await expect(timeRemaining).toContainText(
      t("kpi.closesIn", { unit: "hour", count: 3 })
    );

    await closeOpenPollIn(page, 10 * 60 * 1000);
    await expect(timeRemaining).toContainText(
      t("kpi.closesIn", { unit: "minute", count: 10 })
    );
  });

  test("a tie names every leading option", async ({
    page,
    t,
    localePath,
    formatList,
  }) => {
    // One vote each from two seeded voters.
    await db.vote.createMany({
      data: [1, 2].map((number) => ({
        userId: `seed-voter${number}`,
        pollId: OPEN_POLL.id,
        questionId: "poll-1-q-1",
        optionId: `poll-1-opt-${number}`,
      })),
    });
    await page.goto(localePath(`/polls/${OPEN_POLL.id}`));

    const leading = kpiCard(page, "leading-option");
    await expect(leading).toContainText(formatList(["Dark mode", "Mobile app"]));
    await expect(leading).toContainText(t("kpi.tied", { share: 50 }));

    const quote = (text: string) => t("insights.quoted", { text });
    await expect(insightsSummary(page)).toHaveText(
      `${t("insights.tie", {
        count: 2,
        leaders: formatList([quote("Dark mode"), quote("Mobile app")]),
        share: 50,
      })} ${t("insights.lowSample")}`
    );
  });

  test("chart ranks options, shows percentages and highlights the leader", async ({
    page,
    t,
    localePath,
  }) => {
    await page.goto(localePath(`/polls/${CLOSED_POLL.id}`));

    const chart = page.locator(".recharts-wrapper");
    for (const text of ["Very satisfied", "Satisfied", "Neutral", "Unsatisfied"]) {
      await expect(chart.getByText(text, { exact: true })).toBeVisible();
    }
    await expect(chart.getByText("50%")).toBeVisible();
    await expect(chart.getByText("25%")).toHaveCount(2);

    const bars = chart.locator(".recharts-bar-rectangle path");
    await expect(bars.first()).toHaveAttribute("fill", "#2a78d6");
    await expect(bars.nth(1)).toHaveAttribute("fill", "#c3c2b7");

    // Bar lengths match the shares: 50% is twice as long as 25%.
    const leaderBox = await bars.first().boundingBox();
    const runnerUpBox = await bars.nth(1).boundingBox();
    expect(leaderBox!.width).toBeGreaterThan(0);
    expect(leaderBox!.width).toBeCloseTo(runnerUpBox!.width * 2, 0);

    await chart.getByText("Very satisfied", { exact: true }).hover();
    await expect(page.locator(".recharts-tooltip-wrapper")).toContainText(
      t("results.votes", { count: 2 })
    );
  });

  test("results are also available as a table", async ({ page, t, localePath }) => {
    await page.goto(localePath(`/polls/${CLOSED_POLL.id}`));
    await expect(page.getByRole("table")).toBeHidden();

    const toggle = page.getByTestId("results-table-toggle");
    await expect(toggle).toHaveText(t("results.viewTable"));
    await toggle.click();

    const rows = page.getByRole("table").getByRole("row");
    await expect(rows).toHaveCount(5);
    await expect(rows.nth(0)).toHaveText(
      new RegExp(`${t("results.table.option")}\\s*${t("results.table.votes")}`)
    );
    await expect(rows.nth(1)).toHaveText(/Very satisfied\s*2\s*50%/);
    await expect(rows.nth(4)).toHaveText(/Unsatisfied\s*0\s*0%/);
  });

  test("AI insights show a loading state until the server answers", async ({
    page,
    t,
    localePath,
  }) => {
    // Hold the insights Server Action request until the loading state is checked.
    let release!: () => void;
    const released = new Promise<void>((resolve) => (release = resolve));
    await interceptServerActions(page, async (route) => {
      await released;
      await route.continue();
    });
    await page.goto(localePath(`/polls/${CLOSED_POLL.id}`));

    const loading = page.getByTestId("ai-insights-loading");
    await expect(loading).toHaveText(t("insights.loading"));
    await expect(insightsSummary(page)).toHaveCount(0);

    release();
    await expect(loading).toBeHidden();
    // In mock mode the server answers with the rule-based summary.
    await expect(insightsSummary(page)).toHaveText(
      [
        t("insights.lead", {
          count: 4,
          strength: "clear",
          leader: t("insights.quoted", { text: "Very satisfied" }),
          share: 50,
        }),
        t("insights.runnerUp", {
          runnerUp: t("insights.quoted", { text: "Satisfied" }),
          share: 25,
          margin: 25,
        }),
        t("insights.lowSample"),
      ].join(" ")
    );
  });

  test("AI insights report a failure and can be retried", async ({
    page,
    t,
    localePath,
  }) => {
    // The first request fails as if the API were down; the retry goes through.
    let failures = 0;
    await interceptServerActions(page, async (route) => {
      if (failures++ === 0) await route.fulfill({ status: 500, body: "Gemini unavailable" });
      else await route.continue();
    });
    await page.goto(localePath(`/polls/${CLOSED_POLL.id}`));

    const error = page.getByTestId("ai-insights-error");
    await expect(error).toContainText(t("insights.error"));
    await expect(insightsSummary(page)).toHaveCount(0);

    await page.getByTestId("ai-insights-retry").click();
    await expect(error).toBeHidden();
    await expect(insightsSummary(page)).toContainText(t("insights.quoted", { text: "Very satisfied" }));
  });
  test("fits a mobile screen without sideways scrolling", async ({
    page,
    localePath,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(localePath(`/polls/${CLOSED_POLL.id}`));

    const chart = page.locator(".recharts-surface").first();
    await expect(chart).toBeVisible();
    const chartBox = await chart.boundingBox();
    expect(chartBox!.x + chartBox!.width).toBeLessThanOrEqual(375);

    const totalBox = await kpiCard(page, "total-votes").boundingBox();
    const leadingBox = await kpiCard(page, "leading-option").boundingBox();
    expect(leadingBox!.y).toBeGreaterThan(totalBox!.y);

    const hasSidewaysScroll = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    );
    expect(hasSidewaysScroll).toBe(false);

    // The chart also re-fits when the screen changes, e.g. on rotation.
    const leaderBar = page.locator(".recharts-bar-rectangle path").first();
    await expect.poll(async () => (await leaderBar.boundingBox())?.width).toBeGreaterThan(0);
    const mobileBarWidth = (await leaderBar.boundingBox())!.width;
    await page.setViewportSize({ width: 1000, height: 667 });
    await expect
      .poll(async () => (await leaderBar.boundingBox())?.width ?? 0)
      .toBeGreaterThan(mobileBarWidth);
  });
});

test("an open poll closes by itself when its closing time passes", async ({
  page,
  t,
  localePath,
}) => {
  await page.goto(localePath(`/polls/${OPEN_POLL.id}`));
  await expectStatus(page, t, "open");

  await closeOpenPollIn(page, 10_000);

  await expectStatus(page, t, "open");
  await expect(page.getByRole("radio", { name: "Dark mode" })).toBeVisible();

  // No interaction or reload from here on: the view has to update on its own.
  await expect(statusBadge(page)).toHaveAttribute("data-status", "closed", {
    timeout: 15_000,
  });
  await expect(page.getByTestId("vote-closed")).toHaveText(t("vote.closed"));
  await expect(page.getByRole("radio")).toHaveCount(0);
});

test.describe("internationalization", () => {
  test("redirects the root URL to the browser's language", async ({
    page,
    localePath,
    appLocale,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(localePath("/"));
    await expect(page.locator("html")).toHaveAttribute("lang", appLocale);
  });

  test.describe("with an unsupported browser language", () => {
    test.use({ locale: "de-DE" });

    test("falls back to Hungarian", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL("/hu");
      await expect(
        page.getByRole("heading", { name: translatorFor("hu")("dashboard.title") })
      ).toBeVisible();
    });
  });

  test("the language switcher keeps the page and remembers the choice", async ({
    page,
    appLocale,
    localePath,
  }) => {
    const other = appLocale === "hu" ? "en" : "hu";
    const tOther = translatorFor(other);

    await page.goto(localePath(`/polls/${CLOSED_POLL.id}`));
    const switcher = page.getByTestId("language-switcher");
    await expect(switcher.getByTestId(`locale-switch-${appLocale}`)).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    await switcher.getByTestId(`locale-switch-${other}`).click();

    await expect(page).toHaveURL(`/${other}/polls/${CLOSED_POLL.id}`);
    await expect(page.locator("html")).toHaveAttribute("lang", other);
    await expect(page.getByTestId("vote-closed")).toHaveText(tOther("vote.closed"));
    await expect(switcher.getByTestId(`locale-switch-${other}`)).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    // The choice wins over the browser language on the next visit.
    await page.goto("/");
    await expect(page).toHaveURL(`/${other}`);
  });

  test("unknown paths show the localized 404 page", async ({ page, t, localePath }) => {
    await page.goto(localePath("/does/not/exist"));
    await expect(page.getByTestId("not-found")).toContainText(t("notFound.title"));
  });
});

test.describe("theme", () => {
  const html = (page: Page) => page.locator("html");
  const bodyIsDark = (page: Page) =>
    page.evaluate(() => {
      // Body background lightness: dark theme uses slate-950, light uses slate-50.
      const probe = document.createElement("canvas").getContext("2d")!;
      probe.fillStyle = getComputedStyle(document.body).backgroundColor;
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
      return (r + g + b) / 3 < 128;
    });

  for (const os of ["light", "dark"] as const) {
    test(`follows a ${os} system theme by default`, async ({ page, t, localePath }) => {
      await page.emulateMedia({ colorScheme: os });
      await page.goto(localePath("/"));

      await expect(page.getByTestId("theme-system")).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("theme-system")).toHaveAccessibleName(t("nav.themes.system"));
      await expect(html(page)).not.toHaveAttribute("data-theme");
      expect(await bodyIsDark(page)).toBe(os === "dark");
    });
  }

  test("a chosen theme overrides the system and survives a reload", async ({
    page,
    localePath,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(localePath(`/polls/${CLOSED_POLL.id}`));

    await page.getByTestId("theme-light").click();
    await expect(html(page)).toHaveAttribute("data-theme", "light");
    await expect(page.getByTestId("theme-light")).toHaveAttribute("aria-pressed", "true");
    expect(await bodyIsDark(page)).toBe(false);

    await page.reload();
    await expect(html(page)).toHaveAttribute("data-theme", "light");
    expect(await bodyIsDark(page)).toBe(false);

    await page.emulateMedia({ colorScheme: "light" });
    await page.getByTestId("theme-dark").click();
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    expect(await bodyIsDark(page)).toBe(true);

    // The 404 page keeps the choice too.
    await page.goto(localePath("/does/not/exist"));
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    expect(await bodyIsDark(page)).toBe(true);

    await page.getByTestId("theme-system").click();
    await expect(html(page)).not.toHaveAttribute("data-theme");
    expect(await bodyIsDark(page)).toBe(false);
  });

  test("switching language keeps the theme without console errors", async ({
    page,
    appLocale,
    localePath,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(localePath(`/polls/${CLOSED_POLL.id}`));
    await page.getByTestId("theme-dark").click();

    // A new locale re-renders the root layout, and with it <html>, on the client.
    const other = appLocale === "hu" ? "en" : "hu";
    await page.getByTestId(`locale-switch-${other}`).click();
    await expect(page).toHaveURL(`/${other}/polls/${CLOSED_POLL.id}`);
    await expect(html(page)).toHaveAttribute("lang", other);
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    expect(await bodyIsDark(page)).toBe(true);
    expect(errors).toEqual([]);
  });

  test("a saved theme is applied before the page is painted", async ({
    page,
    localePath,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(() => {
      window.localStorage.setItem("pollhub_theme", "dark");
      document.addEventListener("readystatechange", () => {
        if (document.readyState === "interactive") {
          (window as unknown as { themeAtParse: string | null }).themeAtParse =
            document.documentElement.getAttribute("data-theme");
        }
      });
    });
    await page.goto(localePath("/"));
    expect(
      await page.evaluate(
        () => (window as unknown as { themeAtParse: string | null }).themeAtParse
      )
    ).toBe("dark");
  });
});
