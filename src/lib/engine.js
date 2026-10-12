import { MAX_EXTRA_CHARS, TEST_DURATION_MS } from '../config.js';

/**
 * Pure typing-test state machine. No timers, no DOM: every action that depends on
 * time carries its own timestamp (`now`, from performance.now()), which keeps the
 * logic deterministic and easy to test.
 *
 * state = {
 *   status:    'idle' | 'running' | 'finished'
 *   words:     string[]            the passage
 *   committed: string[]            text typed into each finished word (words[0..n-1])
 *   current:   string              text typed into the active word (words[n])
 *   startedAt: number | null       timestamp of the first valid character
 *   endedAt:   number | null       startedAt + 60 s once finished
 *   keys:      { correct, total }  printable keystrokes, judged when pressed
 * }
 */

export function createState(words) {
  return {
    status: 'idle',
    words,
    committed: [],
    current: '',
    startedAt: null,
    endedAt: null,
    keys: { correct: 0, total: 0 },
  };
}

/** Elapsed test time in ms, always derived from timestamps and capped at the duration. */
export function getElapsedMs(state, now) {
  if (state.status === 'idle') return 0;
  if (state.status === 'finished') return TEST_DURATION_MS;
  return Math.min(Math.max(now - state.startedAt, 0), TEST_DURATION_MS);
}

function finish(state) {
  if (state.status !== 'running') return state;
  return { ...state, status: 'finished', endedAt: state.startedAt + TEST_DURATION_MS };
}

function isExpired(state, now) {
  return state.status === 'running' && now - state.startedAt >= TEST_DURATION_MS;
}

/** Accepts one printable UTF-16 unit. Any whitespace is treated as the word separator. */
function normalizeChar(ch) {
  if (typeof ch !== 'string' || ch.length !== 1) return null;
  if (/\s/.test(ch)) return ' ';
  const code = ch.charCodeAt(0);
  if (code < 32 || (code >= 127 && code <= 159)) return null;
  return ch;
}

function typeChar(state, rawChar, now) {
  const ch = normalizeChar(rawChar);
  if (ch === null || state.status === 'finished') return state;
  if (isExpired(state, now)) return finish(state);

  const target = state.words[state.committed.length] ?? '';

  if (ch === ' ') {
    // A space only ends a word that has something in it; it never starts the test.
    if (state.current === '') return state;
    const exact = state.current === target;
    return {
      ...state,
      committed: [...state.committed, state.current],
      current: '',
      keys: { correct: state.keys.correct + (exact ? 1 : 0), total: state.keys.total + 1 },
    };
  }

  if (state.current.length >= target.length + MAX_EXTRA_CHARS) return state;

  const correct = ch === target[state.current.length];
  const started = state.status === 'idle';
  return {
    ...state,
    status: 'running',
    startedAt: started ? now : state.startedAt,
    current: state.current + ch,
    keys: { correct: state.keys.correct + (correct ? 1 : 0), total: state.keys.total + 1 },
  };
}

function backspace(state, now, wholeWord) {
  if (state.status !== 'running') return state;
  if (isExpired(state, now)) return finish(state);

  if (state.current !== '') {
    return { ...state, current: wholeWord ? '' : state.current.slice(0, -1) };
  }

  // At the start of a word: step back into the previous word, but only to fix a mistake.
  const last = state.committed.length - 1;
  if (last >= 0 && state.committed[last] !== state.words[last]) {
    return { ...state, committed: state.committed.slice(0, last), current: state.committed[last] };
  }
  return state;
}

export function reducer(state, action) {
  switch (action.type) {
    case 'type':
      return typeChar(state, action.ch, action.now);
    case 'backspace':
      return backspace(state, action.now, false);
    case 'clearWord':
      return backspace(state, action.now, true);
    case 'tick':
      return isExpired(state, action.now) ? finish(state) : state;
    case 'extend':
      return { ...state, words: [...state.words, ...action.words] };
    case 'reset':
      return createState(action.words);
    default:
      return state;
  }
}
