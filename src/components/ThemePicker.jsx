import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { THEMES, filterThemes, findTheme } from '../data/themes.js';
import { CheckIcon, ChevronIcon } from './Icons.jsx';
import './ThemePicker.css';

/** A tiny preview of a palette: its background with accent, text and error dots. */
function Swatch({ colors }) {
  return (
    <span className="swatch" style={{ background: colors.bg, borderColor: colors.border }} aria-hidden="true">
      <i style={{ background: colors.accent }} />
      <i style={{ background: colors.correct }} />
      <i style={{ background: colors.error }} />
    </span>
  );
}

/**
 * Searchable theme list in a popover. Focus stays in the search field (combobox
 * pattern): ↑/↓ move the highlight and preview that theme instantly, Enter or a
 * click keeps it, Escape or a click outside puts the previous theme back.
 */
export default function ThemePicker({ themeId, onPreview, onCancelPreview, onSelect, onClosed }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const uid = useId();
  const listId = `${uid}-list`;

  const current = findTheme(themeId);
  const matches = useMemo(() => filterThemes(query), [query]);
  const activeTheme = matches[active];
  const optionId = (id) => `${uid}-opt-${id}`;

  const openPicker = () => {
    setQuery('');
    setActive(Math.max(0, THEMES.findIndex((theme) => theme.id === themeId)));
    setOpen(true);
  };

  // Closing always restores the committed theme; a selection has already committed.
  const close = useCallback(
    (returnToTyping) => {
      setOpen(false);
      onCancelPreview();
      if (returnToTyping) onClosed?.();
    },
    [onCancelPreview, onClosed],
  );

  const choose = (id) => {
    onSelect(id);
    close(true);
  };

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  // Live preview of the highlighted theme.
  useEffect(() => {
    if (!open) return;
    if (activeTheme) onPreview(activeTheme.id);
    else onCancelPreview();
  }, [open, activeTheme, onPreview, onCancelPreview]);

  useEffect(() => {
    if (open && activeTheme) {
      document.getElementById(optionId(activeTheme.id))?.scrollIntoView({ block: 'nearest' });
    }
  }); // cheap; runs after each render while open so the highlight is always visible

  // Escape anywhere, or a press outside the picker, closes it.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      }
    };
    const onPointerDown = (event) => {
      if (panelRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) return;
      close(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, close]);

  const handleSearchKeyDown = (event) => {
    const count = matches.length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (count ? (i + 1) % count : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (count ? (i - 1 + count) % count : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeTheme) choose(activeTheme.id);
    } else if (event.key === 'Tab') {
      close(false); // let focus move on naturally
    }
  };

  return (
    <div className="theme">
      <button
        ref={triggerRef}
        type="button"
        className="theme__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Theme: ${current.name}. Change theme`}
        onClick={() => (open ? close(false) : openPicker())}
      >
        <Swatch colors={current.colors} />
        <span className="theme__name">{current.name}</span>
        <ChevronIcon width={14} height={14} />
      </button>

      {open && (
        <div className="picker" ref={panelRef} role="dialog" aria-label="Choose a theme">
          <input
            ref={searchRef}
            className="picker__search"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeTheme ? optionId(activeTheme.id) : undefined}
            aria-label="Search themes"
            placeholder="Search themes…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="go"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={handleSearchKeyDown}
          />

          <ul
            className="picker__list"
            id={listId}
            role="listbox"
            aria-label="Themes"
            onMouseDown={(event) => event.preventDefault()} // keep focus in the search field
          >
            {matches.map((theme, index) => (
              <li
                key={theme.id}
                id={optionId(theme.id)}
                role="option"
                aria-selected={theme.id === themeId}
                className="picker__option"
                data-active={index === active}
                onMouseMove={() => index !== active && setActive(index)}
                onClick={() => choose(theme.id)}
              >
                <Swatch colors={theme.colors} />
                <span className="picker__name">{theme.name}</span>
                {theme.id === themeId && <CheckIcon className="picker__check" width={15} height={15} />}
              </li>
            ))}
          </ul>

          {matches.length === 0 && (
            <p className="picker__empty" role="status">
              No theme matches “{query.trim()}”
            </p>
          )}

          <p className="picker__hint">
            <kbd>↑</kbd> <kbd>↓</kbd> browse · <kbd>enter</kbd> select · <kbd>esc</kbd> close
          </p>
        </div>
      )}
    </div>
  );
}
