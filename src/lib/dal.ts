/**
 * Data Access Layer: the only place that reads the session or the database for
 * rendering. Every page and Server Action authorizes through here, so a check
 * can't be forgotten in one entry point (see the Next.js authentication guide).
 */
import "server-only";
import { cache } from "react";
import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CurrentUser, PollDetail, PollSummary, UserRole } from "@/types";

/**
 * The signed-in user, or null. A session token stays valid after its user is
 * deleted (e.g. by a reseed), so the user is also looked up in the database.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  });
});

/** For pages: the signed-in user, or a redirect to the login page. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    return redirect({ href: "/login", locale: await getLocale() });
  }
  return user;
}

/** For pages: a user with the given role; anyone else goes to the home page. */
export async function requireRole(role: UserRole): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== role) {
    return redirect({ href: "/", locale: await getLocale() });
  }
  return user;
}

export const getPollSummaries = cache(async (userId: string): Promise<PollSummary[]> => {
  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      questions: {
        take: 1,
        include: { _count: { select: { options: true, votes: true } } },
      },
      votes: { where: { userId }, select: { id: true }, take: 1 },
    },
  });

  return polls.flatMap(({ id, title, closesAt, questions, votes }) => {
    const question = questions[0];
    if (!question) return [];
    return [
      {
        poll: { id, title, closesAt: closesAt.getTime() },
        optionCount: question._count.options,
        totalVotes: question._count.votes,
        hasVoted: votes.length > 0,
      },
    ];
  });
});

export const getPollDetail = cache(
  async (pollId: string, userId: string): Promise<PollDetail | null> => {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        // Each poll has exactly one question for now.
        questions: {
          take: 1,
          include: {
            options: {
              orderBy: { position: "asc" },
              include: { _count: { select: { votes: true } } },
            },
          },
        },
        votes: { where: { userId }, select: { id: true }, take: 1 },
      },
    });
    const question = poll?.questions[0];
    if (!poll || !question) return null;

    const results = question.options.map(({ id, text, _count }) => ({
      option: { id, text },
      count: _count.votes,
    }));

    return {
      poll: { id: poll.id, title: poll.title, closesAt: poll.closesAt.getTime() },
      question: {
        id: question.id,
        pollId: poll.id,
        text: question.text,
        options: results.map(({ option }) => option),
      },
      results,
      totalVotes: results.reduce((sum, { count }) => sum + count, 0),
      hasVoted: poll.votes.length > 0,
    };
  }
);

/** One timestamp per request, shared by everything rendered for it. */
export const getRequestTime = cache(() => Date.now());
