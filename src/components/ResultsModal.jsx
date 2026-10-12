import { useEffect, useRef } from 'react';
import { formatAccuracy, roundAccuracy, roundWpm } from '../lib/format.js';
import { RestartIcon } from './Icons.jsx';
import './ResultsModal.css';

// Keystrokes still arriving when the clock stops must not press the button by accident,
// so the dialog itself takes focus first and the button only after a short beat.
const BUTTON_FOCUS_DELAY_MS = 600;

/**
 * Final results. The numbers come straight from the engine's summary of the real
 * keystrokes; nothing here is computed, estimated or hard-coded.
 */
export default function ResultsModal({ results, onRestart }) {
  const dialogRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const id = setTimeout(() => buttonRef.current?.focus(), BUTTON_FOCUS_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onRestart();
    } else if (event.key === 'Tab') {
      // Same shortcut as during the test; Shift+Tab is held inside the dialog (it is modal).
      event.preventDefault();
      if (!event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) onRestart();
    }
  };

  return (
    <div className="results-backdrop">
      <div
        ref={dialogRef}
        className="results"
        role="dialog"
        aria-modal="true"
        aria-labelledby="results-title"
        aria-describedby="results-note"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <h2 id="results-title" className="results__title">
          Time’s up
        </h2>

        <div className="results__hero">
          <p className="results__big">
            <span className="results__value">{roundWpm(results.wpm)}</span>
            <span className="results__unit">wpm</span>
          </p>
          <p className="results__big">
            <span className="results__value">{formatAccuracy(roundAccuracy(results.accuracy))}</span>
            <span className="results__unit">accuracy</span>
          </p>
        </div>

        <dl className="results__grid">
          <div>
            <dt>correct characters</dt>
            <dd>{results.correctChars}</dd>
          </div>
          <div>
            <dt>incorrect characters</dt>
            <dd>{results.incorrectChars}</dd>
          </div>
          <div>
            <dt>correct keystrokes</dt>
            <dd>
              {results.correctKeys}
              <span className="results__of"> / {results.totalKeys}</span>
            </dd>
          </div>
        </dl>

        <p id="results-note" className="results__note">
          WPM counts the correct characters left on screen, five to a word. Accuracy counts every keystroke, including
          mistakes you went back and fixed.
        </p>

        <button ref={buttonRef} type="button" className="results__button" onClick={onRestart}>
          <RestartIcon width={17} height={17} />
          <span>Try again</span>
          <kbd>Tab</kbd>
        </button>
      </div>
    </div>
  );
}
