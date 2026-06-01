type StatusBannerTone = 'warning' | 'success' | 'neutral';

type StatusBannerProps = {
  tone: StatusBannerTone;
  title: string;
  message: string;
  meta?: string;
};

export function StatusBanner({ tone, title, message, meta }: StatusBannerProps) {
  return (
    <section className={`status-banner status-banner--${tone}`} aria-live="polite">
      <div className="status-banner__copy">
        <p className="status-banner__eyebrow">Session status</p>
        <h2 className="status-banner__title">{title}</h2>
        <p className="status-banner__message">{message}</p>
      </div>
      {meta ? <p className="status-banner__meta">{meta}</p> : null}
    </section>
  );
}

