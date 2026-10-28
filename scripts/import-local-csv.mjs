import { readFile, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const INPUT = resolve('data/import');
const TARGET = resolve('src/data/curriculum.json');
const NOTICES = resolve('THIRD_PARTY_NOTICES.md');
const HEAR_FILE = 'hearmandarin-hsk-3-0-words.csv';
const GUSHI_WORD_FILE = 'gushi-hsk3-words-all.csv';
const GUSHI_CHAR_FILE = 'gushi-hsk3-characters-all.csv';
const EXPECTED_OLD = [150, 150, 300, 600, 1300, 2500];
const EXPECTED_NEW = [300, 200, 500, 1000, 1600, 1800];
const EXPECTED_CHARS = [246, 125, 284, 441, 431, 413];
const SOURCES = {
  hear: 'https://hearmandarin.com/datasets/hsk-3-0-words.csv',
  gushiWords: 'https://gushichinese.com/hsk-3.0/downloads/hsk-3.0-words-all.csv',
  gushiChars: 'https://gushichinese.com/hsk-3.0/downloads/hsk-3.0-characters-all.csv',
};
const isHan = (value) => /\p{Script=Han}/u.test(value);
const unique = (values) => [...new Set((values ?? []).filter((v) => typeof v === 'string' && v.trim()).map((v) => v.trim()))];
const meanings = (value) => unique(String(value ?? '').split(/\s*;\s*/));
const readCell = (row, ...names) => {
  for (const name of names) {
    const key = name.toLowerCase();
    if (Object.hasOwn(row, key) && row[key] !== undefined) return String(row[key]).trim();
  }
  return '';
};
function parseCsv(text) {
  // RFC-4180 style parser: commas, escaped quotes, CRLF, and newlines inside quoted cells.
  const input = text.replace(/^\uFEFF/, '');
  const records = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"' && field.length === 0) quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && input[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((v) => v.trim() !== '')) records.push(row);
      row = [];
    } else field += ch;
  }
  if (quoted) throw new Error('CSV contains an unclosed quoted field. Re-download the original file; do not open and re-save it in Excel first.');
  if (field.length || row.length) { row.push(field); if (row.some((v) => v.trim() !== '')) records.push(row); }
  if (records.length < 2) throw new Error('CSV is empty or contains only a header row.');
  const headers = records[0].map((h) => h.trim().toLowerCase().replace(/^\uFEFF/, ''));
  if (new Set(headers).size !== headers.length) throw new Error(`CSV has duplicate column headings: ${headers.join(', ')}`);
  return records.slice(1).map((cells, index) => {
    const rowObject = {};
    headers.forEach((header, col) => { rowObject[header] = cells[col] ?? ''; });
    rowObject.__row = index + 2;
    return rowObject;
  });
}
async function loadCsv(filename, required, sourceName) {
  const path = resolve(INPUT, filename);
  let raw;
  try { raw = await readFile(path, 'utf8'); }
  catch { throw new Error(`Missing ${sourceName} file: ${path}\nDownload it in your browser and save it with the exact filename: ${filename}`); }
  const rows = parseCsv(raw);
  const headers = Object.keys(rows[0] ?? {}).filter((key) => key !== '__row');
  const missing = required.filter((field) => !headers.includes(field.toLowerCase()));
  if (missing.length) throw new Error(`${filename} does not look like the expected ${sourceName} CSV. Missing columns: ${missing.join(', ')}. Found: ${headers.join(', ')}`);
  const url = filename === HEAR_FILE ? SOURCES.hear : filename === GUSHI_WORD_FILE ? SOURCES.gushiWords : SOURCES.gushiChars;
  const sha256 = createHash('sha256').update(raw, 'utf8').digest('hex');
  return { rows, raw, manifest: { url, sha256, localFilename: filename } };
}
function normalizeHearRow(raw, level) {
  const hanzi = readCell(raw, 'simplified');
  const pinyin = readCell(raw, 'pinyin');
  const traditional = readCell(raw, 'traditional');
  const gloss = readCell(raw, 'gloss_en');
  const levelTag = `old-${level}`;
  const form = { traditional, pinyin, meanings: meanings(gloss), classifiers: [], levels: [levelTag], sources: ['HearMandarin, HSK 2.0 list fields, CC BY 4.0'] };
  return {
    id: `hsk:${hanzi}`, hanzi, traditional, pinyin, meanings: form.meanings, radical: '', levels: [levelTag], forms: [form], examples: [],
    partsOfSpeech: unique([...readCell(raw, 'pos_en').split(';'), ...readCell(raw, 'pos_zh').split(';')]),
  };
}
function normalizeGushiWord(raw, level) {
  const hanzi = readCell(raw, 'hanzi');
  const pinyin = readCell(raw, 'pinyin');
  const gloss = readCell(raw, 'meaning');
  const levelTag = `new-${level}`;
  const wordMeanings = meanings(gloss);
  const form = { traditional: '', pinyin, meanings: wordMeanings, classifiers: [], levels: [levelTag], sources: ['Gushi, HSK 3.0 syllabus data, CC BY-SA 4.0'] };
  const exampleHanzi = readCell(raw, 'examplechinese');
  const examples = exampleHanzi ? [{ hanzi: exampleHanzi, pinyin: readCell(raw, 'examplepinyin'), meaning: readCell(raw, 'exampleenglish'), level: levelTag, source: 'Gushi' }] : [];
  return { id: `hsk:${hanzi}`, hanzi, traditional: '', pinyin, meanings: wordMeanings, radical: '', levels: [levelTag], forms: [form], examples, partsOfSpeech: [] };
}
function normalizeGushiCharacter(raw, level) {
  const hanzi = readCell(raw, 'hanzi');
  return { hanzi, levels: [`new-${level}`], pinyin: readCell(raw, 'pinyin'), meaning: readCell(raw, 'meaning'), exampleChinese: readCell(raw, 'examplechinese'), examplePinyin: readCell(raw, 'examplepinyin'), exampleEnglish: readCell(raw, 'exampleenglish'), radical: '', components: [], source: 'Gushi' };
}
function mergeEntry(a, b) {
  const mergeForms = (forms) => {
    const map = new Map();
    for (const f of forms) {
      const key = `${f.traditional}|${f.pinyin}|${f.meanings.join('|')}|${f.classifiers.join('|')}`;
      const old = map.get(key);
      map.set(key, old ? { ...old, levels: unique([...old.levels, ...f.levels]), sources: unique([...old.sources, ...f.sources]) } : f);
    }
    return [...map.values()];
  };
  const exampleMap = new Map();
  for (const example of [...a.examples, ...b.examples]) exampleMap.set(`${example.level}|${example.hanzi}|${example.pinyin}|${example.meaning}`, example);
  return { ...a, traditional: a.traditional || b.traditional, pinyin: a.pinyin || b.pinyin, meanings: unique([...a.meanings, ...b.meanings]), levels: unique([...a.levels, ...b.levels]), forms: mergeForms([...a.forms, ...b.forms]), examples: [...exampleMap.values()], partsOfSpeech: unique([...a.partsOfSpeech, ...b.partsOfSpeech]) };
}
function checkLevelRows(rows, getLevel, expected, label, headwordField, isCharacter = false) {
  const byLevel = new Map();
  for (const row of rows) {
    const value = getLevel(row);
    if (!value) continue;
    const level = Number(value);
    if (!Number.isInteger(level) || level < 1 || level > 6) continue;
    const list = byLevel.get(level) ?? [];
    list.push(row); byLevel.set(level, list);
  }
  for (let level = 1; level <= 6; level++) {
    const list = byLevel.get(level) ?? [];
    if (list.length !== expected[level - 1]) throw new Error(`${label} level ${level}: expected ${expected[level - 1]} rows, found ${list.length}. Check that you downloaded the “all levels” CSV from the correct source and did not resave/filter it.`);
    const forms = list.map((row) => readCell(row, headwordField));
    if (forms.some((h) => !h || !isHan(h))) throw new Error(`${label} level ${level} has a row without a Chinese ${isCharacter ? 'character' : 'headword'}.`);
    if (isCharacter && forms.some((h) => [...h].length !== 1)) throw new Error(`${label} level ${level} contains a word rather than a single Hanzi character.`);
  }
  return byLevel;
}
function sum(xs) { return xs.reduce((a, b) => a + b, 0); }

async function main() {
  const hear = await loadCsv(HEAR_FILE, ['simplified','traditional','pinyin','hsk2_level','gloss_en'], 'HearMandarin word');
  const gushiWords = await loadCsv(GUSHI_WORD_FILE, ['level','hanzi','pinyin','meaning','examplechinese','examplepinyin','exampleenglish'], 'Gushi word');
  const gushiChars = await loadCsv(GUSHI_CHAR_FILE, ['level','hanzi','pinyin','meaning'], 'Gushi character');
  const oldRowsByLevel = checkLevelRows(hear.rows, row => readCell(row, 'hsk2_level'), EXPECTED_OLD, 'HSK 2.0', 'simplified');
  // Gushi is the primary source of HSK 3.0 level membership and context examples.
  const newRowsByLevel = checkLevelRows(gushiWords.rows, row => readCell(row, 'level'), EXPECTED_NEW, 'HSK 3.0 vocabulary', 'hanzi');
  const charRowsByLevel = checkLevelRows(gushiChars.rows, row => readCell(row, 'level'), EXPECTED_CHARS, 'HSK 3.0 reading-character', 'hanzi', true);

  const combined = new Map();
  for (let level = 1; level <= 6; level++) {
    for (const row of oldRowsByLevel.get(level)) {
      const entry = normalizeHearRow(row, level);
      if (combined.has(entry.hanzi)) combined.set(entry.hanzi, mergeEntry(combined.get(entry.hanzi), entry));
      else combined.set(entry.hanzi, entry);
    }
    for (const row of newRowsByLevel.get(level)) {
      const entry = normalizeGushiWord(row, level);
      if (combined.has(entry.hanzi)) combined.set(entry.hanzi, mergeEntry(combined.get(entry.hanzi), entry));
      else combined.set(entry.hanzi, entry);
    }
  }
  const entries = [...combined.values()].sort((a,b)=>a.hanzi.localeCompare(b.hanzi, 'zh-CN'));
  const characterMap = new Map();
  for (let level = 1; level <= 6; level++) {
    for (const row of charRowsByLevel.get(level)) {
      const ch = normalizeGushiCharacter(row, level);
      if (characterMap.has(ch.hanzi)) {
        const prev = characterMap.get(ch.hanzi);
        characterMap.set(ch.hanzi, { ...prev, levels: unique([...prev.levels, ...ch.levels]), pinyin: prev.pinyin || ch.pinyin, meaning: prev.meaning || ch.meaning, exampleChinese: prev.exampleChinese || ch.exampleChinese, examplePinyin: prev.examplePinyin || ch.examplePinyin, exampleEnglish: prev.exampleEnglish || ch.exampleEnglish });
      } else characterMap.set(ch.hanzi, ch);
    }
  }
  const characters = [...characterMap.values()].sort((a,b)=>a.hanzi.localeCompare(b.hanzi, 'zh-CN'));
  const allHanzi = new Set();
  for (const entry of entries) {
    for (const char of `${entry.hanzi}${entry.traditional ?? ''}${(entry.forms ?? []).map(form => form.traditional ?? '').join('')}`) if (isHan(char)) allHanzi.add(char);
  }
  for (const character of characters) allHanzi.add(character.hanzi);
  const levelCounts = { old: {}, new: {} };
  const cumulativeCounts = { old: {}, new: {} };
  for (let level = 1; level <= 6; level++) {
    levelCounts.old[String(level)] = (oldRowsByLevel.get(level) ?? []).length;
    levelCounts.new[String(level)] = (newRowsByLevel.get(level) ?? []).length;
  }
  for (const scheme of ['old','new']) {
    let cumulative = 0;
    for (let level = 1; level <= 6; level++) { cumulative += levelCounts[scheme][String(level)]; cumulativeCounts[scheme][String(level)] = cumulative; }
  }
  const oldCount = sum(EXPECTED_OLD), newCount = sum(EXPECTED_NEW), characterCount = sum(EXPECTED_CHARS);
  if (oldCount !== 5000 || newCount !== 5400 || characters.length !== characterCount || entries.length <= 4500 || allHanzi.size < 1800) throw new Error(`Final integrity check failed (HSK2=${oldCount}, HSK3=${newCount}, character index=${characters.length}, words=${entries.length}, unique Hanzi=${allHanzi.size}). No output was written.`);

  const manifest = [hear.manifest, gushiWords.manifest, gushiChars.manifest].sort((a,b)=>a.url.localeCompare(b.url));
  const data = {
    metadata: {
      status: 'synced',
      source: 'HSK 2.0 level assignments and glosses: HearMandarin combined HSK vocabulary dataset; HSK 3.0 vocabulary/examples and reading characters: Gushi, official syllabus published November 2025',
      sourceUrl: 'https://hearmandarin.com/datasets/',
      sourceVersion: 'local-csv-hearmandarin-gushi-2026-10-14',
      license: 'HearMandarin word data CC BY 4.0; Gushi HSK 3.0 vocabulary, examples and reading-character data CC BY-SA 4.0',
      generatedAt: new Date().toISOString(), sourceUpdated: '2026-10-14',
      sourceEntryCount: oldCount + newCount, entryCount: entries.length, hanziCount: allHanzi.size, characterSyllabusCount: characterCount,
      oldCount, newCount, levelCounts, counts: cumulativeCounts, listsLoaded: 18, listsExpected: 18, sourceFiles: manifest,
    },
    entries, characters,
  };
  const noticeText = `# Yukoto third-party data notices\n\n## HSK 2.0 vocabulary metadata and glosses\nSource: [HearMandarin HSK word-list dataset](https://hearmandarin.com/datasets/), dataset version 2026-09-28. The combined file includes HSK 2.0 level fields based on the 2015 HSK 2.0 word list. Licensed under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Attribution: HearMandarin (https://hearmandarin.com).\n\n## HSK 3.0 vocabulary, examples, and reading characters\nSource: [HSK 3.0 syllabus data by Gushi](https://gushichinese.com/hsk-3.0/downloads), based on the official syllabus published in November 2025; checked 2026-10-14. Licensed under [Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Attribution: HSK 3.0 syllabus data by Gushi, https://gushichinese.com/hsk-3.0/downloads. Adapted HSK 3.0 data must retain attribution and be shared under CC BY-SA 4.0. The examples come largely from Tatoeba (CC BY 2.0 FR) and examples written for Gushi, as described by Gushi.\n\n## Audio exclusion\nThe source CSV includes audio URL fields, but Yukoto intentionally does not store or hotlink these recordings because Gushi explicitly excludes synthesized audio from the data licence. Yukoto uses browser speech synthesis.\n\n## Import provenance\nThis local import was produced from three CSV files supplied by the project operator. SHA-256 fingerprints and original source URLs are recorded in src/data/curriculum.json. The import validates all six HSK 2.0 vocabulary levels, all six HSK 3.0 vocabulary levels, and all six HSK 3.0 reading-character levels against the currently documented level counts.\n`;

  await mkdir(dirname(TARGET), { recursive: true });
  const temp = `${TARGET}.tmp`;
  await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await rename(temp, TARGET);
  await writeFile(NOTICES, noticeText, 'utf8');
  console.log('Local curriculum import passed all checks.');
  console.log(`HSK 2.0: ${oldCount.toLocaleString()} words (${EXPECTED_OLD.join(', ')} by level).`);
  console.log(`HSK 3.0: ${newCount.toLocaleString()} words (${EXPECTED_NEW.join(', ')} by level).`);
  console.log(`HSK 3.0 reading-character assignments: ${characterCount.toLocaleString()} (${EXPECTED_CHARS.join(', ')} by level).`);
  console.log(`Merged vocabulary index: ${entries.length.toLocaleString()} headwords; unique Hanzi: ${allHanzi.size.toLocaleString()}.`);
  console.log('Wrote src/data/curriculum.json and THIRD_PARTY_NOTICES.md.');
}
main().catch((error) => { console.error(`Local CSV import FAILED: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; });
