/**
 * The hidden <input> that captures typing always holds the active word prefixed by
 * one space (the "sentinel"). Deleting the sentinel is how a backspace at the very
 * start of a word reaches us on virtual keyboards, which swallow Backspace on an
 * empty field. Everything the user types is read back as "the field's new value"
 * and diffed against the active word, so physical keyboards, mobile keyboards and
 * IME composition all go through the same path.
 */
export const SENTINEL = ' ';

/** What the hidden input should contain for a given active-word text. */
export const inputValueFor = (current) => SENTINEL + current;

/**
 * Translates "the input now holds `value`" into engine actions, given the text
 * currently typed into the active word. Only what changed is replayed: the
 * unchanged prefix is kept, removed characters become backspaces, and new
 * characters become keystrokes (a space ends the word, as usual).
 */
export function actionsForInput(current, value, now) {
  if (value === '') {
    // The sentinel itself was deleted.
    return [{ type: current === '' ? 'backspace' : 'clearWord', now }];
  }

  const text = value.startsWith(SENTINEL) ? value.slice(1) : value;

  let keep = 0;
  while (keep < current.length && keep < text.length && current[keep] === text[keep]) keep += 1;

  const actions = [];
  for (let i = current.length; i > keep; i -= 1) actions.push({ type: 'backspace', now });
  for (const ch of text.slice(keep)) actions.push({ type: 'type', ch, now });
  return actions;
}
