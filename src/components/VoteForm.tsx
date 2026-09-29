"use client";

import { useState } from "react";
import { Poll } from "@/types";
import { usePolls } from "@/context/PollContext";
import { CheckCircle2, Lock, Send } from "lucide-react";

export default function VoteForm({ poll }: { poll: Poll }) {
  const { castVote, hasVoted } = usePolls();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [justVoted, setJustVoted] = useState(false);

  const isVoted = hasVoted(poll.id);
  const isClosed = poll.status === "closed";
  const canVote = !isVoted && !isClosed;

  const handleSubmit = () => {
    if (!selectedOptionId || !canVote) return;
    castVote(poll.id, selectedOptionId);
    setJustVoted(true);
  };

  if (isClosed) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
        <Lock className="h-4 w-4" />
        This poll is closed. Voting is no longer available.
      </div>
    );
  }

  if (isVoted) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
        <CheckCircle2 className="h-4 w-4" />
        {justVoted ? "Thanks for voting! " : ""}Already voted — you can view the
        results below.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {poll.options.map((option) => (
          <label
            key={option.id}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
              selectedOptionId === option.id
                ? "border-indigo-400 bg-indigo-50 text-indigo-900"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name="poll-option"
              value={option.id}
              checked={selectedOptionId === option.id}
              onChange={() => setSelectedOptionId(option.id)}
              className="h-4 w-4 accent-indigo-600"
            />
            {option.text}
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedOptionId}
        className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <Send className="h-4 w-4" />
        Submit Vote
      </button>
    </div>
  );
}
