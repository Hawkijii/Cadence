import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAccuracy, calculateWpm, countCharacters } from '../src/lib/scoring.js';

test('WPM uses the five-character convention', () => {
  assert.equal(calculateWpm(300, 60_000), 60);
  assert.equal(calculateWpm(150, 30_000), 60);
  assert.equal(calculateWpm(5, 60_000), 1);
});

test('WPM is 0 (never NaN/Infinity) when time or correct characters are missing', () => {
  assert.equal(calculateWpm(100, 0), 0);
  assert.equal(calculateWpm(100, -5), 0);
  assert.equal(calculateWpm(100, NaN), 0);
  assert.equal(calculateWpm(0, 60_000), 0);
  assert.equal(calculateWpm(-3, 60_000), 0);
});

test('accuracy is correct keystrokes over all keystrokes', () => {
  assert.equal(calculateAccuracy(90, 100), 90);
  assert.equal(calculateAccuracy(100, 100), 100);
  assert.equal(calculateAccuracy(0, 10), 0);
});

test('accuracy is null for an empty input and never exceeds 100', () => {
  assert.equal(calculateAccuracy(0, 0), null);
  assert.equal(calculateAccuracy(5, 0), null);
  assert.equal(calculateAccuracy(12, 10), 100);
});

test('countCharacters: correct words, a substituted letter, and the active word', () => {
  const words = ['the', 'cat', 'sat'];
  // "the" ok (3 + space), "cxt" has one wrong letter and so a wrong space, "sa" in progress.
  const { correct, incorrect } = countCharacters(words, ['the', 'cxt'], 'sa');
  assert.equal(correct, 4 + 2 + 2);
  assert.equal(incorrect, 1 + 1);
});

test('countCharacters: skipping letters makes the word-ending space incorrect', () => {
  const { correct, incorrect } = countCharacters(['hello', 'world'], ['he'], '');
  assert.equal(correct, 2);
  assert.equal(incorrect, 1);
});

test('countCharacters: extra letters beyond the word are incorrect', () => {
  const { correct, incorrect } = countCharacters(['the', 'cat'], ['thee'], '');
  assert.equal(correct, 3);
  assert.equal(incorrect, 2); // the extra "e" and the space after a wrong word
});

test('countCharacters: empty input is all zeros', () => {
  assert.deepEqual(countCharacters(['the'], [], ''), { correct: 0, incorrect: 0 });
});
