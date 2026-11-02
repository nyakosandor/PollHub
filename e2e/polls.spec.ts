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

const statusBadge = (page: Page, status: "Open" | "Closed") =>
  page.getByRole("main").getByText(status, { exact: true });

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
    await expect(page.getByText("1 total vote")).toBeVisible();

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
    await expect(page.getByText("1 total vote")).toBeVisible();
  });

  test("cannot vote on a closed poll but sees its results", async ({ page }) => {
    await page.goto(`/polls/${CLOSED_POLL.id}`);

    await expect(statusBadge(page, "Closed")).toBeVisible();
    await expect(page.getByText("This poll is closed.")).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(0);
    await expect(page.getByText(CLOSED_POLL.question)).toBeVisible();
    await expect(page.getByText("4 total votes")).toBeVisible();
  });

  test("AI summary is built from the question text", async ({ page }) => {
    await page.goto(`/polls/${CLOSED_POLL.id}`);

    await page.getByRole("button", { name: "Generate AI Summary" }).click();

    await expect(page.getByText("Based on the aggregated")).toContainText(
      `standout choice for "${CLOSED_POLL.question}"`
    );
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

test("an open poll closes by itself when its closing time passes", async ({
  page,
}) => {
  await page.goto(`/polls/${OPEN_POLL.id}`);
  await expect(statusBadge(page, "Open")).toBeVisible();

  // Store a closing time a few seconds ahead and reload to pick it up.
  await page.evaluate((key) => {
    const state = JSON.parse(window.localStorage.getItem(key)!);
    state.polls[0].closesAt = Date.now() + 10_000;
    window.localStorage.setItem(key, JSON.stringify(state));
  }, STATE_KEY);
  await page.reload();

  await expect(statusBadge(page, "Open")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Dark mode" })).toBeVisible();

  // No interaction or reload from here on: the view has to update on its own.
  await expect(statusBadge(page, "Closed")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("This poll is closed.")).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(0);
});
