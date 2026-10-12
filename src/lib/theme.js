import { DEFAULT_THEME_ID, cssVariables, findTheme } from '../data/themes.js';
import { readStorage, writeStorage } from './storage.js';

const THEME_KEY = 'cadence.theme';
// The background is stored too so the inline script in index.html can paint it
// before the app boots (no flash of the default theme on a return visit).
const THEME_BG_KEY = 'cadence.themeBg';

/** The saved theme, or the default if nothing valid is stored or storage is unavailable. */
export function loadTheme() {
  return findTheme(readStorage(THEME_KEY)) ?? findTheme(DEFAULT_THEME_ID);
}

export function saveTheme(theme) {
  writeStorage(THEME_KEY, theme.id);
  writeStorage(THEME_BG_KEY, theme.colors.bg);
}

/** Applies a palette by setting CSS custom properties on <html>; no React render involved. */
export function applyTheme(theme) {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(cssVariables(theme))) {
    root.style.setProperty(name, value);
  }
  root.dataset.theme = theme.id;
  root.style.backgroundColor = ''; // drop the pre-boot paint; the stylesheet's var(--bg) takes over
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colors.bg);
}
