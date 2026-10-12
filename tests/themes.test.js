import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, DEFAULT_THEME_ID, cssVariables, filterThemes, findTheme } from '../src/data/themes.js';

const KEYS = ['bg', 'surface', 'border', 'text', 'muted', 'dim', 'accent', 'onAccent', 'correct', 'error'];

const channel = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test('there are 8-10 themes with unique ids and names, and a valid default', () => {
  assert.ok(THEMES.length >= 8 && THEMES.length <= 10);
  assert.equal(new Set(THEMES.map((t) => t.id)).size, THEMES.length);
  assert.equal(new Set(THEMES.map((t) => t.name)).size, THEMES.length);
  assert.ok(findTheme(DEFAULT_THEME_ID));
  assert.equal(findTheme('does-not-exist'), undefined);
});

test('every theme defines every colour as a hex value', () => {
  for (const theme of THEMES) {
    assert.deepEqual(Object.keys(theme.colors).sort(), [...KEYS].sort(), theme.id);
    for (const value of Object.values(theme.colors)) assert.match(value, /^#[0-9a-f]{6}$/i, theme.id);
  }
});

test('every theme is dark: background luminance is low, and not pure black', () => {
  for (const { id, colors } of THEMES) {
    assert.ok(luminance(colors.bg) < 0.05, `${id} bg too light`);
    assert.notEqual(colors.bg.toLowerCase(), '#000000', id);
  }
});

test('text colours meet WCAG AA contrast (4.5:1) against the background', () => {
  for (const { id, colors } of THEMES) {
    for (const key of ['text', 'muted', 'dim', 'accent', 'correct', 'error']) {
      const ratio = contrast(colors[key], colors.bg);
      assert.ok(ratio >= 4.5, `${id}.${key} on bg is ${ratio.toFixed(2)}:1`);
    }
    assert.ok(contrast(colors.muted, colors.surface) >= 4.5, `${id}.muted on surface`);
    assert.ok(contrast(colors.onAccent, colors.accent) >= 4.5, `${id}.onAccent on accent`);
  }
});

test('correct, error and muted characters are visually distinct from each other', () => {
  for (const { id, colors } of THEMES) {
    assert.notEqual(colors.correct, colors.muted, id);
    assert.notEqual(colors.error, colors.correct, id);
    assert.ok(contrast(colors.correct, colors.muted) >= 1.5, `${id} correct vs muted`);
  }
});

test('cssVariables maps palette keys to CSS custom properties', () => {
  const vars = cssVariables(findTheme('graphite'));
  assert.equal(vars['--bg'], '#1e1f22');
  assert.ok('--on-accent' in vars);
  assert.equal(Object.keys(vars).length, KEYS.length);
});

test('theme search filters by name, ignoring case and surrounding spaces', () => {
  assert.equal(filterThemes('').length, THEMES.length);
  assert.deepEqual(filterThemes('  PINE ').map((t) => t.id), ['pine']);
  assert.deepEqual(filterThemes('slate').map((t) => t.id), ['cool-slate']);
  assert.deepEqual(filterThemes('zzzz'), []);
  assert.ok(filterThemes('a').length > 1);
});
