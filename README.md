# New Muslim Companion

React 18 + Vite. Run `npm install && npm run dev`; build with `npm run build`.

## Performance & architecture notes

**Rule that was followed:** no colour, font, spacing, layout or component-markup change to any existing screen.
Every existing screen was screenshot-compared (original build vs. this build, English / Arabic-RTL / night theme)
and is pixel-identical (the marketing site/landing page is untouched). The visible changes are: the **Alarm** screen
is now real prayer alarms, and **Reminders** gained a "Monthly times" tab next to the existing occasions.

| Area | What it does now | Where |
|---|---|---|
| Page transitions | Every screen change cross-fades (180 ms) with the View Transitions API; browsers without it get a CSS fade-in. Disabled for `prefers-reduced-motion`. | `src/lib/transition.js`, end of `src/index.css` |
| Routing / code splitting | Only the landing page is in the first bundle. Every other screen is a lazy chunk registered in one place. `go()` downloads the next chunk *before* swapping, so there is never a blank frame or Suspense flash. After first paint the rest is prefetched one chunk at a time on idle (skipped with Data Saver). | `src/lib/routes.jsx`, `src/App.jsx` |
| Lottie | The Lottie runtime and the 1.7 MB of animation JSON are separate chunks (they were in the first bundle). Their boxes already have fixed sizes, so nothing shifts. | `src/components/Lottie.jsx` |
| State & persistence | Language, name, persona, theme, location, are stored as one small JSON blob (`mc_prefs_v1`), read synchronously once at start (first render already has them) and written 120 ms after a change, off the render path. The context value is memoised. | `src/context/AppContext.jsx`, `src/lib/storage.js` |
| Navigation state | History stack is a pure reducer-style transition (the old version called `setHistory` inside a `setScreen` updater, which StrictMode double-runs in dev). | `AppContext.jsx` |
| Location | Cached fix is used instantly. A silent refresh runs only when the browser has *already* granted permission, at most every 6 h, and a move under 0.5 km is ignored (no re-render, no recompute). The permission prompt is only ever shown from a user tap (onboarding, Map, or enabling a prayer alarm). | `src/lib/location.js` |
| Prayer-time maths | Existing in-house engine (Muslim World League 18°/17°) kept; results are memoised per place/day/method, and the `Intl` formatters are built once. The Home clock pauses while the tab is hidden. | `src/lib/prayerTimes.js`, `src/screens/Home.jsx` |
| Prayer alarms | Fajr / Dhuhr / Asr / Maghrib / Isha, each with: fixed time or relative to the prayer (0–120 min before/after; Fajr can anchor to sunrise), sound (5 built-in tones or your own audio file, kept in IndexedDB), phone-volume or custom volume, gentle rise, wake-up challenge (questions, shake, maths, memory, QR, type, random, with preview), snooze, "Are you awake?" re-check and a Fajr sleep reminder. A 1 s engine compares timestamps, shows a notification, plays the sound, vibrates and opens the ring screen; the screen is kept awake while an alarm is set. | `src/lib/alarms.js`, `alarmEngine.js`, `sounds.js`, `alarmStrings.js`, `src/screens/alarm/` |
| Monthly times | Month table (Gregorian + Hijri), tap a day for details, share, add the month to a calendar (.ics), calculation-method picker (Egyptian General Authority by default; times rounded to the minute). | `src/screens/Timetable.jsx`, `src/lib/prayerTimes.js` |
| PWA | Web app manifest + icons so the site can be installed to the home screen. | `public/manifest.webmanifest` |
| Fonts | The Google Fonts stylesheet no longer blocks first paint (`<noscript>` fallback included). | `index.html` |

### Measured (esbuild, Lottie runtime stubbed in both builds)

| | Initial JS, raw | Initial JS, gzip |
|---|---|---|
| Before | 1,983 KB | 295 KB |
| After | 314 KB | 100 KB |

With the real `lottie-react` the saving is larger, because the Lottie runtime also moves out of the first bundle.
Re-measure with `npm run build` on your machine.

### Adding a screen

1. Build it as `src/screens/MyScreen.jsx` (default export, or a named export).
2. Register it in `src/lib/routes.jsx`: `route('my-screen', () => import('../screens/MyScreen'))`.
3. Navigate with `go('my-screen')`. Add it to `PREFETCH_ORDER` if it should be warmed on idle.

## Things to know

- **Alarms ring only while the page is open** (a tab or the installed web app). A browser cannot ring a closed page;
  that needs a native app or a push server. Notifications use the service worker when present.
- Reciter adhan recordings are not bundled (licensing) — add your own file in the sound picker.
- QR scanning needs a camera and a browser with `BarcodeDetector` (Chrome on Android); shake needs a motion sensor.
  Both fall back to a tap so nobody is locked out.
- New alarm/timetable text is written in English and Arabic; other languages fall back to English.
- **`adhan`** was not added: the build environment had no network access, so it could not be installed or tested.
  The built-in engine is the same family of calculation and is isolated behind `prayerTimes()` — swapping to `adhan`
  is a one-file change.
