/** Whole-number WPM for display. */
export const roundWpm = (wpm) => Math.round(wpm);

/**
 * Accuracy rounded for display: a whole percent, but never "100" unless it really
 * is 100% (99.7% should not read as perfect). `null` means "nothing typed yet".
 */
export function roundAccuracy(accuracy) {
  if (accuracy === null || accuracy === undefined || Number.isNaN(accuracy)) return null;
  if (accuracy >= 100) return 100;
  return Math.min(99, Math.round(accuracy));
}

export const formatAccuracy = (rounded) => (rounded === null ? '—' : `${rounded}%`);
