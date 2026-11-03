"use client";

import {
  Bar,
  BarChart,
  LabelList,
  Rectangle,
  ResponsiveContainer,
  Text,
  Tooltip,
  TooltipContentProps,
  XAxis,
  YAxis,
  usePlotArea,
} from "recharts";
import { useTranslations } from "next-intl";
import { PollResult } from "@/types";
import { toPercent } from "@/lib/format";
import { getLeaders, rankResults } from "@/lib/results";

const LEADER_COLOR = "#2a78d6";
const OTHER_COLOR = "#c3c2b7";
const ROW_HEIGHT_PX = 56;
const BAR_THICKNESS_PX = 20;
const CHART_MARGIN = { top: 0, right: 48, left: 0, bottom: 0 };

interface ChartRow {
  optionId: string;
  name: string;
  count: number;
  share: number;
  isLeader: boolean;
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const t = useTranslations("results");
  const row: ChartRow | undefined = payload?.[0]?.payload;
  if (!active || !row) return null;
  const { name, count, share } = row;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-900">{share}%</p>
      <p className="text-slate-600">{name}</p>
      <p className="text-slate-500">{t("votes", { count })}</p>
    </div>
  );
}

/**
 * Sits above its bar and takes the full plot width, so long option names keep
 * their room on narrow screens instead of squeezing the bars beside them.
 */
function OptionNameLabel({
  x,
  y,
  value,
}: {
  x?: number | string;
  y?: number | string;
  value?: number | string | boolean | null;
}) {
  const plotArea = usePlotArea();
  return (
    <Text
      x={Number(x)}
      y={Number(y) - 6}
      width={plotArea?.width}
      maxLines={1}
      fontSize={13}
      fill="#0f172a"
    >
      {String(value)}
    </Text>
  );
}

interface ResultsChartProps {
  results: PollResult[];
  totalVotes: number;
}

export default function ResultsChart({ results, totalVotes }: ResultsChartProps) {
  const t = useTranslations("results");

  if (totalVotes === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        {t("noVotes")}
      </div>
    );
  }

  const leaders = getLeaders(results);
  const rows: ChartRow[] = rankResults(results).map((result) => ({
    optionId: result.option.id,
    name: result.option.text,
    count: result.count,
    share: toPercent(result.count, totalVotes),
    isLeader: leaders.includes(result),
  }));

  return (
    <div style={{ height: rows.length * ROW_HEIGHT_PX }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={CHART_MARGIN}
          barSize={BAR_THICKNESS_PX}
        >
          <XAxis
            type="number"
            hide
            domain={[0, Math.max(...rows.map(({ share }) => share))]}
          />
          <YAxis type="category" dataKey="optionId" hide />
          <Tooltip
            content={(props) => <ChartTooltip {...props} />}
            cursor={{ fill: "rgba(42,120,214,0.06)" }}
          />
          <Bar
            dataKey="share"
            radius={[0, 4, 4, 0]}
            shape={(props) => (
              <Rectangle
                {...props}
                fill={props.payload.isLeader ? LEADER_COLOR : OTHER_COLOR}
              />
            )}
          >
            <LabelList dataKey="name" content={OptionNameLabel} />
            <LabelList
              dataKey="share"
              position="right"
              formatter={(share) => `${share}%`}
              fontSize={13}
              fontWeight={600}
              fill="#334155"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
