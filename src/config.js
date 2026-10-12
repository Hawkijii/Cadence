// App-wide constants. The test length is fixed on purpose: no other durations.
export const TEST_DURATION_SECONDS = 60;
export const TEST_DURATION_MS = TEST_DURATION_SECONDS * 1000;

// Words generated up-front, and how many are appended when the typist gets close
// to the end of the passage (so even very fast typists never run out of words).
export const INITIAL_WORD_COUNT = 120;
export const WORDS_LOOKAHEAD = 40;
export const WORDS_EXTENSION = 60;

// Characters a user may type beyond the end of a word before further input is ignored.
export const MAX_EXTRA_CHARS = 8;

// The live WPM readout is measured over at least this long, so the first keystrokes
// ramp the number up instead of spiking (1 character after 50 ms would read 240 WPM).
// The final result always uses the full 60 s, so it is unaffected.
export const LIVE_WPM_MIN_ELAPSED_MS = 1000;

// How often the clock display refreshes. Scoring never depends on this: elapsed
// time is always derived from timestamps (performance.now()).
export const TICK_MS = 200;

// Footer "Support this project" link. Set VITE_SUPPORT_URL in a .env file to
// point it at your own Buy Me a Coffee page.
export const SUPPORT_URL =
  import.meta.env?.VITE_SUPPORT_URL || 'https://buymeacoffee.com/hawkiji/';
