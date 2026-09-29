import PollList from "@/components/PollList";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Polls</h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse all polls and cast your vote, or switch to Manager mode to
          create and manage polls.
        </p>
      </div>
      <PollList />
    </div>
  );
}
