"use client";

import { FormEvent, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ShieldCheck, User, UserPlus } from "lucide-react";
import { register, RegisterError } from "@/actions/auth";
import FormError from "@/components/auth/FormError";
import { useIsHydrated } from "@/lib/clock";
import { BUTTON_PRIMARY, INPUT, LABEL } from "@/lib/ui";
import { MIN_PASSWORD_LENGTH, normalizeEmail, validateRegistration } from "@/lib/validation";
import { UserRole } from "@/types";

const ROLE_CHOICES: { role: UserRole; icon: typeof User }[] = [
  { role: "PARTICIPANT", icon: User },
  { role: "MANAGER", icon: ShieldCheck },
];

export default function RegisterForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("PARTICIPANT");
  const [error, setError] = useState<RegisterError | "signInFailed" | null>(null);
  const [isPending, startTransition] = useTransition();
  // Before hydration a click would submit natively and lose the checks.
  const isHydrated = useIsHydrated();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      email: normalizeEmail(String(form.get("email") ?? "")),
      password: String(form.get("password") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
      role,
    };

    // Instant feedback here; the Server Action validates again.
    const validationError = validateRegistration(input);
    setError(validationError);
    if (validationError) return;

    startTransition(async () => {
      const result = await register(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Sign the new account in straight away.
      const signInResult = await signIn("credentials", {
        email: input.email,
        password: input.password,
        redirect: false,
      });
      if (!signInResult?.ok) {
        setError("signInFailed");
        return;
      }
      router.replace(`/${locale}`);
      router.refresh();
    });
  };

  return (
    // POST, so even a native submit never puts the password in the URL.
    <form method="post" onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div>
        <label htmlFor="register-email" className={LABEL}>
          {t("email")}
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={t("emailPlaceholder")}
          className={INPUT}
        />
      </div>
      <div>
        <label htmlFor="register-password" className={LABEL}>
          {t("password")}
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          aria-describedby="register-password-hint"
          className={INPUT}
        />
        <p
          id="register-password-hint"
          className="mt-1.5 text-xs text-slate-500 dark:text-slate-400"
        >
          {t("passwordHint", { min: MIN_PASSWORD_LENGTH })}
        </p>
      </div>
      <div>
        <label htmlFor="register-confirm-password" className={LABEL}>
          {t("confirmPassword")}
        </label>
        <input
          id="register-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className={INPUT}
        />
      </div>

      <fieldset>
        <legend className={LABEL}>{t("role")}</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {ROLE_CHOICES.map(({ role: choice, icon: Icon }) => (
            <label
              key={choice}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary-500/40 ${
                role === choice
                  ? "border-primary-500 bg-primary-50 shadow-sm dark:border-primary-400 dark:bg-primary-500/10"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800/60"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={choice}
                checked={role === choice}
                onChange={() => setRole(choice)}
                data-testid={`register-role-${choice}`}
                className="sr-only"
              />
              <Icon
                aria-hidden="true"
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  role === choice
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              />
              <span>
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                  {t(`roles.${choice}.title`)}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                  {t(`roles.${choice}.description`)}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <FormError error={error} message={t(`errors.${error}`)} />}

      <button
        type="submit"
        data-testid="register-submit"
        disabled={!isHydrated || isPending}
        className={`${BUTTON_PRIMARY} w-full py-3`}
      >
        <UserPlus aria-hidden="true" className="h-4 w-4" />
        {t("registerSubmit")}
      </button>
    </form>
  );
}
