"use server";

import { refresh } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { isUniqueConstraintError } from "@/lib/dbErrors";
import { isClosed } from "@/lib/closingTime";

export type VoteError = "forbidden" | "notFound" | "pollClosed" | "alreadyVoted";

export type VoteResult = { ok: true } | { ok: false; error: VoteError };

/**
 * Records the signed-in participant's vote. Every rule is checked here on the
 * server; the UI hiding the form is only a convenience.
 */
export async function castVote(pollId: string, optionId: string): Promise<VoteResult> {
  const user = await getCurrentUser();
  if (user?.role !== "PARTICIPANT") return { ok: false, error: "forbidden" };

  // The option must belong to a question of this very poll.
  const option = await prisma.option.findUnique({
    where: { id: optionId },
    select: { questionId: true, question: { select: { poll: true } } },
  });
  const poll = option?.question.poll;
  if (!option || !poll || poll.id !== pollId) return { ok: false, error: "notFound" };

  if (isClosed(poll.closesAt.getTime(), Date.now())) {
    return { ok: false, error: "pollClosed" };
  }

  try {
    await prisma.vote.create({
      data: { userId: user.id, pollId, questionId: option.questionId, optionId },
    });
  } catch (error) {
    // The (userId, questionId) unique index rejects a second vote, even when
    // two requests race each other.
    if (isUniqueConstraintError(error)) {
      refresh();
      return { ok: false, error: "alreadyVoted" };
    }
    throw error;
  }

  refresh();
  return { ok: true };
}
