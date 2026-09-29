"use client";

import { Poll } from "@/types";
import { usePolls } from "@/context/PollContext";
import { Lock } from "lucide-react";

export default function ClosePollButton({ poll }: { poll: Poll }) {
  const { closePoll } = usePolls();
  const isClosed = poll.status === "closed";

  return (
    <button
      type="button"
      onClick={() => closePoll(poll.id)}
      disabled={isClosed}
      className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Lock className="h-3.5 w-3.5" />
      {isClosed ? "Poll closed" : "Close poll"}
    </button>
  );
}
