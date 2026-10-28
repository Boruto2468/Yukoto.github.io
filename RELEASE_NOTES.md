# Yukoto 3.0 — Expanded curriculum and hybrid learning studio

This v3.0.1 maintenance release is derived from the uploaded Yukoto React/Vite project and retains its **original Japanese illustrated home page** and **original Chinese practice/AI pages**. The learning studio remains *optional* and is available at `/journey/index.html?lang=ja` and `/journey/index.html?lang=zh` in local development, with relative links that also work at the deployed GitHub Pages root or repository prefix.

## Current capabilities (contained in this ZIP)

- Japanese and Chinese independent progress, guided paths, free practice (listen/speak/read/write), vocabulary search, saved cards, review, local backup/restore.
- **Chinese**: 7,158 unique source-merged HSK headwords, available in the guided vocabulary library and HSK 2.0/3.0 study sets at levels 1–6. Source manifests retain **5,000 HSK 2.0 + 5,400 HSK 3.0 level-assignment rows**; duplicate source rows can collapse to the same study headword. 1,940 HSK 3.0 reading-character syllabus entries are in Character Study.
- **Japanese bundled offline**: 45 original Yukoto starter words, curated Kanji example words and 142 kana chart rows (71 Hiragana + 71 Katakana), deduplicated to **410 study entries**, plus 220 curated Kanji and 16 extracted grammar-guide sections. Japanese corpus is **not** exhaustive JLPT N5–N1 content.
- Two sets of 6 original hand-curated foundation lessons plus automatically generated study sets: **1,046 Chinese lesson units** and **50 Japanese lesson units** with this bundled corpus. Automatically grouped sets are *vocabulary study units*, not manually written conversations or comprehensive grammar curricula.
- Introductory Chinese grammar reference (16 patterns); Japanese foundation guide (16 sections). Source-backed word examples appear when supplied; otherwise the activity is labelled *word study*, not a fabricated sentence.
- Paginated lesson/character/grammar selectors and vocabulary library for large datasets; reusable word IDs also connect original Chinese React review and original Japanese word practice.
- Original Japanese scenery/artwork and animations, the Chinese React app, Cloudflare Worker conversation component and existing HSK import tools remain intact.

## How to use — Windows / VS Code

1. Extract the archive outside your current project and back up your live project. `.env.local` / secrets are intentionally excluded. Use Node.js 20 or 22.
2. In the extracted root run:

   ```powershell
   npm ci
   npm run check:data
   npm run test
   npm run dev
   ```

3. Click **My Path** on either original language homepage or navigate to `/journey/index.html?lang=ja` / `/journey/index.html?lang=zh` in dev mode.
4. To **obtain the full community OpenJLPT N5–N1 vocabulary, Kanji and grammar corpus**, while your computer has internet access run:

   ```powershell
   npm run sync:jlpt
   npm run test:guided
   ```

   The importer retrieves OpenJLPT source JSON (five vocabulary + five Kanji + five grammar lists), checks each level, records URL hashes in `data/openjlpt-manifest.json`, creates the static Japanese bundle, and refreshes the cross-page progress ID map. It refuses to overwrite the original offline fallback if the downloaded corpus is incomplete. **This ZIP does not prebundle those remote files** because source retrieval was blocked in the processing environment. You must run this command once for broader JLPT coverage.
5. Before deploying, run `npm run build`. The Vite output will be in `dist/`; the existing GitHub Pages workflow builds that output on Ubuntu using `npm ci`. The Vite `base` is now relative (`./`), so the same build should work at root and repository-prefixed GitHub Pages URLs and keep your existing HTTPS Worker URL as an Actions variable, not in code.

## Importing updated Chinese data

The canonical source remains `src/data/curriculum.json`. `npm run import:local` and `npm run sync:curriculum` now regenerate the optional studio's compact HSK data and the shared ID map. `npm run prepare:journey` can regenerate these derived assets independently. The verifier checks original source-form counts rather than demanding unique headword counts equal source row totals.

## Quality and safety boundaries

- This repository is a **working source release**, not a claim of complete human-authored lessons through HSK 6/JLPT N1. Vocabulary coverage is not proficiency or exam certification.
- The original tests and new data, UI-state and cross-page-ID tests run with `npm run test` / `npm run test:guided`. HTML/JS syntax is checked independently.
- **Production bundling was not verified in the processing environment**, because the uploaded `node_modules` carries Windows binaries and the environment cannot download a Linux Rollup binary. Run `npm ci && npm run build` on your computer or GitHub Actions, then test on the deployed path.
- Browser-based visual navigation was blocked in the processing environment; scripted state-flow tests passed but full browser accessibility and audio checks remain important.
- Speech recognition transcription is **not** a pronunciation grade. Browser voices and microphone availability vary. The original Gemini AI page still requires its existing live Worker setup.
- Progress is local browser storage. Export backups from Settings. Storage clearing or changing origin may remove/misplace local records. No cross-device accounts are included.
- Review original character artwork and audio licenses before public deployment. See `THIRD_PARTY_NOTICES.md` for imported corpus attribution and share-alike obligations.

## Design decision

The optional studio respects existing Japanese midnight-blue / sakura visuals and Chinese warm palette. Original homepages are not transformed into the unrelated sage/cream design prototype.
