import { expect, Page, test } from "@playwright/test";

const STATE_KEY = "pollhub_state_v2";
const DAY_MS = 24 * 60 * 60 * 1000;

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

// The badge comes first; the time remaining card can also read "Closed".
const statusBadge = (page: Page, status: "Open" | "Closed") =>
  page.getByRole("main").getByText(status, { exact: true }).first();

const kpiCard = (page: Page, label: string) =>
  page.getByRole("group", { name: label });

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

async function openManagerDashboard(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Manager" }).click();
  await page.getByRole("link", { name: "Manager Dashboard" }).click();
  await expect(
    page.getByRole("heading", { name: "Manager Dashboard" })
  ).toBeVisible();
}

async function fillPollForm(
  page: Page,
  { title, question }: { title: string; question: string }
) {
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Question").fill(question);
  await page.getByPlaceholder("Option 1").fill("Yes");
  await page.getByPlaceholder("Option 2").fill("No");
}

const submitPollForm = (page: Page) =>
  page.getByRole("button", { name: "Create Poll" }).click();

test.describe("dashboard", () => {
  test("lists polls by title with a status derived from closesAt", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto("/");

    const openPoll = pollLink(page, OPEN_POLL.title);
    await expect(openPoll.getByText("Open", { exact: true })).toBeVisible();
    await expect(openPoll).toContainText("0 votes · 4 options");

    const closedPoll = pollLink(page, CLOSED_POLL.title);
    await expect(closedPoll.getByText("Closed", { exact: true })).toBeVisible();
    await expect(closedPoll).toContainText("4 votes · 4 options");

    // Polls render on the server too, so this also catches hydration mismatches.
    expect(errors).toEqual([]);
  });

  test("ignores state saved in the old v1 format", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "pollhub_state_v1",
        JSON.stringify({
          polls: [{ id: "old", question: "Old?", options: [], status: "open" }],
          votes: [],
        })
      );
    });
    await page.goto("/");

    await expect(pollLink(page, OPEN_POLL.title)).toBeVisible();
    await expect(page.getByText("Old?")).toHaveCount(0);
  });
});

test.describe("participant", () => {
  test("votes once and the vote survives a reload", async ({ page }) => {
    await page.goto(`/polls/${OPEN_POLL.id}`);

    await expect(
      page.getByRole("heading", { name: OPEN_POLL.title })
    ).toBeVisible();
    await expect(page.getByText(OPEN_POLL.question)).toHaveCount(2);

    const submit = page.getByRole("button", { name: "Submit Vote" });
    await expect(submit).toBeDisabled();
    await page.getByRole("radio", { name: "Mobile app" }).check();
    await submit.click();

    await expect(page.getByText("Thanks for voting!")).toBeVisible();
    await expect(kpiCard(page, "Total votes")).toContainText("1");
    await expect(kpiCard(page, "Leading option")).toContainText("Mobile app");

    // A new vote runs the simulated analysis again, on the new totals.
    await expect(page.getByText("Generating AI insights...")).toBeVisible();
    await expect(
      page.getByText("Based on the 1 aggregated response")
    ).toBeVisible();

    const { votes } = await readState(page);
    expect(votes.at(-1)).toMatchObject({
      pollId: OPEN_POLL.id,
      questionId: "poll-1-q-1",
      optionId: "poll-1-opt-2",
      userId: "participant-1",
    });

    await page.reload();
    await expect(page.getByText("Already voted")).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(0);
    await expect(kpiCard(page, "Total votes")).toContainText("1");
  });

  test("cannot vote on a closed poll but sees its results", async ({ page }) => {
    await page.goto(`/polls/${CLOSED_POLL.id}`);

    await expect(statusBadge(page, "Closed")).toBeVisible();
    await expect(page.getByText("This poll is closed.")).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(0);
    await expect(page.getByText(CLOSED_POLL.question)).toBeVisible();
    await expect(kpiCard(page, "Total votes")).toContainText("4");
  });

  test("is redirected away from the manager dashboard", async ({ page }) => {
    await page.goto("/manager");
    await expect(page).toHaveURL("/");
  });

  test("gets a 404 for an unknown poll", async ({ page }) => {
    await page.goto("/polls/does-not-exist");
    await expect(page.getByText("This page could not be found")).toBeVisible();
  });
});

test.describe("manager", () => {
  test("creates a poll and its question as separate entities", async ({
    page,
  }) => {
    await openManagerDashboard(page);
    await fillPollForm(page, { title: "Team lunch", question: "Pizza today?" });
    await submitPollForm(page);

    await expect(page.getByText("Poll created successfully!")).toBeVisible();
    await expect(page.getByLabel("Title")).toHaveValue("");

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

  test("closing time defaults to seven days from now", async ({ page }) => {
    await openManagerDashboard(page);
    await fillPollForm(page, { title: "Default", question: "Default close?" });

    const before = Date.now();
    await submitPollForm(page);
    await expect(page.getByText("Poll created successfully!")).toBeVisible();

    const closesAt = (await readState(page)).polls[0].closesAt as number;
    // The input has minute precision, so the value can be up to a minute early.
    expect(closesAt).toBeGreaterThan(before + 7 * DAY_MS - 2 * 60 * 1000);
    expect(closesAt).toBeLessThanOrEqual(Date.now() + 7 * DAY_MS);

    await pollLink(page, "Default").click();
    await expect(kpiCard(page, "Time remaining")).toContainText(
      "Closes in 7 days"
    );
  });

  test("can set a custom closing time", async ({ page }) => {
    await openManagerDashboard(page);
    await fillPollForm(page, { title: "Custom", question: "Custom close?" });
    await page.getByLabel("Closing time").fill("2031-03-15T14:30");
    await submitPollForm(page);
    await expect(page.getByText("Poll created successfully!")).toBeVisible();

    const closesAt = (await readState(page)).polls[0].closesAt as number;
    const expected = await page.evaluate(() =>
      new Date("2031-03-15T14:30").getTime()
    );
    expect(closesAt).toBe(expected);
  });

  test("validates the form", async ({ page }) => {
    await openManagerDashboard(page);
    const pollCount = (await readState(page)).polls.length;

    await submitPollForm(page);
    await expect(page.getByText("Please enter a poll title.")).toBeVisible();

    await page.getByLabel("Title").fill("Validation");
    await submitPollForm(page);
    await expect(page.getByText("Please enter a poll question.")).toBeVisible();

    await page.getByLabel("Question").fill("Valid?");
    await submitPollForm(page);
    await expect(
      page.getByText("Please provide at least two answer options.")
    ).toBeVisible();

    await page.getByPlaceholder("Option 1").fill("Yes");
    await page.getByPlaceholder("Option 2").fill("No");
    await page.getByLabel("Closing time").fill("2020-01-01T00:00");
    await submitPollForm(page);
    await expect(
      page.getByText("The closing time must be in the future.")
    ).toBeVisible();

    await page.getByLabel("Closing time").fill("");
    await submitPollForm(page);
    await expect(page.getByText("Please choose a closing time.")).toBeVisible();

    expect((await readState(page)).polls).toHaveLength(pollCount);
  });

  test("closing a poll sets closesAt to now and blocks voting", async ({
    page,
  }) => {
    await openManagerDashboard(page);
    await pollLink(page, OPEN_POLL.title).click();
    await expect(statusBadge(page, "Open")).toBeVisible();

    const before = Date.now();
    await page.getByRole("button", { name: "Close poll" }).click();

    await expect(page.getByRole("button", { name: "Poll closed" })).toBeDisabled();
    await expect(statusBadge(page, "Closed")).toBeVisible();

    const { polls } = await readState(page);
    const poll = polls.find(({ id }) => id === OPEN_POLL.id);
    expect(poll).not.toHaveProperty("status");
    expect(poll?.closesAt).toBeGreaterThanOrEqual(before);
    expect(poll?.closesAt).toBeLessThanOrEqual(Date.now());

    await page.getByRole("button", { name: "Participant" }).click();
    await expect(page.getByText("This poll is closed.")).toBeVisible();

    await page.reload();
    await expect(statusBadge(page, "Closed")).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(0);
  });
});

test.describe("results view", () => {
  test("KPI cards summarize a closed poll", async ({ page }) => {
    await page.goto(`/polls/${CLOSED_POLL.id}`);

    const totalVotes = kpiCard(page, "Total votes");
    await expect(totalVotes).toContainText("4");
    await expect(totalVotes).toContainText("Across 4 options");

    const leading = kpiCard(page, "Leading option");
    await expect(leading).toContainText("Very satisfied");
    await expect(leading).toContainText("50% of votes");

    await expect(kpiCard(page, "Time remaining")).toContainText("Closed");
  });

  test("KPI cards handle a poll without votes", async ({ page }) => {
    await page.goto(`/polls/${OPEN_POLL.id}`);

    await expect(kpiCard(page, "Total votes")).toContainText("0");
    await expect(kpiCard(page, "Leading option")).toContainText("No votes yet");
    await expect(kpiCard(page, "Time remaining")).toContainText(
      /Closes in \d+ days/
    );
    await expect(page.getByText("No votes have been cast yet.")).toBeVisible();
    await expect(page.locator(".recharts-surface")).toHaveCount(0);
    await expect(page.getByText("No responses have been aggregated")).toBeVisible();
  });

  test("time remaining counts down in the largest fitting unit", async ({
    page,
  }) => {
    await page.goto(`/polls/${OPEN_POLL.id}`);
    const timeRemaining = kpiCard(page, "Time remaining");

    await closeOpenPollIn(page, 3 * 60 * 60 * 1000);
    await expect(timeRemaining).toContainText("Closes in 3 hours");

    await closeOpenPollIn(page, 10 * 60 * 1000);
    await expect(timeRemaining).toContainText("Closes in 10 minutes");
  });

  test("a tie names every leading option", async ({ page }) => {
    await page.goto(`/polls/${OPEN_POLL.id}`);
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

    const leading = kpiCard(page, "Leading option");
    await expect(leading).toContainText("Dark mode and Mobile app");
    await expect(leading).toContainText("Tied at 50% each");
    await expect(
      page.getByText('split evenly between "Dark mode" and "Mobile app"')
    ).toBeVisible();
  });

  test("chart ranks options, shows percentages and highlights the leader", async ({
    page,
  }) => {
    await page.goto(`/polls/${CLOSED_POLL.id}`);

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
      "2 votes"
    );
  });

  test("results are also available as a table", async ({ page }) => {
    await page.goto(`/polls/${CLOSED_POLL.id}`);
    await expect(page.getByRole("table")).toBeHidden();

    await page.getByText("View as table").click();

    const rows = page.getByRole("table").getByRole("row");
    await expect(rows).toHaveCount(5);
    await expect(rows.nth(1)).toHaveText(/Very satisfied\s*2\s*50%/);
    await expect(rows.nth(4)).toHaveText(/Unsatisfied\s*0\s*0%/);
  });

  test("AI insights load for exactly two seconds, then show the analysis", async ({
    page,
  }) => {
    await page.clock.install();
    await page.clock.pauseAt(Date.now() + 1000);
    await page.goto(`/polls/${CLOSED_POLL.id}`);

    const loading = page.getByText("Generating AI insights...");
    await expect(loading).toBeVisible();

    await page.clock.runFor(1999);
    await expect(loading).toBeVisible();

    await page.clock.runFor(1);
    await expect(loading).toBeHidden();
    await expect(
      page.getByText(
        'Based on the 4 aggregated responses, the simulated consensus clearly favors "Very satisfied" with 50% of the vote.'
      )
    ).toBeVisible();
  });

  test("fits a mobile screen without sideways scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/polls/${CLOSED_POLL.id}`);

    const chart = page.locator(".recharts-surface").first();
    await expect(chart).toBeVisible();
    const chartBox = await chart.boundingBox();
    expect(chartBox!.x + chartBox!.width).toBeLessThanOrEqual(375);

    const totalBox = await kpiCard(page, "Total votes").boundingBox();
    const leadingBox = await kpiCard(page, "Leading option").boundingBox();
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
}) => {
  await page.goto(`/polls/${OPEN_POLL.id}`);
  await expect(statusBadge(page, "Open")).toBeVisible();

  await closeOpenPollIn(page, 10_000);

  await expect(statusBadge(page, "Open")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Dark mode" })).toBeVisible();

  // No interaction or reload from here on: the view has to update on its own.
  await expect(statusBadge(page, "Closed")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("This poll is closed.")).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(0);
});
