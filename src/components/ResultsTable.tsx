import { useTranslations } from "next-intl";
import { PollResult } from "@/types";
import { toPercent } from "@/lib/format";
import { rankResults } from "@/lib/results";

interface ResultsTableProps {
  results: PollResult[];
  totalVotes: number;
}

export default function ResultsTable({ results, totalVotes }: ResultsTableProps) {
  const t = useTranslations("results");

  return (
    <details className="group mt-5 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
      <summary
        data-testid="results-table-toggle"
        className="w-fit cursor-pointer rounded-md text-sm font-medium text-slate-500 transition-colors duration-200 outline-none hover:text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:text-primary-400 dark:focus-visible:ring-offset-slate-900"
      >
        {t("viewTable")}
      </summary>
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-semibold">{t("table.option")}</th>
              <th scope="col" className="px-4 py-2.5 text-right font-semibold">{t("table.votes")}</th>
              <th scope="col" className="px-4 py-2.5 text-right font-semibold">{t("table.share")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800 dark:text-slate-300">
            {rankResults(results).map(({ option, count }) => (
              <tr
                key={option.id}
                className="transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <td className="px-4 py-2.5 break-words">{option.text}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{count}</td>
                <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                  {toPercent(count, totalVotes)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
