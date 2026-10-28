# Yukoto — guided + free learning merge (source integration)

This is the original uploaded `language-study-site-03.rar` **with an additional optional guided learning studio**. The Japanese and Chinese sites have **not been replaced** with the previous cream-and-sage prototype.

## What was preserved

- Japanese: original `/japanese/` homepage, sakura scenery, Fuji background, anime heroine, animations, dark-blue / pink palette, separate static JS pages, words, kana, kanji, grammar, anime browsing, dictionary and Rhiye launcher.
- Chinese: original React + Vite homepage, Pinyin, speech, reading, HSK 2.0 / 3.0 imported datasets (source-verified), review, Gemini Live conversation component and existing UI themes.
- Hosting: Vite now uses the portable relative `base: './'` so the development server, GitHub project pages, user pages, and custom domains can serve the same static pages without hard-coded repository prefixes.
- Existing `.env` files were intentionally **not included** in this ZIP to avoid exposing secrets. Set your Cloudflare Worker endpoint and other existing environment variables locally before deploying.

## What's new

- `public/journey/` — a complete **optional** study studio, reached via `My Path` on either Japanese or Chinese. Start URL: `journey/index.html?lang=ja` or `journey/index.html?lang=zh` relative to the deployed website root.
- The studio adapts to the original Japanese midnight-blue + sakura design or Chinese parchment + terracotta colours. No forced full-site theme change.
- Six guided foundation lessons per language, with listening, spoken repetition, contextual reading and recall. **These are curated starter lessons, not full JLPT/HSK courses.**
- Free listening / speaking / reading / writing, vocabulary cards, bookmarks, scheduled review, and local JSON backup / restore.
- Japanese original-word library appears in studio vocabulary alongside guided vocabulary, with stable IDs shared for overlapping words.
- Original Japanese word reveals register exposure; original Japanese typed drills register recall. Chinese React review answers record recall under a shared progress key. Exposure and recall are deliberately different.
- External HSK review targets learned in the original Chinese site can appear in the guided studio's spaced review queue with their recorded meanings.
- The original Chinese AI partner remains in its existing React page. The guided studio's AI entry returns to it instead of pretending to recreate the service.

## How to run this on Windows / VS Code

1. Extract the ZIP outside `node_modules` or any existing working checkout. Keep a backup of your existing site.
2. Install Node.js 18 or newer (22 LTS recommended).
3. At project root run:

   ```bash
   npm ci
   npm run test
   npm run dev
   ```

4. Open the Vite URL printed in your terminal. Open Chinese `/` and Japanese `/japanese/index.html` from the same Vite development origin. Click **My Path** in either.
5. Before publishing, run:

   ```bash
   npm run build
   ```

6. The portable Vite `base: "./"` works for both root and repository-prefixed GitHub Pages deployments. Keep all manual links relative to your deployed root.
7. Preserve your **own local `.env.local`/Worker secrets**; the source archive contained environment files, but no secrets are redistributed in this package.

## Important boundaries

- Only *starter guided content* is shipped. The original Chinese HSK datasets and Japanese learning materials remain present and available through existing Free Explore pages.
- Existing Chinese and Japanese progress from the **original** app is not retroactively counted; new supported practice events register under `yukoto.hybrid.v1`. Existing original saved words and lesson completion remain unaffected. Existing data is not deleted or migrated.
- Progress is browser-local and may disappear if site storage is cleared. Use Settings > Export progress regularly. No accounts or multi-device syncing.
- The import routine replaces hybrid progress (not legacy app data), as disclosed in its confirmation dialogue.
- Browser speech recognition is optional, may contact a browser provider, and is **not** a pronunciation assessment.
- A real production build was **not** completed in this Linux workspace because the user-supplied `node_modules` contained Windows-only Rollup binaries. The source passes syntax checks and the available original/added tests; re-run `npm ci && npm run build` on the target development machine. `node_modules` is deliberately excluded from delivery.
- The upload's original Japanese character and music assets are preserved in the project; review their publishing rights independently before a public release.

## Files changed / added

- Modified `public/japanese/app.js`, `public/japanese/styles.css`: small optional entry + progress hooks. Original art unchanged.
- Modified `src/main.tsx`, `src/styles.css`: optional Mandarin entry, recall hook, AI hash navigation. Original pages remain.
- Added `public/journey/index.html`, `app.js`, `data.js`, `progress.js`, `styles.css`, `yukoto-themes.css`.
- Added `src/guided/bridge.ts`, `src/guided/wordIds.json` and `scripts/test-guided.mjs`.
- Updated `package.json` test scripts (no new dependencies).

## Future complete-content expansion

The existing original HSK corpus should later be attached to guided lesson references **by stable IDs** (not copied as a second dictionary), while the Japanese side should get source-verified JLPT coverage. The new foundation pipeline is deliberately separate from that substantial curriculum-authoring task. No fabricated JLPT/HSK full-coverage claims.
