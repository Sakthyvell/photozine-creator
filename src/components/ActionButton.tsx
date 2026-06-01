import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ActionButtonTone = 'primary' | 'secondary';

type ActionButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: ActionButtonTone;
  }
>;

export function ActionButton({
  children,
  className = '',
  tone = 'secondary',
  type = 'button',
  ...props
}: ActionButtonProps) {
  return (
    <button
      className={`action-button action-button--${tone} ${className}`.trim()}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

