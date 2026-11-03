import { Page } from "@playwright/test";
import { expect, test, translatorFor, Translate } from "./fixtures";

const STATE_KEY = "pollhub_state_v2";
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

interface StoredState {
  polls: Record<string, unknown>[];
  questions: Record<string, unknown>[];
  votes: Record<string, unknown>[];
}

const readState = (page: Page) =>
  page.evaluate(
    (key) => JSON.parse(window.localStorage.getItem(key) ?? "null"),
    STATE_KEY
  ) as Promise<StoredState>;

const pollLink = (page: Page, title: string) =>
  page.getByRole("link").filter({ hasText: title });

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

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Stores a change to the saved state and reloads the page to pick it up. */
async function updateStoredState(
  page: Page,
  change: (state: StoredState) => void
) {
  // The app writes its state only once it has hydrated.
  await page.waitForFunction(
    (key) => window.localStorage.getItem(key) !== null,
    STATE_KEY
  );
  const state = await readState(page);
  change(state);
  await page.evaluate(
    ([key, value]) => window.localStorage.setItem(key, value),
    [STATE_KEY, JSON.stringify(state)]
  );
  await page.reload();
}

const closeOpenPollIn = (page: Page, delayMs: number) =>
  updateStoredState(page, (state) => {
    state.polls[0].closesAt = Date.now() + delayMs;
  });

async function openManagerDashboard(
  page: Page,
  t: Translate,
  localePath: (path: string) => string
) {
  await page.goto(localePath("/"));
  await page.getByTestId("role-Manager").click();
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

    const openPoll = pollLink(page, OPEN_POLL.title);
    await expect(openPoll.getByTestId("status-badge")).toHaveText(t("status.open"));
    await expect(openPoll).toContainText(t("pollList.stats", { votes: 0, options: 4 }));

    const closedPoll = pollLink(page, CLOSED_POLL.title);
    await expect(closedPoll.getByTestId("status-badge")).toHaveText(t("status.closed"));
    await expect(closedPoll).toContainText(t("pollList.stats", { votes: 4, options: 4 }));

    // Polls render on the server too, so this also catches hydration mismatches.
    expect(errors).toEqual([]);
  });

  test("ignores state saved in the old v1 format", async ({ page, localePath }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "pollhub_state_v1",
        JSON.stringify({
          polls: [{ id: "old", question: "Old?", options: [], status: "open" }],
          votes: [],
        })
      );
    });
    await page.goto(localePath("/"));

    await expect(pollLink(page, OPEN_POLL.title)).toBeVisible();
    await expect(page.getByText("Old?")).toHaveCount(0);
  });
});

test.describe("participant", () => {
  test("votes once and the vote survives a reload", async ({
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

    // A new vote runs the simulated analysis again, on the new totals.
    await expect(page.getByTestId("ai-insights-loading")).toHaveText(
      t("insights.loading")
    );
    await expect(insightsSummary(page)).toContainText(
      t("insights.lead", {
        count: 1,
        strength: "strong",
        leader: t("insights.quoted", { text: "Mobile app" }),
        share: 100,
      })
    );

    const { votes } = await readState(page);
    expect(votes.at(-1)).toMatchObject({
      pollId: OPEN_POLL.id,
      questionId: "poll-1-q-1",
      optionId: "poll-1-opt-2",
      userId: "participant-1",
    });

    await page.reload();
    await expect(confirmation).toHaveText(t("vote.alreadyVoted"));
    await expect(page.getByRole("radio")).toHaveCount(0);
    await expect(kpiCard(page, "total-votes")).toContainText("1");
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
  });

  test("gets a 404 for an unknown poll", async ({ page, t, localePath }) => {
    await page.goto(localePath("/polls/does-not-exist"));
    const notFound = page.getByTestId("not-found");
    await expect(notFound).toBeVisible();
    await expect(notFound).toContainText(t("notFound.title"));
  });
});

test.describe("manager", () => {
  test("creates a poll and its question as separate entities", async ({
    page,
    t,
    localePath,
  }) => {
    await openManagerDashboard(page, t, localePath);
    await fillPollForm(page, t, { title: "Team lunch", question: "Pizza today?" });
    await submitPollForm(page);

    await expect(page.getByTestId("form-success")).toHaveText(t("form.success"));
    await expect(formField(page, t, "title")).toHaveValue("");

    const { polls, questions } = await readState(page);
    const poll = polls[0];
    expect(Object.keys(poll).sort()).toEqual(["closesAt", "id", "title"]);
    expect(poll.title).toBe("Team lunch");
    expect(questions[0]).toMatchObject({
      pollId: poll.id,
      text: "Pizza today?",
      options: [{ text: "Yes" }, { text: "No" }],
    });

    await pollLink(page, "Team lunch").click();
    await expect(page).toHaveURL(localePath(`/polls/${poll.id}`));
    await expect(
      page.getByRole("heading", { name: "Team lunch" })
    ).toBeVisible();
    await expect(page.getByText("Pizza today?")).toBeVisible();

    // A locally created poll must also load from its URL directly.
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Team lunch" })
    ).toBeVisible();
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

    const closesAt = (await readState(page)).polls[0].closesAt as number;
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

    const closesAt = (await readState(page)).polls[0].closesAt as number;
    const expected = await page.evaluate(() =>
      new Date("2031-03-15T14:30").getTime()
    );
    expect(closesAt).toBe(expected);
  });

  test("validates the form", async ({ page, t, localePath }) => {
    await openManagerDashboard(page, t, localePath);
    const pollCount = (await readState(page)).polls.length;

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

    expect((await readState(page)).polls).toHaveLength(pollCount);
  });

  test("closing a poll sets closesAt to now and blocks voting", async ({
    page,
    t,
    localePath,
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

    const { polls } = await readState(page);
    const poll = polls.find(({ id }) => id === OPEN_POLL.id);
    expect(poll).not.toHaveProperty("status");
    expect(poll?.closesAt).toBeGreaterThanOrEqual(before);
    expect(poll?.closesAt).toBeLessThanOrEqual(Date.now());

    await page.getByTestId("role-Participant").click();
    await expect(page.getByTestId("vote-closed")).toBeVisible();

    await page.reload();
    await expectStatus(page, t, "closed");
    await expect(page.getByRole("radio")).toHaveCount(0);
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
    await page.goto(localePath(`/polls/${OPEN_POLL.id}`));
    await updateStoredState(page, (state) => {
      state.votes.push(
        ...[1, 2].map((optionNumber) => ({
          id: `tie-vote-${optionNumber}`,
          pollId: OPEN_POLL.id,
          questionId: "poll-1-q-1",
          optionId: `poll-1-opt-${optionNumber}`,
          userId: `tie-user-${optionNumber}`,
        }))
      );
    });

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

  test("AI insights load for exactly two seconds, then show the analysis", async ({
    page,
    t,
    localePath,
  }) => {
    await page.clock.install();
    await page.clock.pauseAt(Date.now() + 1000);
    await page.goto(localePath(`/polls/${CLOSED_POLL.id}`));

    const loading = page.getByTestId("ai-insights-loading");
    await expect(loading).toHaveText(t("insights.loading"));

    await page.clock.runFor(1999);
    await expect(loading).toBeVisible();

    await page.clock.runFor(1);
    await expect(loading).toBeHidden();
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
