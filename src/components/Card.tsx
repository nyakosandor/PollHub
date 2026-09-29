import { ReactNode } from "react";

interface CardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function Card({ title, action, children }: CardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && (
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
