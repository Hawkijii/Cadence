import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { inputValueFor, SENTINEL } from '../lib/input.js';
import Word from './Word.jsx';
import './TypingArea.css';

const NAVIGATION_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']);
const block = (event) => event.preventDefault();

/**
 * The passage, the caret and the hidden input that captures typing.
 *
 * Input: one visually hidden <input> mirrors the active word (see lib/input.js). It is
 * focused automatically, refocused by clicking anywhere on the passage or pressing a
 * key, and works the same for physical and virtual keyboards.
 *
 * Rendering: words are memoised (see Word.jsx). The caret and the 3-line scroll are
 * positioned imperatively from the DOM, so moving them never triggers a React render.
 */
export default function TypingArea({ state, runId, inputRef, onInputValue, onRestart }) {
  const { words, committed, current, status } = state;
  const activeIndex = committed.length;
  const [focused, setFocused] = useState(false);

  const wordsRef = useRef(null);
  const viewportRef = useRef(null);
  const caretRef = useRef(null);
  const lineHeightRef = useRef(0);
  const typedLengthRef = useRef(0);
  const lastRunRef = useRef(runId);

  // Positions the caret and scrolls the 3-line window so the active line stays in the middle row.
  const place = useCallback((snap = false) => {
    const wordsEl = wordsRef.current;
    const caret = caretRef.current;
    const wordEl = wordsEl?.querySelector('.word--active');
    if (!wordEl || !caret) return;

    if (!lineHeightRef.current) {
      lineHeightRef.current = parseFloat(getComputedStyle(wordsEl).lineHeight) || wordEl.offsetHeight;
    }
    const lineHeight = lineHeightRef.current;

    const letters = wordEl.children;
    const typed = typedLengthRef.current;
    const atEnd = typed >= letters.length;
    const anchor = letters[atEnd ? letters.length - 1 : typed];

    const line = Math.round(wordEl.offsetTop / lineHeight);
    const shift = Math.max(0, line - 1) * lineHeight;
    const x = anchor.offsetLeft + (atEnd ? anchor.offsetWidth : 0);
    const y = anchor.offsetTop + (anchor.offsetHeight - caret.offsetHeight) / 2;

    if (snap) {
      wordsEl.style.transition = 'none';
      caret.style.transition = 'none';
    }
    wordsEl.style.transform = `translate3d(0, ${-shift}px, 0)`;
    caret.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (snap) {
      void wordsEl.offsetWidth; // commit the un-animated position before re-enabling transitions
      wordsEl.style.transition = '';
      caret.style.transition = '';
    }
  }, []);

  // After every keystroke (and a restart): sync the hidden input, then move the caret.
  useLayoutEffect(() => {
    const input = inputRef.current;
    const wanted = inputValueFor(current);
    if (input && input.value !== wanted) input.value = wanted;

    typedLengthRef.current = current.length;
    const snap = lastRunRef.current !== runId;
    lastRunRef.current = runId;
    place(snap);
  }, [current, activeIndex, runId, inputRef, place]);

  // Re-measure when the layout changes (window resize, font size clamp, fonts arriving).
  useEffect(() => {
    const remeasure = () => {
      lineHeightRef.current = 0;
      place(true);
    };
    const observer = new ResizeObserver(remeasure);
    if (viewportRef.current) observer.observe(viewportRef.current);
    document.fonts?.ready.then(remeasure);
    return () => observer.disconnect();
  }, [place]);

  // Pressing a printable key while nothing is focused sends it to the typing area.
  useEffect(() => {
    if (status === 'finished') return undefined;
    const onKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
      if (document.activeElement && document.activeElement !== document.body) return;
      inputRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [status, inputRef]);

  const focusInput = () => inputRef.current?.focus({ preventScroll: true });

  const handleInput = (event) => {
    const input = event.currentTarget;
    const active = onInputValue(input.value);
    const wanted = inputValueFor(active);
    if (input.value !== wanted) input.value = wanted; // keep the mirror exact (also pins the cursor to the end)
  };

  const handleKeyDown = (event) => {
    const plain = !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;

    // Tab restarts once there is something to restart. While the test is idle it keeps its
    // normal job of moving focus, and Shift+Tab always does, so keyboard users are never trapped.
    if (event.key === 'Tab' && plain && status !== 'idle') {
      event.preventDefault();
      onRestart();
      return;
    }
    // The field is only a capture surface: no cursor movement, select-all or undo inside it.
    if (NAVIGATION_KEYS.has(event.key) || event.key === 'Enter') {
      event.preventDefault();
    } else if ((event.ctrlKey || event.metaKey) && ['a', 'z', 'y'].includes(event.key.toLowerCase())) {
      event.preventDefault();
    }
  };

  return (
    <div
      className="typing"
      role="group"
      aria-label="Typing test"
      data-status={status}
      data-focused={focused}
      onMouseDown={(event) => {
        event.preventDefault(); // keep focus from bouncing to <body> before we set it
        focusInput();
      }}
      onClick={focusInput}
    >
      <div className="typing__viewport" ref={viewportRef} aria-hidden="true">
        <div className="typing__words" ref={wordsRef}>
          <span className="caret" ref={caretRef} />
          {words.map((word, i) => (
            <Word
              key={i}
              word={word}
              typed={i < activeIndex ? committed[i] : i === activeIndex ? current : undefined}
              state={i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'upcoming'}
            />
          ))}
        </div>
      </div>

      <div className="typing__veil" aria-hidden="true">
        Click here or press any key to focus
      </div>

      <input
        ref={inputRef}
        className="typing__input"
        type="text"
        aria-label="Typing input. Start typing to begin the 60-second test."
        defaultValue={SENTINEL}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        inputMode="text"
        enterKeyHint="done"
        data-gramm="false"
        data-lpignore="true"
        data-1p-ignore="true"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPaste={block}
        onCut={block}
        onDrop={block}
      />
    </div>
  );
}
