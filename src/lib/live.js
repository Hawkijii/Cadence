import { LIVE_WPM_MIN_ELAPSED_MS, TEST_DURATION_SECONDS } from '../config.js';
import { getElapsedMs } from './engine.js';
import { roundAccuracy, roundWpm } from './format.js';
import { summarize } from './scoring.js';

/**
 * The numbers shown while typing, in display form. They are primitives so React can
 * skip re-rendering the stats when nothing visible changed.
 *
 * Same scoring functions as the final results. The one difference is that live WPM is
 * measured over at least LIVE_WPM_MIN_ELAPSED_MS, so the first keystrokes ramp the
 * number up instead of spiking; once a second has passed the rules are identical.
 */
export function liveStats(state, now) {
  const elapsed = getElapsedMs(state, now);
  const summary = summarize(state, Math.max(elapsed, LIVE_WPM_MIN_ELAPSED_MS));
  return {
    timeLeft: Math.max(0, Math.ceil(TEST_DURATION_SECONDS - elapsed / 1000)),
    wpm: roundWpm(summary.wpm),
    accuracy: roundAccuracy(summary.accuracy),
  };
}

export const sameStats = (a, b) => a.timeLeft === b.timeLeft && a.wpm === b.wpm && a.accuracy === b.accuracy;
