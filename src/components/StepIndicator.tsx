export type StepState = 'complete' | 'current' | 'upcoming';

export type StepIndicatorItem = {
  key: string;
  label: string;
  state: StepState;
};

type StepIndicatorProps = {
  steps: StepIndicatorItem[];
  ariaLabel?: string;
};

export function StepIndicator({
  steps,
  ariaLabel = 'Main workflow',
}: StepIndicatorProps) {
  return (
    <nav className="step-indicator" aria-label={ariaLabel}>
      {steps.map((step, index) => (
        <div className="step-indicator__item" data-state={step.state} key={step.key}>
          <span className="step-indicator__index">{index + 1}</span>
          <span className="step-indicator__label">{step.label}</span>
        </div>
      ))}
    </nav>
  );
}

