import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type CardProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function Card({ title, description, actions, className, children }: CardProps) {
  const hasHeader = title || description || actions;
  return (
    <section className={cn("ui-card", className)}>
      {hasHeader && (
        <header className="ui-card__header">
          <div>
            {title && <h2 className="ui-card__title">{title}</h2>}
            {description && <p className="ui-card__description">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
