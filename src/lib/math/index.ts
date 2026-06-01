export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function roundTo(value: number, precision = 0) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function padToMultiple(value: number, multiple: number) {
  if (multiple <= 0) {
    throw new Error('multiple must be greater than 0');
  }

  return Math.ceil(value / multiple) * multiple;
}

