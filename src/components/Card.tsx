import { ReactNode } from "react";
import { CARD, SECTION_TITLE } from "@/lib/ui";

interface CardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function Card({ title, action, children }: CardProps) {
  return (
    <section className={`${CARD} p-6 sm:p-8`}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && <h2 className={SECTION_TITLE}>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
