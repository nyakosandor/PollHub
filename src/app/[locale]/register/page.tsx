import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { Locale } from "@/i18n/routing";
import AuthCard from "@/components/auth/AuthCard";
import RegisterForm from "@/components/auth/RegisterForm";
import { getCurrentUser } from "@/lib/dal";

export default async function RegisterPage({ params }: PageProps<"/[locale]/register">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  if (await getCurrentUser()) redirect({ href: "/", locale: locale as Locale });

  const t = await getTranslations({ locale: locale as Locale, namespace: "auth" });

  return (
    <AuthCard
      title={t("registerTitle")}
      subtitle={t("registerSubtitle")}
      footer={
        <>
          {t("haveAccount")}{" "}
          <Link
            href="/login"
            data-testid="go-login"
            className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            {t("loginLink")}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
