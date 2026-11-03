"use client";

import { useTranslations } from "next-intl";
import { Poll } from "@/types";
import { usePolls } from "@/context/PollContext";
import { BUTTON_SECONDARY } from "@/lib/ui";
import { Lock } from "lucide-react";

export default function ClosePollButton({ poll }: { poll: Poll }) {
  const t = useTranslations("poll");
  const { closePoll, isPollClosed } = usePolls();
  const isClosed = isPollClosed(poll);

  return (
    <button
      type="button"
      onClick={() => closePoll(poll.id)}
      disabled={isClosed}
      data-testid="close-poll"
      className={`${BUTTON_SECONDARY} hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-300`}
    >
      <Lock aria-hidden="true" className="h-4 w-4" />
      {isClosed ? t("pollClosed") : t("closePoll")}
    </button>
  );
}
