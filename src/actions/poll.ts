"use server";

import { refresh } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { normalizeNewPoll, PollValidationError, validatePoll } from "@/lib/validation";
import { NewPoll } from "@/types";

export type PollActionError = PollValidationError | "forbidden" | "notFound";

export type PollActionResult = { ok: true } | { ok: false; error: PollActionError };

/** Only managers create and close polls. */
async function isManager() {
  const user = await getCurrentUser();
  return user?.role === "MANAGER";
}

/** Creates a poll and its question as two related records. */
export async function createPoll(input: NewPoll): Promise<PollActionResult> {
  if (!(await isManager())) return { ok: false, error: "forbidden" };

  const poll = normalizeNewPoll(input);
  const error = validatePoll(poll, Date.now());
  if (error) return { ok: false, error };

  await prisma.poll.create({
    data: {
      title: poll.title,
      closesAt: new Date(poll.closesAt),
      questions: {
        create: {
          text: poll.questionText,
          options: {
            create: poll.optionTexts.map((text, position) => ({ text, position })),
          },
        },
      },
    },
  });

  refresh();
  return { ok: true };
}

/**
 * Closes a poll by moving its closing time to now. An already earlier closing
 * time is kept, so closing never reopens or extends a poll.
 */
export async function closePoll(pollId: string): Promise<PollActionResult> {
  if (!(await isManager())) return { ok: false, error: "forbidden" };

  const poll = await prisma.poll.findUnique({ where: { id: pollId }, select: { closesAt: true } });
  if (!poll) return { ok: false, error: "notFound" };

  const now = new Date();
  if (poll.closesAt > now) {
    await prisma.poll.update({ where: { id: pollId }, data: { closesAt: now } });
  }

  refresh();
  return { ok: true };
}
