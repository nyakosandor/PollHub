import { AlertCircle } from "lucide-react";

/** An error message under a form; `error` is the key tests match on. */
export default function FormError({ error, message }: { error: string; message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-600/15 ring-inset dark:bg-red-500/10 dark:ring-red-400/25">
      <AlertCircle
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
      />
      <p
        role="alert"
        data-testid="auth-error"
        data-error={error}
        className="text-sm font-medium text-red-700 dark:text-red-300"
      >
        {message}
      </p>
    </div>
  );
}
