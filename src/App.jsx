import { useCallback, useEffect, useRef } from 'react';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import { RestartIcon } from './components/Icons.jsx';
import ResultsModal from './components/ResultsModal.jsx';
import TestStats from './components/TestStats.jsx';
import TypingArea from './components/TypingArea.jsx';
import { useTheme } from './hooks/useTheme.js';
import { useTypingTest } from './hooks/useTypingTest.js';
import { formatAccuracy, roundAccuracy, roundWpm } from './lib/format.js';
import './App.css';

export default function App() {
  const { themeId, select, preview, cancelPreview } = useTheme();
  const { state, live, results, runId, handleInputValue, restart } = useTypingTest();
  const inputRef = useRef(null);

  const finished = state.status === 'finished';
  const idle = state.status === 'idle';

  const focusTyping = useCallback(() => inputRef.current?.focus({ preventScroll: true }), []);

  // After any restart (button, Tab, results dialog) focus returns to the typing area. This runs
  // after the render that lifted the dialog's `inert` state, so the focus call can succeed.
  useEffect(() => {
    if (runId > 0) focusTyping();
  }, [runId, focusTyping]);

  // When time is up the typing field lets go; the results dialog takes focus.
  useEffect(() => {
    if (finished) inputRef.current?.blur();
  }, [finished]);

  return (
    <>
      <div className="app" inert={finished}>
        <Header
          themeId={themeId}
          onPreviewTheme={preview}
          onCancelPreview={cancelPreview}
          onSelectTheme={select}
          onPickerClosed={focusTyping}
        />

        <main className="main">
          <TestStats live={live} status={state.status} />

          <TypingArea
            state={state}
            runId={runId}
            inputRef={inputRef}
            onInputValue={handleInputValue}
            onRestart={restart}
          />

          <div className="controls">
            <button type="button" className="restart" onClick={restart} aria-label="Restart test" title="Restart test (Tab)">
              <RestartIcon />
            </button>
            <p className="hint">
              {idle ? (
                <span>Start typing to begin</span>
              ) : (
                <span className="hint__keys">
                  <kbd>Tab</kbd>
                  <span>restart</span>
                </span>
              )}
            </p>
          </div>
        </main>

        <Footer />
      </div>

      {finished && results && <ResultsModal results={results} onRestart={restart} />}

      <div className="sr-only" role="status" aria-live="polite">
        {results
          ? `Time is up. ${roundWpm(results.wpm)} words per minute, ${formatAccuracy(roundAccuracy(results.accuracy))} accuracy.`
          : ''}
      </div>
    </>
  );
}
