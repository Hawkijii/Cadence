/**
 * Dark-only colour palettes. Each key maps to a CSS custom property (see
 * `cssVariables` below), so a theme change updates the whole interface at once.
 *
 *   bg        page background (deep, never pure black)
 *   surface   raised panels: theme picker, results dialog, key hints
 *   border    hairlines and dividers
 *   text      primary text and numbers
 *   muted     inactive words and secondary text
 *   dim       small hints and labels
 *   accent    caret, highlights, selection, primary actions
 *   onAccent  text drawn on top of the accent colour
 *   correct   correctly typed characters
 *   error     incorrectly typed characters
 */
export const THEMES = [
  {
    id: 'graphite',
    name: 'Graphite',
    colors: {
      bg: '#1e1f22', surface: '#27282c', border: '#383a40',
      text: '#d7d9dd', muted: '#8d909a', dim: '#858892',
      accent: '#b4bac6', onAccent: '#1e1f22', correct: '#eef0f3', error: '#ff7b72',
    },
  },
  {
    id: 'cool-slate',
    name: 'Cool Slate',
    colors: {
      bg: '#1b2028', surface: '#242b35', border: '#344050',
      text: '#d3dae4', muted: '#8996a9', dim: '#7d8ba0',
      accent: '#6aa6ff', onAccent: '#0e1724', correct: '#e8eef7', error: '#ff7a8a',
    },
  },
  {
    id: 'deep-tide',
    name: 'Deep Tide',
    colors: {
      bg: '#101a2c', surface: '#182640', border: '#263a58',
      text: '#cfdcee', muted: '#7f96b6', dim: '#7389ab',
      accent: '#3ed0e6', onAccent: '#06202a', correct: '#e6f3fb', error: '#ff7b7b',
    },
  },
  {
    id: 'dusk-violet',
    name: 'Dusk Violet',
    colors: {
      bg: '#1f1c26', surface: '#2a2632', border: '#3b3546',
      text: '#dad6e4', muted: '#988fa9', dim: '#8c83a0',
      accent: '#a99bf0', onAccent: '#1a1626', correct: '#efeaf8', error: '#ff7f8f',
    },
  },
  {
    id: 'pine',
    name: 'Pine',
    colors: {
      bg: '#1b201d', surface: '#242b27', border: '#334039',
      text: '#d5dcd6', muted: '#889a8e', dim: '#7b8e82',
      accent: '#78c08c', onAccent: '#0e1a13', correct: '#e8f1ea', error: '#ff8a7a',
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    colors: {
      bg: '#211e1b', surface: '#2b2723', border: '#3d3731',
      text: '#ddd5cb', muted: '#9a8e81', dim: '#918579',
      accent: '#e3a64f', onAccent: '#251a08', correct: '#f3ece2', error: '#ff6e6e',
    },
  },
  {
    id: 'merlot',
    name: 'Merlot',
    colors: {
      bg: '#231a1f', surface: '#2e2229', border: '#42303a',
      text: '#e0d3d8', muted: '#a08c95', dim: '#948089',
      accent: '#dc8da0', onAccent: '#2a0f18', correct: '#f4e6ea', error: '#ffa04d',
    },
  },
  {
    id: 'lagoon',
    name: 'Lagoon',
    colors: {
      bg: '#1a2123', surface: '#232c2f', border: '#33403f',
      text: '#d9d6cf', muted: '#8b9898', dim: '#7f8c8c',
      accent: '#4fc1b0', onAccent: '#07211d', correct: '#ece9e2', error: '#ff7e6e',
    },
  },
  {
    id: 'mist',
    name: 'Mist',
    colors: {
      bg: '#21262b', surface: '#2a3036', border: '#3a434c',
      text: '#d2d8de', muted: '#8d9aa5', dim: '#828f9a',
      accent: '#94a9bd', onAccent: '#161c22', correct: '#e9eef3', error: '#ff7d7d',
    },
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    colors: {
      bg: '#141414', surface: '#1f1f1f', border: '#444444',
      text: '#f2f2f2', muted: '#a8a8a8', dim: '#9a9a9a',
      accent: '#ffffff', onAccent: '#141414', correct: '#ffffff', error: '#ff5c5c',
    },
  },
];

export const DEFAULT_THEME_ID = 'graphite';

export function findTheme(id) {
  return THEMES.find((theme) => theme.id === id);
}

const toKebab = (key) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** { '--bg': '#...', '--on-accent': '#...', ... } for a theme. */
export function cssVariables(theme) {
  return Object.fromEntries(
    Object.entries(theme.colors).map(([key, value]) => [`--${toKebab(key)}`, value]),
  );
}

/** Case-insensitive name filter used by the theme picker's search field. */
export function filterThemes(query) {
  const q = query.trim().toLowerCase();
  if (!q) return THEMES;
  return THEMES.filter((theme) => theme.name.toLowerCase().includes(q));
}
