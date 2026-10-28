# Yukoto v3.0.1 — Guided study / My Path repair

The original Japanese illustrated aesthetic and the Chinese homepage are unchanged. This is a **repair of the v3.0 expanded curriculum source**, not a new redesign.

## Fixed

1. **`npm run test:guided` fails after `npm run sync:jlpt`**: OpenJLPT can include a word with the same spelling as an existing Yukoto card (for example `おはよう`). Word IDs are now canonically selected in this priority: original foundation lesson ID, then original Japanese word-card ID, then imported JLPT ID. Duplicate written forms share one stable tracking ID. JLPT words remain available in their community study levels, while matching original words preserve previous progress.
2. **My Path redirects to the Chinese homepage or reloads the SPA**: Both Japanese and Chinese links now point to `journey/index.html?lang=ja|zh`, rather than the directory URL. Likewise the guided studio's Back link targets explicit `japanese/index.html` or `index.html`.
3. **Incorrect GitHub Pages paths in localhost/custom domains**: Vite now uses portable `base: './'`, and Chinese navigation resolves static URLs relative to the actual document base rather than `window.location.origin`.
4. **Existing stored OpenJLPT duplicate records**: The guided studio migrates matching records to the canonical ID upon loading a saved session or importing a progress backup. Attempt and correct counts are retained; review due times are conservatively kept at the earliest due date.
5. **Regression coverage**: `npm run test:guided` now tests an OpenJLPT duplicate-import fixture, saved-record migration, and all four cross-page links in addition to the previous data/UI tests.

## Install and run (Windows / VS Code)

Extract this complete ZIP into a **new directory**; keep a backup of your original project and your existing `.env.local` file separately. Then from its root run:

```powershell
npm ci
npm run check:data
npm run test:guided
npm run test
npm run build
npm run dev
```

Dev addresses: `http://localhost:5173/`, `/japanese/index.html`, `/journey/index.html?lang=ja`, `/journey/index.html?lang=zh` (use the actual host and port printed by Vite).

If you have previously run `npm run sync:jlpt`, you may run it again in this corrected project, followed by `npm run test:guided` to expand the community Japanese corpus. The downloaded OpenJLPT corpus in your older project is **not** included in this package; to retain it without redownloading, copy only your prior `public/journey/datasets/jlpt-vocabulary.js` and `data/openjlpt-manifest.json` into the same paths of this corrected project, then run `npm run prepare:journey` and `npm run test:guided`.

## Verification limits

All bundled offline data tests and new regression tests pass in the processing environment. Full Vite bundling cannot be tested here because the previous archive provided Windows-only Rollup native dependencies and this environment has no network access to obtain the Linux build. Run `npm ci` and `npm run build` on your development machine to verify production output. Interactive browser navigation was blocked by this environment's browser policy, but explicit page targets were verified via local HTTP responses and automated source/regression tests.

## No UI theme changes

Japanese sakura, Fuji art, anime character and animation code are preserved. Chinese visual styling is also unchanged.
