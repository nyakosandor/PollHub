"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Poll, Question } from "@/types";
import { usePolls } from "@/context/PollContext";
import { BUTTON_PRIMARY } from "@/lib/ui";
import { CheckCircle2, Lock, Send } from "lucide-react";

interface VoteFormProps {
  poll: Poll;
  question: Question;
}

export default function VoteForm({ poll, question }: VoteFormProps) {
  const t = useTranslations("vote");
  const { castVote, hasVoted, isPollClosed } = usePolls();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [justVoted, setJustVoted] = useState(false);

  const isVoted = hasVoted(poll.id);
  const isClosed = isPollClosed(poll);
  const canVote = !isVoted && !isClosed;

  const handleSubmit = () => {
    if (!selectedOptionId || !canVote) return;
    castVote(question.id, selectedOptionId);
    setJustVoted(true);
  };

  if (isClosed) {
    return (
      <div
        data-testid="vote-closed"
        className="flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 ring-inset dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700"
      >
        <Lock aria-hidden="true" className="h-4 w-4 shrink-0" />
        {t("closed")}
      </div>
    );
  }

  if (isVoted) {
    return (
      <div
        data-testid="vote-confirmation"
        className="flex items-center gap-3 rounded-xl bg-primary-50 px-4 py-3.5 text-sm font-medium text-primary-800 ring-1 ring-primary-600/15 ring-inset dark:bg-primary-500/10 dark:text-primary-200 dark:ring-primary-400/25"
      >
        <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span>
          {justVoted && `${t("thanks")} `}
          {t("alreadyVoted")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base font-medium text-slate-700 dark:text-slate-200">
        {question.text}
      </p>
      <div className="flex flex-col gap-2.5">
        {question.options.map((option) => (
          <label
            key={option.id}
            className={`flex cursor-pointer items-center gap-3.5 rounded-xl border px-4 py-3.5 text-sm font-medium transition-all duration-200 focus-within:ring-2 focus-within:ring-primary-500/40 active:scale-[0.99] ${
              selectedOptionId === option.id
                ? "border-primary-500 bg-primary-50 text-primary-900 shadow-sm dark:border-primary-400 dark:bg-primary-500/10 dark:text-primary-100"
                : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800/60"
            }`}
          >
            <input
              type="radio"
              name="poll-option"
              value={option.id}
              checked={selectedOptionId === option.id}
              onChange={() => setSelectedOptionId(option.id)}
              className="h-4 w-4 shrink-0 accent-primary-600 outline-none"
            />
            {option.text}
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedOptionId}
        data-testid="submit-vote"
        className={`${BUTTON_PRIMARY} w-full py-3 sm:w-auto sm:self-start`}
      >
        <Send aria-hidden="true" className="h-4 w-4" />
        {t("submit")}
      </button>
    </div>
  );
}
