"use client";

import { FormEvent, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LogIn } from "lucide-react";
import FormError from "@/components/auth/FormError";
import { safeCallbackUrl } from "@/lib/callbackUrl";
import { useIsHydrated } from "@/lib/clock";
import { BUTTON_PRIMARY, INPUT, LABEL } from "@/lib/ui";

export default function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<"invalidCredentials" | null>(null);
  const [isPending, startTransition] = useTransition();
  // Before hydration a click would submit natively and lose the checks.
  const isHydrated = useIsHydrated();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        redirect: false,
      });
      if (!result?.ok) {
        setError("invalidCredentials");
        return;
      }
      // Re-render the server components (navbar included) with the session.
      router.replace(safeCallbackUrl(callbackUrl, `/${locale}`));
      router.refresh();
    });
  };

  return (
    // POST, so even a native submit never puts the password in the URL.
    <form method="post" onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div>
        <label htmlFor="login-email" className={LABEL}>
          {t("email")}
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={t("emailPlaceholder")}
          className={INPUT}
        />
      </div>
      <div>
        <label htmlFor="login-password" className={LABEL}>
          {t("password")}
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={INPUT}
        />
      </div>

      {error && <FormError error={error} message={t(`errors.${error}`)} />}

      <button
        type="submit"
        data-testid="login-submit"
        disabled={!isHydrated || isPending}
        className={`${BUTTON_PRIMARY} w-full py-3`}
      >
        <LogIn aria-hidden="true" className="h-4 w-4" />
        {t("loginSubmit")}
      </button>
    </form>
  );
}
