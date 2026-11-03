import { useTranslations } from "next-intl";
import { CircleOff } from "lucide-react";

export default function StatusBadge({ isClosed }: { isClosed: boolean }) {
  const t = useTranslations("status");

  return (
    <span
      data-testid="status-badge"
      data-status={isClosed ? "closed" : "open"}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
        isClosed
          ? "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
          : "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30"
      }`}
    >
      {isClosed ? (
        <CircleOff aria-hidden="true" className="h-3 w-3" />
      ) : (
        <span aria-hidden="true" className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      )}
      {isClosed ? t("closed") : t("open")}
    </span>
  );
}
