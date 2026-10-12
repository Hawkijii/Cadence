import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, getElapsedMs, reducer } from '../src/lib/engine.js';
import { summarize } from '../src/lib/scoring.js';
import { generateWords } from '../src/lib/passage.js';
import { WORDS } from '../src/data/words.js';
import { MAX_EXTRA_CHARS, TEST_DURATION_MS } from '../src/config.js';

const typeText = (state, text, now = 1000) =>
  [...text].reduce((s, ch) => reducer(s, { type: 'type', ch, now }), state);
const press = (state, type, now = 1000) => reducer(state, { type, now });

test('starts idle, and a leading space does not start the clock', () => {
  let s = createState(['the', 'cat']);
  assert.equal(s.status, 'idle');
  s = typeText(s, ' ');
  assert.equal(s.status, 'idle');
  assert.equal(s.startedAt, null);
  assert.equal(s.keys.total, 0);
});

test('the clock starts on the first valid printable character, not before', () => {
  let s = createState(['the', 'cat']);
  s = press(s, 'backspace', 500);
  s = press(s, 'tick', 600);
  assert.equal(s.status, 'idle');
  s = typeText(s, 't', 2500);
  assert.equal(s.status, 'running');
  assert.equal(s.startedAt, 2500);
});

test('control characters are ignored; other whitespace acts as a space', () => {
  let s = typeText(createState(['the', 'cat']), '\u0007');
  assert.equal(s.status, 'idle');
  s = typeText(s, 'the ');
  assert.deepEqual(s.committed, ['the']);
  assert.equal(s.keys.total, 4);
});

test('typing a passage correctly gives 100% accuracy', () => {
  const s = typeText(createState(['the', 'cat']), 'the cat');
  assert.deepEqual(s.committed, ['the']);
  assert.equal(s.current, 'cat');
  assert.deepEqual(s.keys, { correct: 7, total: 7 });
});

test('a fixed mistake still counts against accuracy but not against characters', () => {
  let s = createState(['the', 'cat']);
  s = typeText(s, 't');
  s = typeText(s, 'x'); // wrong
  s = press(s, 'backspace');
  s = typeText(s, 'h');
  assert.equal(s.current, 'th');
  assert.deepEqual(s.keys, { correct: 2, total: 3 });
  const r = summarize(s, 30_000);
  assert.equal(r.correctChars, 2);
  assert.equal(r.incorrectChars, 0);
  assert.ok(Math.abs(r.accuracy - 66.666) < 0.01);
});

test('repeatedly typing and deleting a correct letter cannot inflate WPM', () => {
  let s = typeText(createState(['the', 'cat']), 't');
  for (let i = 0; i < 20; i += 1) {
    s = press(s, 'backspace');
    s = typeText(s, 't');
  }
  assert.equal(summarize(s, 60_000).correctChars, 1);
});

test('backspace at the start of a word steps back only into a wrong word', () => {
  let s = typeText(createState(['the', 'cat']), 'thx ');
  assert.deepEqual(s.committed, ['thx']);
  s = press(s, 'backspace');
  assert.deepEqual(s.committed, []);
  assert.equal(s.current, 'thx');

  s = typeText(press(s, 'clearWord'), 'the ');
  assert.deepEqual(s.committed, ['the']);
  const after = press(s, 'backspace');
  assert.deepEqual(after.committed, ['the']);
  assert.equal(after.current, '');
});

test('clearWord (ctrl+backspace) wipes the active word', () => {
  const s = press(typeText(createState(['hello']), 'hel'), 'clearWord');
  assert.equal(s.current, '');
});

test('extra characters are accepted up to a cap, then ignored', () => {
  let s = typeText(createState(['the']), 'the' + 'z'.repeat(MAX_EXTRA_CHARS));
  assert.equal(s.current.length, 3 + MAX_EXTRA_CHARS);
  const total = s.keys.total;
  s = typeText(s, 'z');
  assert.equal(s.current.length, 3 + MAX_EXTRA_CHARS);
  assert.equal(s.keys.total, total);
});

test('a space ends a word only when the word is exact to count as a correct keystroke', () => {
  const s = typeText(createState(['hello', 'world']), 'he ');
  assert.deepEqual(s.committed, ['he']);
  assert.deepEqual(s.keys, { correct: 2, total: 3 });
});

test('the test finishes at exactly 60 s and rejects later input', () => {
  let s = typeText(createState(['the', 'cat']), 't', 1000);
  s = press(s, 'tick', 1000 + TEST_DURATION_MS - 1);
  assert.equal(s.status, 'running');
  s = press(s, 'tick', 1000 + TEST_DURATION_MS);
  assert.equal(s.status, 'finished');
  assert.equal(s.endedAt, 1000 + TEST_DURATION_MS);

  const frozen = typeText(s, 'h', 9999);
  assert.equal(frozen, s);
  assert.equal(press(s, 'backspace', 9999), s);
});

test('a keystroke arriving after the deadline finishes the test instead of counting', () => {
  let s = typeText(createState(['the', 'cat']), 't', 1000);
  s = typeText(s, 'h', 1000 + TEST_DURATION_MS + 5);
  assert.equal(s.status, 'finished');
  assert.equal(s.current, 't');
  assert.equal(s.keys.total, 1);
});

test('elapsed time is derived from timestamps and capped at 60 s', () => {
  const idle = createState(['the']);
  assert.equal(getElapsedMs(idle, 5000), 0);
  const run = typeText(idle, 't', 1000);
  assert.equal(getElapsedMs(run, 1000), 0);
  assert.equal(getElapsedMs(run, 4000), 3000);
  assert.equal(getElapsedMs(run, 1_000_000), TEST_DURATION_MS);
  assert.equal(getElapsedMs(press(run, 'tick', 1000 + TEST_DURATION_MS), 0), TEST_DURATION_MS);
});

test('final WPM and accuracy come from the real keystrokes, not placeholders', () => {
  const words = Array.from({ length: 25 }, () => 'abcd');
  const s = typeText(createState(words), 'abcd '.repeat(20), 1000);
  const r = summarize(s, TEST_DURATION_MS);
  assert.equal(r.correctChars, 100);
  assert.equal(r.incorrectChars, 0);
  assert.equal(r.wpm, 20);
  assert.equal(r.accuracy, 100);
  assert.equal(r.totalKeys, 100);
});

test('extend appends words and reset returns a fresh idle state', () => {
  let s = reducer(createState(['a']), { type: 'extend', words: ['b', 'c'] });
  assert.deepEqual(s.words, ['a', 'b', 'c']);
  s = reducer(typeText(s, 'a '), { type: 'reset', words: ['x'] });
  assert.deepEqual(s, createState(['x']));
});

test('passages are random common words without immediate repeats', () => {
  const words = generateWords(500, WORDS[0]);
  assert.equal(words.length, 500);
  assert.ok(words.every((w) => WORDS.includes(w)));
  assert.ok(words.every((w, i) => i === 0 || w !== words[i - 1]));
  assert.notDeepEqual(generateWords(30), generateWords(30));
});
