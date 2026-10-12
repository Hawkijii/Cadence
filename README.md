# Cadence

A quiet, fast **60-second typing speed test**. React + Vite, plain JavaScript and plain CSS. No backend, no accounts, no analytics, no network requests: fonts are bundled, results are computed locally, and the only thing stored is your theme choice.

## Run it

```bash
npm install
npm run dev        # development server with hot reload
npm run build      # production build into dist/
npm run preview    # serve the production build locally
npm test           # unit tests (Node's built-in test runner, no extra dependencies)
```

Requires Node 20.19+ or 22.12+ (a Vite requirement).

### Configuration

| What | Where |
| --- | --- |
| "Support this project" link (Buy Me a Coffee) | Copy `.env.example` to `.env` and set `VITE_SUPPORT_URL=https://buymeacoffee.com/your-username` |
| Passage length, look-ahead, extra-character cap, clock refresh | `src/config.js` |
| Word list | `src/data/words.js` |
| Colour themes | `src/data/themes.js` |

The test length is fixed at 60 seconds on purpose.

## How scoring works

One set of rules drives both the live numbers and the final results (`src/lib/scoring.js`).

**Characters** (what is on screen when the clock stops, or right now while typing)

- A typed letter is *correct* if it matches the passage at that position, otherwise *incorrect*. Letters typed past the end of a word are incorrect.
- The space that ends a word is 1 correct character if the word is exactly right, otherwise 1 incorrect character. That is how skipped letters are penalised.
- Backspace removes a character from the screen, so a mistake you fixed no longer counts as an incorrect character.

**WPM** = (correct characters ÷ 5) ÷ elapsed minutes. It measures net output, so typing and deleting the same character over and over cannot inflate it. The final result always uses the full 60 s.

**Keystrokes** are every printable key press, judged at the moment it is pressed. Backspace is not a keystroke and does not erase an earlier mistake.

**Accuracy** = correct keystrokes ÷ all keystrokes. Mistakes you corrected still count against accuracy, because they were still mistakes. With nothing typed there is no accuracy to show, so the UI shows a dash instead of a made-up number. The display never rounds up to "100%" unless it really is 100%.

The *live* WPM readout is measured over at least the first second, so the first few keystrokes ramp the number up rather than spiking (one character after 50 ms would otherwise read 240 WPM). After that it is exactly the same formula as the final result.

Timing uses `performance.now()` timestamps, never a counter. A keystroke that arrives after the 60 s deadline is not counted, even if the clock display has not ticked over yet.

## Using it

- **Start**: just type. The clock starts on your first printable character, not when the page loads. A leading space does nothing.
- **Backspace** deletes a character. At the start of a word it steps back into the previous word, but only if that word has a mistake in it. Ctrl/⌥+Backspace clears the current word.
- **Restart**: the restart button, or **Tab**. Tab restarts only once a test is in progress (or finished). While the test is idle it keeps its normal job of moving focus, and **Shift+Tab always does**, so keyboard users are never trapped.
- **Theme**: the button in the header opens a searchable list. ↑/↓ preview a theme instantly, Enter keeps it, Esc (or clicking away) puts the previous one back. The choice is saved in `localStorage`; if storage is blocked the default theme is used and everything else still works.
- **Results**: when time is up a dialog shows WPM, accuracy, correct and incorrect characters and keystrokes. Tab, Enter on the button, or Esc starts a new test.

## Performance notes

- Each word is a memoised component; a keystroke re-renders only the word being typed (checked in the browser: one word element touched per key). Measured per-keystroke work is about 0.5 ms median.
- The caret and the three-line scroll are positioned imperatively from the DOM, so moving them never triggers a React render.
- One interval exists only while a test is running, created and cleared by an effect; restart, finish and unmount all clean it up.
- A single visually hidden `<input>` captures typing for physical and virtual keyboards. It mirrors the active word behind a one-space sentinel (`src/lib/input.js`), so IME composition, swipe/predictive keyboards and Backspace on an empty word all go through the same path. Paste, drop, undo, select-all and cursor movement are blocked in that field.
- Fonts (Inter and JetBrains Mono, latin subset, ~88 KB) are bundled with the app. Production JS is ~76 KB gzipped, mostly React.
- After the first load nothing needs the network. (Reloading the page *while offline* would need a service worker, which this project deliberately does not include.)

## Adding a theme

Add an entry to `THEMES` in `src/data/themes.js` with the ten colour keys documented at the top of that file. `npm test` checks that every theme is dark, has unique names, and that its text colours meet the 4.5:1 WCAG contrast ratio. The picker, swatches, search and persistence pick it up automatically.

## Project layout

```
src/
  App.jsx                    page composition and focus handling
  config.js                  constants (duration, passage sizes, support URL)
  data/        words.js  themes.js
  lib/         engine.js     pure typing state machine (reducer, timestamps passed in)
               scoring.js    WPM / accuracy / character counting
               live.js       live readout (time left, WPM, accuracy)
               input.js      hidden-input diffing, shared by all keyboards
               passage.js  format.js  theme.js  storage.js
  hooks/       useTypingTest.js  useTheme.js
  components/  Header  TestStats  TypingArea  Word  ThemePicker  ResultsModal  Footer  Icons
  styles/      fonts.css  base.css   (each component also has its own .css)
tests/         *.test.js
```

## Tests

`npm test` runs 48 unit tests covering the engine (clock start, backspace rules, extra characters, the 60 s deadline), scoring, input handling for mobile keyboards, live stats, the word generator, and theme data (contrast, uniqueness, search).

Still worth checking by hand, because they depend on real hardware or other browsers: typing with the iOS and Android on-screen keyboards (including autocorrect/predictive text), and rendering in Safari and Firefox.
