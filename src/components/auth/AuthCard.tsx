import { ReactNode } from "react";
import { ClipboardList } from "lucide-react";
import { CARD } from "@/lib/ui";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/** Shared frame of the login and registration pages. */
export default function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 text-white shadow-lg shadow-primary-600/30">
          <ClipboardList aria-hidden="true" className="h-6 w-6" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      <div className={`${CARD} p-6 sm:p-8`}>{children}</div>
      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</p>
    </div>
  );
}
