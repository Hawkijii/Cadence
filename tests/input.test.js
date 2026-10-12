import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, reducer } from '../src/lib/engine.js';
import { SENTINEL, actionsForInput, inputValueFor } from '../src/lib/input.js';
import { formatAccuracy, roundAccuracy } from '../src/lib/format.js';

// Feeds a sequence of "the input now holds ..." values through the same
// diff-and-replay path the app uses, returning the final engine state.
function simulate(words, values, now = 1000) {
  let state = createState(words);
  for (const value of values) {
    for (const action of actionsForInput(state.current, value, now)) state = reducer(state, action);
  }
  return state;
}

test('the hidden input mirrors the active word behind a one-space sentinel', () => {
  assert.equal(inputValueFor(''), SENTINEL);
  assert.equal(inputValueFor('abc'), `${SENTINEL}abc`);
});

test('typing one character at a time is replayed as keystrokes', () => {
  const s = simulate(['the', 'cat'], [' t', ' th', ' the']);
  assert.equal(s.current, 'the');
  assert.deepEqual(s.keys, { correct: 3, total: 3 });
});

test('a trailing space ends the word and the field is re-synced to the sentinel', () => {
  const s = simulate(['the', 'cat'], [' t', ' th', ' the', ' the ']);
  assert.deepEqual(s.committed, ['the']);
  assert.equal(s.current, '');
  assert.deepEqual(s.keys, { correct: 4, total: 4 });
});

test('removing a character is a backspace and does not erase the mistake from accuracy', () => {
  const s = simulate(['the'], [' t', ' tx', ' t', ' th']);
  assert.equal(s.current, 'th');
  assert.deepEqual(s.keys, { correct: 2, total: 3 });
});

test('deleting the sentinel at the start of a word steps back into a wrong word only', () => {
  let s = simulate(['the', 'cat'], [' t', ' tx', ' tx ']);
  assert.deepEqual(s.committed, ['tx']);
  for (const a of actionsForInput('', '', 1000)) s = reducer(s, a);
  assert.deepEqual(s.committed, []);
  assert.equal(s.current, 'tx');

  s = simulate(['the', 'cat'], [' t', ' th', ' the', ' the ', '']); // correct word is locked
  assert.deepEqual(s.committed, ['the']);
  assert.equal(s.current, '');
});

test('clearing the whole field wipes the active word (ctrl+backspace, select-all delete)', () => {
  const s = simulate(['hello'], [' h', ' he', ' hel', '']);
  assert.equal(s.current, '');
});

test('autocorrect-style replacement is replayed as backspaces plus new keystrokes', () => {
  const actions = actionsForInput('teh', ' the', 5);
  assert.deepEqual(
    actions.map((a) => a.type),
    ['backspace', 'backspace', 'type', 'type'],
  );
  const s = simulate(['the'], [' t', ' te', ' teh', ' the']);
  assert.equal(s.current, 'the');
});

test('several characters arriving at once (composition commit) are all counted', () => {
  const s = simulate(['the', 'cat'], [' the cat']);
  assert.deepEqual(s.committed, ['the']);
  assert.equal(s.current, 'cat');
  assert.equal(s.keys.total, 7);
});

test('a space typed at the start of a word is ignored and never starts the test', () => {
  const s = simulate(['the'], ['  ']);
  assert.equal(s.status, 'idle');
  assert.equal(s.keys.total, 0);
});

test('input without the sentinel (e.g. after select-all + typing) is still handled', () => {
  const s = simulate(['the'], [' t', 'x']);
  assert.equal(s.current, 'x');
});

test('accuracy display never shows 100% unless it is exactly 100%', () => {
  assert.equal(roundAccuracy(100), 100);
  assert.equal(roundAccuracy(99.7), 99);
  assert.equal(roundAccuracy(97.4), 97);
  assert.equal(roundAccuracy(null), null);
  assert.equal(formatAccuracy(null), '—');
  assert.equal(formatAccuracy(98), '98%');
});
