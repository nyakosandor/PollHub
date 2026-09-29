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
