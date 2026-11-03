"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarClock } from "lucide-react";
import { Poll } from "@/types";
import Card from "@/components/Card";
import ClosePollButton from "@/components/ClosePollButton";
import StatusBadge from "@/components/StatusBadge";
import { formatClosingTime } from "@/lib/closingTime";
import { useIsClosed, useIsHydrated } from "@/lib/clock";

interface PollHeaderProps {
  poll: Poll;
  canClose: boolean;
}

export default function PollHeader({ poll, canClose }: PollHeaderProps) {
  const t = useTranslations("poll");
  const locale = useLocale();
  const isClosed = useIsClosed(poll.closesAt);
  // The date is shown in the browser's time zone, which the server can't
  // know, so it renders only after hydration.
  const isHydrated = useIsHydrated();

  return (
    <Card>
      <div className="mb-4">
        <StatusBadge isClosed={isClosed} />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
        {poll.title}
      </h1>
      <p className="mt-2 flex min-h-5 items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
        <CalendarClock aria-hidden="true" className="h-4 w-4" />
        {isHydrated &&
          t("closingTime", {
            isClosed: String(isClosed),
            date: formatClosingTime(poll.closesAt, locale),
          })}
      </p>
      {canClose && (
        <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
          <ClosePollButton poll={poll} />
        </div>
      )}
    </Card>
  );
}
