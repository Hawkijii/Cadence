import { memo } from 'react';
import ThemePicker from './ThemePicker.jsx';
import './Header.css';

function Header({ themeId, onPreviewTheme, onCancelPreview, onSelectTheme, onPickerClosed }) {
  return (
    <header className="header">
      <span className="wordmark">
        <span className="wordmark__bar" aria-hidden="true" />
        Cadence
      </span>
      <ThemePicker
        themeId={themeId}
        onPreview={onPreviewTheme}
        onCancelPreview={onCancelPreview}
        onSelect={onSelectTheme}
        onClosed={onPickerClosed}
      />
    </header>
  );
}

export default memo(Header);
