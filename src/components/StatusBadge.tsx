import { PollStatus } from "@/types";
import { Circle, CircleOff } from "lucide-react";

export default function StatusBadge({ status }: { status: PollStatus }) {
  const isOpen = status === "open";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        isOpen
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
      }`}
    >
      {isOpen ? (
        <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
      ) : (
        <CircleOff className="h-3 w-3" />
      )}
      {isOpen ? "Open" : "Closed"}
    </span>
  );
}
