import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { Locale } from "@/i18n/routing";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/dal";
import { DEMO_ACCOUNTS, showDemoAccounts } from "@/lib/demoAccounts";

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  if (await getCurrentUser()) redirect({ href: "/", locale: locale as Locale });

  const { callbackUrl } = await searchParams;
  const t = await getTranslations({ locale: locale as Locale, namespace: "auth" });

  return (
    <div className="flex flex-col gap-6">
      <AuthCard
        title={t("loginTitle")}
        subtitle={t("loginSubtitle")}
        footer={
          <>
            {t("noAccount")}{" "}
            <Link
              href="/register"
              data-testid="go-register"
              className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t("registerLink")}
            </Link>
          </>
        }
      >
        <LoginForm callbackUrl={typeof callbackUrl === "string" ? callbackUrl : undefined} />
      </AuthCard>

      {showDemoAccounts() && (
        <aside
          data-testid="demo-accounts"
          className="mx-auto w-full max-w-md rounded-2xl border border-dashed border-slate-300 px-5 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400"
        >
          <p className="mb-2 font-semibold text-slate-700 dark:text-slate-300">
            {t("demoAccounts")}
          </p>
          <ul className="space-y-1">
            {DEMO_ACCOUNTS.map(({ role, email, password }) => (
              <li key={email} className="flex flex-wrap gap-x-2">
                <span className="font-medium">{t(`roles.${role}.title`)}:</span>
                <code className="font-mono text-xs leading-5">{email}</code>
                <span aria-hidden="true">/</span>
                <code className="font-mono text-xs leading-5">{password}</code>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
