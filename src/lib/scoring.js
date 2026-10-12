/**
 * Scoring rules (one set of rules, used for both the live numbers and the results):
 *
 * CHARACTERS (what is on screen when the clock stops, or right now while typing)
 *   - A typed letter counts as correct if it matches the passage at that position,
 *     otherwise incorrect. Letters typed beyond the end of a word are incorrect.
 *   - The space that ends a word counts as 1 correct character if the word is
 *     exactly right, otherwise as 1 incorrect character (this is how skipped
 *     letters are penalised).
 *   - Backspace removes a character from the screen, so a mistake that has been
 *     fixed no longer counts as an incorrect character.
 *
 * WPM = (correct characters / 5) / elapsed minutes. It measures net output, so
 *   typing and deleting the same character repeatedly cannot inflate it.
 *
 * KEYSTROKES (every printable key press, judged at the moment it is pressed)
 *   - Correct if it matched the passage, incorrect otherwise. Backspace is not a
 *     keystroke and does not erase an earlier mistake.
 *
 * ACCURACY = correct keystrokes / all keystrokes. Fixed mistakes still count
 *   against accuracy, because they were still mistakes.
 */

export const CHARS_PER_WORD = 5;
const MS_PER_MINUTE = 60_000;

/** Standard five-character WPM. Returns 0 when there is no elapsed time or nothing correct. */
export function calculateWpm(correctChars, elapsedMs) {
  if (!(elapsedMs > 0) || !(correctChars > 0)) return 0;
  return correctChars / CHARS_PER_WORD / (elapsedMs / MS_PER_MINUTE);
}

/** Keystroke accuracy as a percentage, or null when nothing has been typed yet. */
export function calculateAccuracy(correctKeys, totalKeys) {
  if (!(totalKeys > 0)) return null;
  return (Math.min(correctKeys, totalKeys) / totalKeys) * 100;
}

/**
 * Counts correct/incorrect characters currently on screen.
 * `committed` holds the typed text of every finished word (words[0..committed.length-1]);
 * `current` is the text typed so far into the active word.
 */
export function countCharacters(words, committed, current) {
  let correct = 0;
  let incorrect = 0;

  for (let i = 0; i < committed.length; i += 1) {
    const typed = committed[i];
    const target = words[i];
    for (let j = 0; j < typed.length; j += 1) {
      if (typed[j] === target[j]) correct += 1;
      else incorrect += 1;
    }
    if (typed === target) correct += 1; // the word-ending space
    else incorrect += 1;
  }

  const target = words[committed.length] ?? '';
  for (let j = 0; j < current.length; j += 1) {
    if (current[j] === target[j]) correct += 1;
    else incorrect += 1;
  }

  return { correct, incorrect };
}

/** Everything the UI needs, from a typing state and the elapsed time in ms. */
export function summarize(state, elapsedMs) {
  const { correct, incorrect } = countCharacters(state.words, state.committed, state.current);
  return {
    wpm: calculateWpm(correct, elapsedMs),
    accuracy: calculateAccuracy(state.keys.correct, state.keys.total),
    correctChars: correct,
    incorrectChars: incorrect,
    correctKeys: state.keys.correct,
    totalKeys: state.keys.total,
    elapsedMs,
  };
}
