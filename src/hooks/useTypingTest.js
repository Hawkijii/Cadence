import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  INITIAL_WORD_COUNT,
  TEST_DURATION_MS,
  TICK_MS,
  WORDS_EXTENSION,
  WORDS_LOOKAHEAD,
} from '../config.js';
import { createState, reducer } from '../lib/engine.js';
import { actionsForInput } from '../lib/input.js';
import { liveStats, sameStats } from '../lib/live.js';
import { generateWords } from '../lib/passage.js';
import { summarize } from '../lib/scoring.js';

const freshState = () => createState(generateWords(INITIAL_WORD_COUNT));

/**
 * Connects the pure engine (src/lib/engine.js) to React.
 *
 * - The latest engine state lives in a ref, so input handlers and the timer never
 *   read a stale closure; React state is only a published copy used for rendering.
 * - There is exactly one interval, created when the status becomes 'running' and
 *   cleared by the effect cleanup when it leaves 'running' (finish, restart, unmount).
 * - Elapsed time always comes from performance.now() timestamps, never a counter.
 */
export function useTypingTest() {
  const [state, setState] = useState(freshState);
  const [live, setLive] = useState(() => liveStats(state, 0));
  const [runId, setRunId] = useState(0);
  const stateRef = useRef(state);

  const refreshLive = useCallback((next, now) => {
    const stats = liveStats(next, now);
    setLive((prev) => (sameStats(prev, stats) ? prev : stats));
  }, []);

  const publish = useCallback(
    (next, now) => {
      stateRef.current = next;
      setState(next);
      refreshLive(next, now);
    },
    [refreshLive],
  );

  const apply = useCallback(
    (actions, now) => {
      let next = actions.reduce(reducer, stateRef.current);
      // Keep the passage comfortably ahead of the typist.
      if (next.words.length - next.committed.length < WORDS_LOOKAHEAD) {
        const words = generateWords(WORDS_EXTENSION, next.words[next.words.length - 1]);
        next = reducer(next, { type: 'extend', words });
      }
      if (next === stateRef.current) {
        refreshLive(next, now);
      } else {
        publish(next, now);
      }
      return next;
    },
    [publish, refreshLive],
  );

  /**
   * Feeds the hidden input's new value into the test. Returns the text the active
   * word now holds, so the caller can keep the input in sync with the engine.
   */
  const handleInputValue = useCallback(
    (value) => {
      const now = performance.now();
      return apply(actionsForInput(stateRef.current.current, value, now), now).current;
    },
    [apply],
  );

  const restart = useCallback(() => {
    publish(reducer(stateRef.current, { type: 'reset', words: generateWords(INITIAL_WORD_COUNT) }), performance.now());
    setRunId((n) => n + 1);
  }, [publish]);

  // The clock: one interval while running. Each tick finishes the test once 60 s
  // of timestamp time has elapsed and otherwise just refreshes the live numbers.
  useEffect(() => {
    if (state.status !== 'running') return undefined;
    const id = setInterval(() => {
      const now = performance.now();
      apply([{ type: 'tick', now }], now);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [state.status, apply]);

  const results = useMemo(
    () => (state.status === 'finished' ? summarize(state, TEST_DURATION_MS) : null),
    [state],
  );

  return { state, live, results, runId, handleInputValue, restart };
}
