import { WORDS } from '../data/words.js';

/**
 * Returns `count` random words, never repeating the same word twice in a row.
 * `previous` is the last word of an existing passage (used when extending it).
 */
export function generateWords(count, previous = '', random = Math.random) {
  const out = [];
  let last = previous;
  for (let i = 0; i < count; i += 1) {
    let word = WORDS[Math.floor(random() * WORDS.length)];
    // Re-roll (a bounded number of times) to avoid immediate repeats.
    for (let tries = 0; word === last && tries < 5; tries += 1) {
      word = WORDS[Math.floor(random() * WORDS.length)];
    }
    out.push(word);
    last = word;
  }
  return out;
}
