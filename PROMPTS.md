# Prompt Log

A record of prompts used to build PollHub with Claude Code, including the model that handled each prompt.

## 2026-09-29

### Prompt 1

**Model:** Not recorded (logged before model tracking was added)

```
Role: Expert Frontend Developer
Task: Build a frontend-only MVP for a web application called "PollHub", a platform for collecting and evaluating questionnaires and polls.
Tech Stack: Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide React (for icons), Recharts (for visualization).

Architecture & State Management:
Since this is a frontend MVP, do not build a real backend. Use React Context API combined with localStorage to manage state and mock data persistently across reloads.

Core Entities:

Poll: id, question, options (id, text), status (open/closed).

Vote: id, pollId, optionId, userId (mocked).

UserRole: "Participant" | "Manager" (Provide a simple global toggle in the navbar to switch between these roles for demonstration purposes).

Required Features & Views:

Dashboard / Poll List:

Displays all available polls.

Shows status badges (Open/Closed).

Poll Manager Features (Admin):

Create a new poll: Input for one question and multiple answer options.

Close a poll: A button to change a poll's status from Open to Closed.

Participant Features (Voting):

View a poll and submit exactly one answer.

Business Rules Enforcement: Disable the voting form if the poll is "Closed". Check the mock state to ensure the current simulated participant cannot vote more than once on the same poll (disable the submit button and show a "Already voted" message).

Results & Visualization:

A results view for each poll showing the distribution of votes.

Use simple horizontal bar charts (e.g., standard Tailwind div widths or Recharts) to visualize the data.

Simulated LLM Summary (Special Requirement):

On the results page, include an "AI Insights" card.

Behavior: When clicked, show a brief loading state (simulating API latency), then display a hardcoded, fictitious text summary of the aggregated results (e.g., "Based on the aggregated fictitious data, the majority of respondents strongly lean towards option A, indicating a clear preference for X...").

Note: Do NOT integrate a real LLM API; just build the UI component that simulates this workflow perfectly.

Instructions for the AI:

Start by setting up the mock data structure and Context provider.

Build the layout with the role-switcher toggle.

Implement the Poll List and Voting views.

Implement the Manager dashboard and the Results view with the fake LLM summary.

Keep the UI clean, modern, and minimalist. Use Tailwind for styling. Provide all the necessary code in modular components. and every prompt what i use please save to the md file with date
```

**Outcome:** Scaffolded the Next.js + TypeScript + Tailwind app, built `PollContext` (React Context + localStorage persistence), types, mock data, and components (`Navbar`, `PollList`, `CreatePollForm`, `VoteForm`, `ResultsChart`, `AIInsights`, `StatusBadge`), plus routes for the dashboard (`/`), poll detail (`/polls/[id]`), and manager dashboard (`/manager`). Fixed a dark-mode CSS background conflict and a hydration race that caused the manager page to redirect incorrectly. Verified the full flow (vote, close poll, create poll, AI insights) in a live browser session.

### Prompt 2

**Model:** Claude Opus 5.5 (`claude-opus-5-5`)

```
lets test the changes via playwright mcp, then write me a summary about the changes
```

**Outcome:** Ran an end-to-end test of the MVP with the Playwright MCP (dashboard, voting, one-vote rule, closed-poll lock, localStorage persistence, AI Insights, manager create/validate/close, role redirect, mobile layout). Everything passed except one bug: loading a user-created poll's URL directly (refresh/share) returns a 404, because `/polls/[id]` calls `notFound()` before localStorage has hydrated. Also noted a brief pre-hydration flash of the empty vote form on reload.

### Prompt 3

**Model:** Claude Opus 5.5 (`claude-opus-5-5`)

```
yes, and i also want to save the model for each prompt
```

**Outcome:** Fixed the 404: `/polls/[id]` now waits for `isHydrated` before calling `notFound()`, which also removes the flash of the empty vote form on reload. Checked with Playwright: a created poll's URL loads directly, an unknown id still shows the 404 page, and seed polls reload correctly. Added a **Model** line to every prompt entry.

### Prompt 4

**Model:** Claude Opus 5.5 (`claude-opus-5-5`)

```
Role: Senior Frontend Architect & DevOps
Task: Perform a strict Clean Code review on the current codebase, refactor if necessary, and autonomously push the code to the repository.

Execution Steps:

Code Review: Analyze the recently implemented PollHub MVP code. Strictly evaluate it against Clean Code principles:

SRP (Single Responsibility Principle): Are components doing only one thing?

DRY (Don't Repeat Yourself): Is there duplicated logic?

Naming: Are variables, functions, and components named clearly and descriptively?

State Management: Is the React state/Context clean and free of unnecessary prop drilling?

Refactoring: If you find any code smells, poorly named variables, or bloated components, refactor them immediately.

Validation: Ensure the application still correctly implements the MVP features (Poll List, Manager view, Participant voting, Results, and simulated LLM summary).

Git Operations: Once the code is completely clean and validated, execute the terminal commands to push the code autonomously:

git add .

git commit -m "refactor: apply clean code principles and validate MVP frontend"

git push

Constraint: Do not stop to ask for my confirmation if the code is clean. Just fix it, commit, and push.
```

**Outcome:** Clean Code refactor:
- **SRP:** moved localStorage I/O out of `PollContext` into `lib/storage.ts` and the summary text out of `AIInsights` into `lib/insights.ts`, and pulled the close control into `ClosePollButton`.
- **DRY:** added a shared `pluralize`/`toPercent` in `lib/format.ts`, a `PollResult` type, a `Card` component, a data-driven Navbar role toggle, and a shared input class.
- **State:** the context value is now memoized with `useCallback`/`useMemo`, unused context fields were removed, IDs use `crypto.randomUUID`, and timers clear on unmount via `useTimeout`.
- **Naming and markup:** clearer names (`isVoted`, `selectedOptionId`, `results`), dead code removed, stable keys for draft options, and form labels linked to their inputs.

Validated with `tsc`, `eslint`, `next build`, and a 20-check Playwright E2E run (all passed). Gitignored `.playwright-mcp/` and `.claude/settings.local.json`, then committed and pushed to `origin/main`.

## 2026-11-02

### Prompt 5

**Model:** Claude Opus 5.5 (`claude-opus-5-5`)

```
Role: Senior Frontend Architect
Task: Domain Model Refactoring (DDD) - Update entities and value objects to strictly match the final architectural spec, while keeping the UI flow intact.

Context:
The Week 1 MVP works perfectly, but the underlying data model is too simplistic (status: open/closed, and Poll directly containing the question string). We need to refactor the data structures in types.ts, lib/storage.ts, and PollContext to prepare for future complex features.

Required Changes:

Implement "Lezárási idő" (Closing Time) Value Object:

Remove the boolean/string status (open/closed) from the Poll entity.

Introduce closesAt: number (Unix timestamp) or Date string.

A poll is dynamically considered "Closed" if Date.now() > closesAt.

Update the Create Poll form to allow setting a closing date/time (or default it to 7 days from now).

Update the "Close Poll" manager action to simply set closesAt to Date.now() (closing it immediately).

Separate "Kérdés" (Question) from "Kérdőív" (Poll):

Refactor the Poll entity: It should now have id, title (string), and closesAt.

Create a Question entity: id, pollId, text, and options: Option[].

Create an Answer/Vote entity: id, pollId, questionId, optionId, userId.

UI Constraint: For now, keep the Create Poll UI simple. When the manager creates a poll, they still only enter a Title, one Question, and its Options. Behind the scenes, the context should create the Poll and the associated single Question.

Update State & UI:

Update PollContext and all lib/* helper files to work with the new separated arrays (polls, questions, votes).

Update the Voting view and Results view to fetch the Question belonging to the Poll and render it accordingly.

Testing & Validation:

Update the existing Playwright E2E tests to accommodate any UI changes (like the new Title field or Closing Time input) and ensure all tests pass.

Do NOT push to git yet. Just refactor and run tests.
```

**Outcome:** Split the model into `Poll` (`id`, `title`, `closesAt`), `Question`, and `Vote` (now with `questionId`), kept in separate arrays. Removed `status` and the unused `createdAt`. Open/closed is now derived from `closesAt` (`lib/closingTime.ts`), and a clock in `PollContext` updates open views when a poll's closing time passes. The Create Poll form gained Title and Closing time fields (default 7 days from now). The storage key moved to `pollhub_state_v2`, so old `v1` data is no longer loaded. The repo had no Playwright test files, so added `@playwright/test`, `playwright.config.ts`, and `e2e/polls.spec.ts`. `tsc`, `eslint`, `next build`, and all 13 E2E tests pass. Nothing committed or pushed.

### Prompt 6

**Model:** Claude Opus 5.5 (`claude-opus-5-5`)

```
Role: Senior DevOps
Task: Commit and push the successful Domain-Driven Design (DDD) refactoring.

Instructions:

Since all Playwright E2E tests have passed successfully after the recent Domain Model refactoring, safely add and commit the changes.

Use a descriptive conventional commit message, e.g., refactor: implement DDD entities (Question separation) and Closing Time VO.

Push the changes to the remote repository.
```

**Outcome:** Committed the refactor and pushed it to a new branch, `refactor/ddd-domain-model`, rather than directly to `main`.

### Prompt 7

**Model:** Claude Opus 5.5 (`claude-opus-5-5`)

```
Role: Data Visualization & Frontend Expert
Task: Implement the "Complex feature: Result evaluation and visualization" based on the project specification. Upgrade the Results view with advanced charts, KPI metrics, and a dynamic simulated LLM summary.Tech Stack: Next.js, React, Tailwind CSS, Recharts, Framer Motion (optional for simple transitions, or just use Tailwind CSS transitions).

Requirements for the Results View (/polls/[id]/results or similar):

KPI / Metric Cards:
Above the chart, display a grid of summary cards showing:

Total Votes: The absolute number of votes received.

Leading Option: The name of the option with the most votes currently.

Time Remaining / Status: If closesAt is in the future, show a relative countdown (e.g., "Closes in 2 days"). If in the past, show "Closed".

Advanced Visualization (Recharts):

Replace the basic HTML/Tailwind bars with a polished, interactive chart using the recharts library (e.g., ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Cell).

The chart must be responsive and adapt to mobile and desktop screens.

Show percentages clearly on or near the bars.

Enhanced Simulated LLM Summary:

The spec requires: "LLM-összefoglaló kizárólag összesített, fiktív válaszokból" (LLM summary based exclusively on aggregated, fictitious answers).

Update the AI Insights component: It must accept the aggregated vote data as props.

Dynamic Fictitious Generation: Instead of a static hardcoded string, write a helper function that takes the top option and total votes, and returns a realistic-sounding "AI" analysis (e.g., "Based on the {totalVotes} aggregated responses, the simulated consensus strongly favors '{topOption.text}'. The distribution suggests...").

Loading state: When the component mounts, show a beautiful skeleton loader or pulsing "Generating AI insights..." state for exactly 2 seconds using setTimeout to simulate LLM API latency, then reveal the generated text.

Testing:

Ensure the Playwright E2E tests are updated to account for the new UI elements (loading states, new metric cards).

Run tests to confirm everything is green.

Instructions:
Refactor the Results component and its children. Make it look like a premium SaaS dashboard using Tailwind. Do not push to git yet, just implement and test.
```

**Outcome:** Upgraded the results section of `/polls/[id]` (no separate route) with KPI cards for total votes, leading option and time remaining; a ranked Recharts bar chart with percentages, a highlighted leader, a tooltip and a table view; and an AI Insights panel that shows a loading state for 2 seconds on mount, then an analysis built only from aggregated counts. Ties and polls with no votes are handled. Used the `shape` prop rather than `Cell`, which Recharts has deprecated. Removed the Generate and Regenerate buttons. `tsc`, `eslint`, `next build`, and all 20 E2E tests pass. Changes are uncommitted on `refactor/ddd-domain-model`.

### Prompt 8

**Model:** Claude Opus 5.5 (`claude-opus-5-5`)

```
Role: Senior DevOps
Task: Finalize, commit, merge, and push the completed Results Visualization feature.

Context:
Excellent work on the Results view! Your architectural decisions (avoiding deprecated Recharts features, handling ties, auto-generation, keeping it on the same route) are spot on. Since all 20 Playwright E2E tests, type-checks, and production builds are passing, it's time to integrate this into the main branch.

Execution Steps:

Commit: Add and commit the current uncommitted changes on the refactor/ddd-domain-model branch. Use a clean conventional commit message (e.g., feat: implement advanced results visualization and dynamic AI insights).

Merge: Switch to the main branch and merge the refactor/ddd-domain-model branch into main.

Push: Push the main branch to the remote repository.

Cleanup (Optional): Delete the local refactor/ddd-domain-model branch if the merge was successful.

Constraint: Execute these git commands autonomously. No need to ask for permission if the git status is clean.
```

**Outcome:** Committed the results feature, merged `refactor/ddd-domain-model` into `main`, pushed `main`, and deleted the local branch. The remote copy of the branch was left in place.

### Prompt 9

**Model:** Claude Opus 5.5 (`claude-opus-5-5`)

```
Role: Senior Tech Lead & Technical Writer
Task: Final repository cleanup and project documentation.

Execution Steps:

Remote Cleanup:
Execute the terminal command to delete the remote tracking branch that is no longer needed:git push origin --delete refactor/ddd-domain-model

Generate README.md:
Create a highly professional README.md in the root of the project. It should be written in Hungarian (as it's for a Hungarian university assignment), but maintain a professional IT terminology. Include the following sections:

Projekt célja (PollHub): A brief overview of the MVP.

Funkciók (Features): List the completed features (Poll List, Manager/Participant roles, Voting logic, Data Visualization with Recharts).

Architektúra és DDD (Domain-Driven Design): Explain how the data model is structured based on DDD principles (Kérdőív / Poll, Kérdés / Question separate entities, Lezárási idő / Closing Time as a Value Object instead of a simple status). Mention the use of React Context and localStorage for the frontend-only MVP state.

Üzleti Szabályok (Business Rules): Explain the enforcement of "one vote per user per question" and the "no voting on closed polls" logic.

LLM Szimuláció (AI Insights): Explain how the LLM summary requirement ("kizárólag összesített, fiktív válaszokból") was met using a dynamic, client-side generation based on aggregated data with a simulated API delay, avoiding external dependencies for this MVP.

Futtatás (How to run): Simple instructions (npm install, npm run dev, npm run test:e2e).

Commit & Push:
Commit the new README.md with the message docs: create comprehensive project documentation and push it directly to main.

Constraint: Run these steps autonomously.
```

**Outcome:** Deleted the remote `refactor/ddd-domain-model` branch, replaced the boilerplate `README.md` with Hungarian project documentation, and pushed it to `main`. The README states that the one-vote check currently runs per poll, which equals per question while each poll has one question.

## 2026-11-03

### Prompt 10

**Model:** Claude Opus 5.5 (`claude-opus-5-5`)

```
Role: Senior Full-Stack Next.js Architect
Task: Implement production-grade Internationalization (i18n) using next-intl for the final Next.js App Router application.

Context:
We are moving from an MVP to the final, production-ready web application. The custom React Context for translations is not sufficient anymore. We must implement proper localized routing and server-side translation support (EN/HU) using the industry standard next-intl library.

Execution Steps:

Install Dependencies:

Install next-intl.

Configure next-intl for App Router:

Create the necessary folder structure for Next.js App Router i18n: move the existing app contents into an app/[locale] dynamic route folder.

Create messages/en.json and messages/hu.json in the root directory containing all UI text, including complex strings for the Dashboard, Voting, and AI Insights.

Set up i18n.ts (request configuration).

Set up middleware.ts in the root to handle locale detection and redirection (default: hu, supported: hu, en).

Configure next.config.js with the next-intl/plugin.

Refactor Components:

Replace all hardcoded strings with useTranslations (in Client Components) or getTranslations (in Server Components).

Build a sleek LanguageSwitcher component in the Navbar to let users switch between English and Hungarian, updating the URL routing accordingly.

Update the AIInsights simulated LLM logic to generate its text based on the active locale.

Fix E2E Tests (CRITICAL):

The introduction of the /[locale]/ route segment and translated UI elements will break the current Playwright tests.

Refactor the Playwright configuration and the 20 test cases to work with the localized URLs (e.g., navigating to /hu/ or /en/) and rely on test IDs (data-testid) or translated assertions. Ensure all tests pass.

Commit and Push:

Once all typing issues are resolved, the app builds cleanly (next build), and E2E tests are 100% green, execute:

git add .

git commit -m "feat: migrate to production-grade i18n using next-intl with localized routing"

git push

Constraint: Perform these complex architectural changes autonomously. Do not ask for permission if the build and tests are passing.
```

**Outcome:** Added next-intl 4 with `/hu` and `/en` routes (default `hu`, browser-language detection), `messages/en.json` and `messages/hu.json`, a `LanguageSwitcher` in the navbar, and locale-aware AI insights. Used `src/proxy.ts` instead of `middleware.ts` (deprecated in Next.js 16) and `src/i18n/request.ts` as the request config. The 20 E2E tests now run in both locales with test IDs and assertions translated from the message files, plus 4 new i18n tests: 48/48 pass, and `next build`, `tsc` and ESLint are clean.

### Prompt 11

**Model:** Claude Opus 5.5 (`claude-opus-5-5`)

```
Role: Lead UX/UI Designer & Senior Tailwind CSS Expert
Task: Elevate the visual design and UX of the PollHub application from a basic functional MVP to a premium, production-ready SaaS interface.

Context:
The core functionality, i18n, and DDD architecture are complete and tested. Now, the application needs a massive visual upgrade. The design should look modern, trustworthy, and highly polished, using Tailwind CSS best practices.

Execution Steps (Design System & Polish):

Color Palette & Dark Mode:

Establish a refined color system. Use sophisticated neutrals (e.g., slate or zinc) for text/backgrounds and a strong primary color (e.g., indigo, blue, or violet) for CTAs.

Ensure perfect contrast and aesthetics in both Light and Dark modes. Fix any remaining background/text color clashes.

Component Elevation (Cards & Buttons):

Cards: Upgrade all card components (Poll list items, Results cards, AI Insights). Add soft drop shadows (shadow-sm, hover:shadow-md), subtle borders (border border-slate-200 dark:border-slate-800), and modern border-radius (rounded-xl or rounded-2xl).

Buttons & Inputs: Make buttons premium with proper padding, font-weight, and interactive states (hover:bg-primary-600, active:scale-95, transition-all duration-200). Add focus rings for accessibility (focus-visible:ring-2 focus-visible:ring-offset-2).

Style form inputs to look modern and clean.

Typography & Spacing (Whitespace):

Improve the typography hierarchy. Make titles bolder and more distinct. Use subtle grays for secondary text (e.g., dates, metadata).

Increase whitespace/padding generously. Ensure the layout doesn't feel cramped, especially on mobile.

Empty States & Micro-interactions:

Design beautiful "Empty States" for the Poll List (when no polls exist) using Lucide React icons and helpful text.

Ensure hover effects on interactive elements feel snappy but smooth.

Test Safety (CRITICAL):

DO NOT change any data-testid attributes, ARIA labels used for testing, or the underlying DOM structure in a way that breaks the Playwright E2E tests.

Run npx playwright test (or your test command) locally after applying the styles to guarantee the UI changes haven't broken the test interactions.

Git Operations:

Once the design is completely upgraded and all E2E tests pass, commit the changes autonomously.

Commit message: style: elevate UI/UX design, typography, and component styling

Push to main.

Constraint: Perform this design overhaul autonomously. Fix any failing E2E tests immediately if a styling change accidentally covers or hides a clickable element.
```

**Outcome:** Added design tokens in `globals.css` (a `primary` color alias for indigo, Geist as the sans font, dark mode that follows the system setting) and shared button, input and card classes in `src/lib/ui.ts`. Restyled every component in light and dark mode: navbar (icon-only role switch on mobile), poll cards, KPI cards, chart, table, AI insights, forms, vote options, the 404 page, and a new poll-list empty state with EN/HU text. No test IDs or test-relied ARIA labels changed, and the chart bar colors stay the same because a test checks them. 48/48 E2E tests pass, and `tsc`, ESLint and `next build` are clean.

### Prompt 12

**Model:** Claude Opus 5.5 (`claude-opus-5-5`)

```
test via playwright mcp and try to fix this issues like black and white theme problem
```

**Outcome:** Used the Playwright MCP to scan text contrast on every page and state, under every combination of OS theme and chosen theme. Fixed three light-mode contrast failures (inactive role/language switcher text and the option-number badges, 4.35:1 → slate-600). Added a Light / Dark / System theme switcher in the navbar (EN/HU labels). The choice is saved in `localStorage` and applied by an inline `<head>` script before first paint, as the Next 16 "preventing flash before hydration" guide describes. Tailwind's `dark:` variant now follows `<html data-theme>`, or the system setting when nothing is chosen. Found and fixed the 404 page losing the choice: React re-creates `<html>` there, so the store re-applies it. `next/script` `beforeInteractive` was rejected because it only runs after first paint. Added 4 theme E2E tests: 56/56 pass, and `tsc` and ESLint are clean. Committed and pushed to `main`.

### Prompt 13

**Model:** Claude Opus 5.5 (`claude-opus-5-5`)

```
when i try to switch english language i got this console error:

  57 |         {/* Inline so it runs while the HTML is parsed, before the first paint.
  58 |             next/script's beforeInteractive only queues it for the Next runtime. */}
> 59 |         <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
     |         ^
  60 |       </head>
  61 |       <body className="flex min-h-full flex-col bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
  62 |         <NextIntlClientProvider>
```

**Outcome:** Cause: switching locale changes the `[locale]` root-layout segment, so React renders `<html>` on the client, and React warns about client-rendered `<script>` tags. Added `src/components/ThemeScript.tsx`: it outputs the inline script only in server HTML and during hydration, and otherwise applies the saved theme in a layout effect before paint. Verified with the Playwright MCP: no console errors across HU → EN → HU, the theme is kept, and it's still set at parse time. Added a regression E2E test. Stress runs showed timing flakiness in the manager navigation tests that already exists on the last commit (2/60 there, 6/60 with the fix). Left uncommitted pending a decision.

### Prompt 14

**Model:** Claude Opus 5.5 (`claude-opus-5-5`)

```
what is the problem here?
```

**Outcome:** Explained the two separate issues: the locale-switch console error (fixed, uncommitted), and the timing flakiness in the manager E2E tests that already exists. Offered to commit the fix, investigate the flakiness, or both.

### Prompt 15

**Model:** Claude Opus 5.5 (`claude-opus-5-5`)

```
Role: Senior Tech Lead & Developer Advocate
Task: Generate a comprehensive Presentation Summary Document in Hungarian for a university project defense.

Context:
The PollHub MVP is completely finished (DDD architecture, Next.js App Router, next-intl i18n, Recharts visualization, simulated AI insights, polished UI/UX, and 100% Playwright E2E coverage). Now, I need a highly professional presentation outline / speaker notes document that summarizes the entire journey, technical decisions, and architecture for a university presentation.

Execution Steps:

Create the Document:
Create a new file named ELOADAS_VAZLAT.md (Presentation Outline) in the root directory.
The content MUST be written in professional Hungarian, tailored for an academic/engineering audience.

Structure of the Presentation:
Include the following sections with bullet points and clear, easy-to-present explanations:

1. Bevezetés és Projekt Célja: Brief overview of PollHub, the core problem it solves, and the MVP scope (1 poll = 1 question).

2. Technológiai Stack: Highlight Next.js (App Router), Tailwind CSS, TypeScript, and why we chose localStorage + React Context for MVP state instead of a heavy backend.

3. Architektúra (Domain-Driven Design): Explain the separation of Kérdőív (Poll) and Kérdés (Question) entities. Highlight the pragmatic "Lightweight Value Object" approach used for the Lezárási idő (Closing Time).

4. Komplex Funkciók (Vizualizáció és AI):

Explain the Recharts integration (handling ties, dynamic bar scaling).

Detail the "Simulated AI Insights" trick: how we dynamically generate fake LLM summaries based on real aggregated data and the active language (i18n), complete with artificial delay, avoiding external API costs.

5. Kétnyelvűség (i18n): Briefly mention the upgrade to next-intl for App Router-compatible localized routing.

6. Minőségbiztosítás (QA & Clean Code): Emphasize the 20 robust Playwright E2E tests, covering business rules (one vote per user, closed poll rejections).

7. Az MVP korlátai és a jövő: A transparent, honest academic conclusion about the current mock authentication (userId) and the next steps for a real backend.

Tone & Formatting:

Use Markdown headers, bold text for emphasis, and bullet points so it is easy to read aloud during a presentation.

Keep the tone confident, engineering-focused, and academic.

Git Operations:

Add, commit (docs: create presentation summary for project defense), and push the file to main autonomously.
```

**Outcome:** Created `ELOADAS_VAZLAT.md` in Hungarian, with all 7 requested sections, speaker notes, a live-demo script and expected Q&A. Facts were checked against the code: 20 core E2E tests + 4 i18n + 4 theme = 28 scenarios × 2 locales = 56 runs, the 7-day default and 2-second AI delay, consensus thresholds of 30/15 points with a low-sample caveat under 5 votes, `proxy.ts`, and UI strings quoted from `messages/hu.json`. The doc says there's no coverage measurement rather than claiming "100% coverage", and lists the test flakiness among the limitations. Committed and pushed only the outline and this log; the Prompt 13 theme-script fix is still uncommitted.

### Prompt 16

**Model:** Claude Opus 5.5 (`claude-opus-5-5`)

```
Role: QA Engineer & Technical Presenter
Task: Generate a step-by-step Demo Script (Walkthrough) document in Hungarian for the final presentation.

Context:
We need a detailed, foolproof guide that walks the presenter through a live demo of the PollHub web application, ensuring every feature, business rule, and UI polish is showcased perfectly to the university assessors.

Execution Steps:

Create the Document:
Create a new file named DEMO_FORGATOKONYV.md in the root directory.

Structure the Walkthrough:
The document MUST be written in professional Hungarian, structured as a chronological script. Use clear formatting (bolding for buttons to click, italic for what to say/explain). Include the following flow:

0. Előkészületek (Preparation): Starting the dev server and opening the browser.

1. Kezdőképernyő és Kétnyelvűség (UI & i18n): Showing the polished UI and toggling the language (EN/HU) in the Navbar to demonstrate the next-intl integration.

2. Kérdőív Létrehozása (Manager Workflow): Switching to the "Manager" role. Creating a new poll (filling in Title, Question, Options, and demonstrating the Closing Time feature).

3. Szavazás és Üzleti Szabályok (Participant Workflow): Switching to "Participant". Opening the newly created poll. Casting a vote. Crucial: Trying to vote again to demonstrate the strict "one vote per user" business rule and the disabled UI.

4. Vizualizáció és AI Szimuláció (Results & Dashboard): Navigating to the Results view. Showcasing the Recharts bar chart (hovering for tooltips, showing the responsive design). Explaining the KPI cards. Highlight: Pointing out the "AI Insights" component, emphasizing the 2-second simulated loading skeleton, and reading the dynamically generated, localized text.

5. Szavazás Lezárása (Closing Rule): Switching back to Manager, clicking "Close Poll" (or letting the timer run out). Switching to Participant to prove that a closed poll completely disables the voting form.

Tone and Formatting:
Make it easy to read while presenting. Use check-boxes (- [ ]) for each major action so the presenter can track their progress during practice.

Git Operations:

Add, commit (docs: create step-by-step demo walkthrough script), and push the file to main autonomously.
```

**Outcome:** Dry-ran the full demo flow with the Playwright MCP on the dev server, then wrote `DEMO_FORGATOKONYV.md` in Hungarian: steps 0–5 plus a closing section, checkboxes, the exact on-screen labels, a script for what to say, a troubleshooting table, and a practice checklist. Adjustments to match the real app: after voting, the form is replaced by the confirmation (there is no disabled form to retry); results are on the poll page, not a separate view; the seeded "Onboarding feedback" poll is used for a richer chart and AI text; the auto-close timer is offered as an option. Found while checking: `/` redirects to the remembered locale, so the script opens `/hu`. After a full reload, the list briefly shows only the seed polls until localStorage loads; this is noted as a presenter tip and is an MVP limitation. Committed and pushed only the script and this log; the Prompt 13 theme-script fix is still uncommitted.
