import { memo } from 'react';
import { TEST_DURATION_SECONDS } from '../config.js';
import { formatAccuracy } from '../lib/format.js';
import './TestStats.css';

/**
 * The fixed test configuration plus the live numbers. Values are fixed-width and
 * tabular, so nothing shifts sideways while they change.
 */
function TestStats({ live, status }) {
  const idle = status === 'idle';
  return (
    <div className="stats">
      <p className="stats__config">
        <span className="stats__config-label">test</span>
        <span className="stats__config-value">{TEST_DURATION_SECONDS} seconds</span>
      </p>

      <dl className="stats__live" aria-label="Live statistics">
        <div className="stat stat--time">
          <dt>time</dt>
          <dd>{live.timeLeft}</dd>
        </div>
        <div className="stat">
          <dt>wpm</dt>
          <dd>{idle ? '–' : live.wpm}</dd>
        </div>
        <div className="stat">
          <dt>accuracy</dt>
          <dd>{idle ? '–' : formatAccuracy(live.accuracy)}</dd>
        </div>
      </dl>
    </div>
  );
}

export default memo(TestStats);
