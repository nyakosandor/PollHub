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
    <details className="mt-3 text-sm">
      <summary
        data-testid="results-table-toggle"
        className="w-fit cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700"
      >
        {t("viewTable")}
      </summary>
      <table className="mt-2 w-full text-left">
        <thead className="text-xs text-slate-500">
          <tr className="border-b border-slate-200">
            <th scope="col" className="py-2 font-medium">{t("table.option")}</th>
            <th scope="col" className="py-2 text-right font-medium">{t("table.votes")}</th>
            <th scope="col" className="py-2 text-right font-medium">{t("table.share")}</th>
          </tr>
        </thead>
        <tbody className="text-slate-700">
          {rankResults(results).map(({ option, count }) => (
            <tr key={option.id} className="border-b border-slate-100">
              <td className="py-2 pr-3 break-words">{option.text}</td>
              <td className="py-2 text-right tabular-nums">{count}</td>
              <td className="py-2 text-right tabular-nums">
                {toPercent(count, totalVotes)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
