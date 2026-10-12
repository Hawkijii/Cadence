import { memo } from 'react';

/**
 * One word of the passage.
 *
 * `typed` is what has been entered for this word ('' while it is still upcoming) and
 * `state` is 'upcoming' | 'active' | 'done'. The component is memoised on those three
 * primitives, so a keystroke re-renders only the word being typed (two words when the
 * active word changes), never the whole passage.
 *
 * Each letter is one of:
 *   ok     typed and matches            bad    typed but wrong (the expected letter is shown)
 *   miss   skipped when the word was ended early
 *   extra  typed beyond the end of the word (the typed character is shown)
 */
function Word({ word, typed = '', state }) {
  const letters = [];

  for (let i = 0; i < word.length; i += 1) {
    let className = 'ch';
    if (i < typed.length) className += typed[i] === word[i] ? ' ch--ok' : ' ch--bad';
    else if (state === 'done') className += ' ch--miss';
    letters.push(
      <span key={i} className={className}>
        {word[i]}
      </span>,
    );
  }

  for (let i = word.length; i < typed.length; i += 1) {
    letters.push(
      <span key={i} className="ch ch--extra">
        {typed[i]}
      </span>,
    );
  }

  return <span className={`word word--${state}`}>{letters}</span>;
}

export default memo(Word);
