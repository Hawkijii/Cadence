import { useCallback, useRef, useState } from 'react';
import { findTheme } from '../data/themes.js';
import { applyTheme, loadTheme, saveTheme } from '../lib/theme.js';

/**
 * Owns the selected theme. `select` commits and persists a theme; `preview` shows
 * one temporarily (used while browsing the picker) and `cancelPreview` returns to
 * the committed theme. All of it works by rewriting CSS variables, so nothing in
 * the typing test re-renders when the theme changes.
 */
export function useTheme() {
  const [themeId, setThemeId] = useState(() => loadTheme().id);
  const committedId = useRef(themeId);

  const show = useCallback((id) => {
    const theme = findTheme(id);
    if (theme) applyTheme(theme);
    return theme;
  }, []);

  const select = useCallback(
    (id) => {
      const theme = show(id);
      if (!theme) return;
      committedId.current = theme.id;
      saveTheme(theme);
      setThemeId(theme.id);
    },
    [show],
  );

  const preview = useCallback((id) => show(id), [show]);
  const cancelPreview = useCallback(() => show(committedId.current), [show]);

  return { themeId, select, preview, cancelPreview };
}
