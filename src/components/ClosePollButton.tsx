"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Poll } from "@/types";
import { closePoll } from "@/actions/poll";
import { useIsClosed } from "@/lib/clock";
import { BUTTON_SECONDARY } from "@/lib/ui";
import { Lock } from "lucide-react";

export default function ClosePollButton({ poll }: { poll: Poll }) {
  const t = useTranslations("poll");
  const isClosed = useIsClosed(poll.closesAt);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await closePoll(poll.id);
        })
      }
      disabled={isClosed || isPending}
      data-testid="close-poll"
      className={`${BUTTON_SECONDARY} hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-300`}
    >
      <Lock aria-hidden="true" className="h-4 w-4" />
      {isClosed ? t("pollClosed") : t("closePoll")}
    </button>
  );
}
