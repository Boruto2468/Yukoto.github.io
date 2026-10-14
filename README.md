# Yukoto — Mandarin practice with HSK 2.0 and HSK 3.0

Yukoto is a minimal React + TypeScript + Vite study site. It focuses on listening before revealing transcripts, vocabulary in context, cross-linked Hanzi, writing from memory, and cumulative review. Japanese remains marked as the next course rather than presented as a complete course.


### Windows import command

From the extracted `language-study-site` folder, run `npm run import-local` (hyphen) or `npm run import:local` (colon). Both commands are defined in `package.json`. Before importing, run `npm run` and confirm one of these names appears in the scripts list. If neither appears, you are running the command from an older project folder; extract this ZIP into a new folder and open a terminal there.

## Easiest way to import the curriculum when the terminal cannot access dataset websites

You do **not** need to upload files to ChatGPT. Download the following three CSVs in your normal web browser and keep them on your computer:

1. **HearMandarin combined word list:** [Download CSV](https://hearmandarin.com/datasets/hsk-3-0-words.csv). Save it as `hearmandarin-hsk-3-0-words.csv`. It includes HSK 2.0 level tags and glosses, licensed CC BY 4.0.
2. **Gushi HSK 3.0 words (all levels):** [Download CSV](https://gushichinese.com/hsk-3.0/downloads/hsk-3.0-words-all.csv). Save it as `gushi-hsk3-words-all.csv`. Yukoto takes levels 1–6 and their contextual examples, licensed CC BY-SA 4.0.
3. **Gushi HSK 3.0 reading characters (all levels):** [Download CSV](https://gushichinese.com/hsk-3.0/downloads/hsk-3.0-characters-all.csv). Save it as `gushi-hsk3-characters-all.csv`. Yukoto takes levels 1–6, licensed CC BY-SA 4.0.

The files' names need to match exactly (including spelling and `.csv`). Put them in the project's `data/import/` folder. This folder already exists in the archive. If a file was downloaded with ` (1)` in the name, rename it. Do not open and re-save the originals in Excel; keep the source CSVs unchanged so the source hashes remain reproducible.

### Run the import on Windows

1. Extract the Yukoto ZIP to a normal folder such as `Documents\Yukoto`.
2. Open `data\import` inside that folder, and copy the three CSVs into it.
3. Go back to the main project folder named `language-study-site`.
4. Click the File Explorer address bar, type `cmd`, then press Enter. A terminal will open in that folder.
5. Check Node.js is installed by running `node -v`. Use Node.js 18 or newer.
6. Run these commands one at a time:

```bash
npm install
npm run import:local
npm run check:data
npm test
npm run dev
```

`npm run import:local` uses only the CSVs in `data/import/`. It does **not** contact GitHub or Gushi. It checks the six HSK 2.0 levels, six HSK 3.0 vocabulary levels, and six HSK 3.0 character levels; verifies the documented row counts; combines duplicate words while preserving both curricula's tags; builds the Hanzi-to-word relationships; saves SHA-256 file fingerprints; and writes source notices. A failed count or malformed source file stops the import without replacing the existing curriculum file.

Expected source totals are 5,000 HSK 2.0 vocabulary assignments; 5,400 HSK 3.0 vocabulary assignments; and 1,940 HSK 3.0 reading-character assignments across levels 1–6. These are validation targets, not claims about what is currently in the ZIP. After a successful import, the importer reports the actual merged headword and unique-Hanzi counts. The source lists are community-published datasets, not independently audited by Yukoto.

`npm install` must install the website's code dependencies the first time, and therefore needs npm access. The CSV import itself does not need terminal network access. If `npm install` also fails, install the dependencies on a machine with a working connection or transfer the whole project including its working `node_modules` folder.

### Build the production site

After the import and checks succeed, run:

```bash
npm run build
npm run preview
```

The build checks that a validated curriculum is present. It is designed not to ship starter examples under a false “complete curriculum” label.

## Alternative: direct source import

On a machine with working terminal access to the source hosts, the original JSON-based route remains available:

```bash
npm run sync:curriculum
npm run check:data
npm test
npm run build
```

The CSV workflow is recommended when that command cannot reach the source websites.

## What the site includes

- Separate HSK 2.0 and HSK 3.0 selectors with levels 1–6 and vocabulary search.
- One Hanzi index, with level assignments and cross-links to every imported word containing each character.
- Gushi-provided HSK 3.0 examples with Chinese, Pinyin, English, and browser-speech playback.
- Audio-first dialogue practice with revealable transcripts, writing-from-memory practice, and cumulative review.
- The original minimal, responsive design, theme switch, interface-language switch, and saved preferences.

Radicals or component breakdowns are shown only when a source actually supplies them. Yukoto does not invent character etymologies or decompositions. The CSV workflow does not include verified component breakdowns for every Hanzi.

## Licensing and attribution

- **HearMandarin word data:** CC BY 4.0. Credit HearMandarin and link to https://hearmandarin.com/datasets/.
- **Gushi HSK 3.0 words, examples, and reading-character data:** CC BY-SA 4.0. Credit “HSK 3.0 syllabus data by Gushi” and link to https://gushichinese.com/hsk-3.0/downloads. Adapted HSK 3.0 data redistributed by Yukoto must retain attribution and the CC BY-SA 4.0 terms.
- Gushi states that the examples are largely from Tatoeba (CC BY 2.0 FR) plus examples written for Gushi. Its audio URLs are excluded from its dataset licence; Yukoto does not use those recordings and uses browser speech synthesis.

`THIRD_PARTY_NOTICES.md` is generated alongside the curriculum snapshot after a successful import. Retain it with the imported data and when redistributing the project.

## Current archive state

This ZIP does **not** include the full downloaded curriculum because this environment could not reach upstream dataset hosts. Use the local CSV workflow above to create the bundled `src/data/curriculum.json` on your computer. Until the real source CSVs pass the count and structural checks, the archive does not claim its starter records are the complete syllabus.
