import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, reducer } from '../src/lib/engine.js';
import { liveStats, sameStats } from '../src/lib/live.js';

const typeText = (state, text, now) => [...text].reduce((s, ch) => reducer(s, { type: 'type', ch, now }), state);

test('idle: full clock, no WPM, no accuracy yet', () => {
  const stats = liveStats(createState(['the', 'cat']), 123456);
  assert.deepEqual(stats, { timeLeft: 60, wpm: 0, accuracy: null });
});

test('time left counts down from timestamps and never goes below zero', () => {
  const s = typeText(createState(['the', 'cat']), 't', 1000);
  assert.equal(liveStats(s, 1000).timeLeft, 60);
  assert.equal(liveStats(s, 1000 + 1).timeLeft, 60); // ceil: 59.999 s left still shows 60
  assert.equal(liveStats(s, 1000 + 1500).timeLeft, 59);
  assert.equal(liveStats(s, 1000 + 59_001).timeLeft, 1);
  assert.equal(liveStats(s, 1000 + 61_000).timeLeft, 0);
});

test('live WPM is measured over at least one second, so early keystrokes do not spike', () => {
  const words = Array.from({ length: 10 }, () => 'abcde');
  // 10 correct characters (9 letters + 1 space) 50 ms after the first keystroke.
  // Undamped: 10 / 5 / (0.05 s / 60) = 2400 WPM. Over the one-second floor: 10 / 5 / (1 / 60) = 120.
  const s = typeText(createState(words), 'abcde abcd', 1000);
  assert.equal(liveStats(s, 1050).wpm, 120);
});

test('after the first second live WPM follows the same formula as the final result', () => {
  const words = Array.from({ length: 25 }, () => 'abcd');
  const s = typeText(createState(words), 'abcd '.repeat(10), 1000); // 50 correct characters
  assert.equal(liveStats(s, 1000 + 30_000).wpm, 20); // 50 / 5 / 0.5 min
  assert.equal(liveStats(s, 1000 + 60_000).wpm, 10); // 50 / 5 / 1 min
});

test('accuracy appears with the first keystroke and drops with a wrong one', () => {
  const words = ['the', 'cat'];
  let s = typeText(createState(words), 't', 1000);
  assert.equal(liveStats(s, 2000).accuracy, 100);
  s = typeText(s, 'x', 1000);
  assert.equal(liveStats(s, 2000).accuracy, 50);
});

test('sameStats compares every displayed field', () => {
  const a = { timeLeft: 5, wpm: 40, accuracy: 98 };
  assert.ok(sameStats(a, { ...a }));
  assert.ok(!sameStats(a, { ...a, wpm: 41 }));
  assert.ok(!sameStats(a, { ...a, accuracy: null }));
  assert.ok(!sameStats(a, { ...a, timeLeft: 4 }));
});
