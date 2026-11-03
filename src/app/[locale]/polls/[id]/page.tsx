import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Locale } from "@/i18n/routing";
import Card from "@/components/Card";
import PollHeader from "@/components/PollHeader";
import PollResults from "@/components/PollResults";
import VoteForm from "@/components/VoteForm";
import { getPollDetail, requireUser } from "@/lib/dal";
import { LINK_SUBTLE } from "@/lib/ui";

export default async function PollDetailPage({ params }: PageProps<"/[locale]/polls/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const user = await requireUser();
  const [t, detail] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "poll" }),
    getPollDetail(id, user.id),
  ]);
  if (!detail) notFound();

  const { poll, question, results, totalVotes, hasVoted } = detail;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className={`group ${LINK_SUBTLE}`}>
        <ArrowLeft
          aria-hidden="true"
          className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
        />
        {t("back")}
      </Link>

      <PollHeader poll={poll} canClose={user.role === "MANAGER"} />

      {/* Managers run polls; participants vote on them. */}
      {user.role === "PARTICIPANT" && (
        <Card title={t("castVote")}>
          <VoteForm poll={poll} question={question} hasVoted={hasVoted} />
        </Card>
      )}

      <PollResults poll={poll} question={question} results={results} totalVotes={totalVotes} />
    </div>
  );
}
