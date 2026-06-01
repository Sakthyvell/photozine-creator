import type { PropsWithChildren, ReactNode } from 'react';

type SectionCardProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  footer?: ReactNode;
}>;

export function SectionCard({
  eyebrow,
  title,
  description,
  footer,
  children,
}: SectionCardProps) {
  return (
    <article className="section-card">
      <div className="section-card__header">
        <p className="section-card__eyebrow">{eyebrow}</p>
        <h2 className="section-card__title">{title}</h2>
        <p className="section-card__description">{description}</p>
      </div>
      <div className="section-card__body">{children}</div>
      {footer ? <div className="section-card__footer">{footer}</div> : null}
    </article>
  );
}

