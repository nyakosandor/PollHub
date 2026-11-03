/**
 * Demo data shared by the seed script (`npx prisma db seed`) and the E2E tests,
 * so both start from exactly the same database state.
 */
import bcrypt from "bcryptjs";
import type { PrismaClient } from "../src/generated/prisma/client";
import { DEMO_ACCOUNTS } from "../src/lib/demoAccounts";
import { PASSWORD_HASH_ROUNDS } from "../src/lib/password";
import type { UserRole } from "../src/types";

const findDemoAccount = (role: UserRole) => DEMO_ACCOUNTS.find((account) => account.role === role)!;

export const DEMO_USERS = {
  manager: findDemoAccount("MANAGER"),
  participant: findDemoAccount("PARTICIPANT"),
};

export type DemoUser = keyof typeof DEMO_USERS;

// Other participants whose votes make the closed poll's results interesting.
const SEED_VOTERS = ["voter1", "voter2", "voter3", "voter4"].map((name) => ({
  id: `seed-${name}`,
  email: `${name}@pollhub.local`,
  password: "Voter123!",
}));

const POLLS = [
  {
    id: "poll-1",
    title: "Next quarter priorities",
    // Fixed dates, not relative to now, so the demo looks the same every run.
    closesAt: new Date(Date.UTC(2030, 0, 1)),
    createdAt: new Date(Date.UTC(2026, 8, 2)),
    question: "Which feature should we prioritize next quarter?",
    options: ["Dark mode", "Mobile app", "API integrations", "Offline support"],
  },
  {
    id: "poll-2",
    title: "Onboarding feedback",
    closesAt: new Date(Date.UTC(2026, 8, 17)),
    createdAt: new Date(Date.UTC(2026, 8, 1)),
    question: "How satisfied are you with our onboarding experience?",
    options: ["Very satisfied", "Satisfied", "Neutral", "Unsatisfied"],
  },
];

// poll-2 results: Very satisfied 2, Satisfied 1, Neutral 1, Unsatisfied 0.
const POLL_2_VOTES: [voterIndex: number, optionNumber: number][] = [
  [0, 1],
  [1, 1],
  [2, 2],
  [3, 3],
];

const hashCache = new Map<string, Promise<string>>();
/** bcrypt is slow on purpose; tests reseed often, so hash each password once. */
const hashPassword = (password: string) => {
  if (!hashCache.has(password)) {
    hashCache.set(password, bcrypt.hash(password, PASSWORD_HASH_ROUNDS));
  }
  return hashCache.get(password)!;
};

/** Deletes every row, children first. */
export async function clearDatabase(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.vote.deleteMany(),
    prisma.option.deleteMany(),
    prisma.question.deleteMany(),
    prisma.poll.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

/** Inserts the demo users, polls and votes into an empty database. */
export async function seedDatabase(prisma: PrismaClient) {
  const users = [
    ...Object.values(DEMO_USERS).map((user) => ({ id: undefined, ...user })),
    ...SEED_VOTERS.map((voter) => ({ ...voter, role: "PARTICIPANT" as const })),
  ];
  for (const { id, email, password, role } of users) {
    await prisma.user.create({
      data: { id, email, role, password: await hashPassword(password) },
    });
  }

  for (const poll of POLLS) {
    await prisma.poll.create({
      data: {
        id: poll.id,
        title: poll.title,
        closesAt: poll.closesAt,
        createdAt: poll.createdAt,
        questions: {
          create: {
            id: `${poll.id}-q-1`,
            text: poll.question,
            options: {
              create: poll.options.map((text, index) => ({
                id: `${poll.id}-opt-${index + 1}`,
                text,
                position: index,
              })),
            },
          },
        },
      },
    });
  }

  await prisma.vote.createMany({
    data: POLL_2_VOTES.map(([voterIndex, optionNumber]) => ({
      userId: SEED_VOTERS[voterIndex].id,
      pollId: "poll-2",
      questionId: "poll-2-q-1",
      optionId: `poll-2-opt-${optionNumber}`,
    })),
  });
}

export async function resetDatabase(prisma: PrismaClient) {
  await clearDatabase(prisma);
  await seedDatabase(prisma);
}
