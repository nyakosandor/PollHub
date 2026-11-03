import { UserRole } from "@/types";

/** Accounts created by `npx prisma db seed`, for local evaluation. */
export const DEMO_ACCOUNTS: { role: UserRole; email: string; password: string }[] = [
  { role: "MANAGER", email: "manager@pollhub.local", password: "Manager123!" },
  { role: "PARTICIPANT", email: "participant@pollhub.local", password: "Participant123!" },
];

/** Listed on the login page only when the environment opts in. */
export const showDemoAccounts = () => process.env.SHOW_DEMO_ACCOUNTS === "true";
