import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';

async function main() {
const OLD_VERSION = 'v1.4';
const UPDATED = '2026-10-14';
const OLD_REPO = 'https://github.com/drkameleon/complete-hsk-vocabulary';
const OLD_BASE = `https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/${OLD_VERSION}/wordlists/exclusive/old`;
const GUSHI_PAGE = 'https://gushichinese.com/hsk-3.0/downloads';
const GUSHI_BASE = `${GUSHI_PAGE}/hsk-3.0`;
const TARGET = resolve('src/data/curriculum.json');
const NOTICES = resolve('THIRD_PARTY_NOTICES.md');
const EXPECTED_LISTS = 18;
const sourceFiles = new Map();
const OLD_WORD_COUNTS = [150, 150, 300, 600, 1300, 2500];
const GUSHI_WORD_COUNTS = [300, 200, 500, 1000, 1600, 1800];
const GUSHI_CHARACTER_COUNTS = [246, 125, 284, 441, 431, 413];
const uniqueStrings = values => [...new Set((Array.isArray(values) ? values : []).filter(value => typeof value === 'string' && value.trim()).map(value => value.trim()))];
const splitMeanings = value => uniqueStrings(typeof value === 'string' ? value.split(/\s*;\s*/) : value);
const isHan = value => /\p{Script=Han}/u.test(value);

async function fetchText(url) {
  let response;
  try { response = await fetch(url, { headers: { 'User-Agent': 'Yukoto-Curriculum-Sync/3.0', Accept: 'application/json,text/plain,*/*' }, signal: AbortSignal.timeout(12000) }); }
  catch (error) { throw new Error(`Network request failed for ${url}: ${error instanceof Error ? error.message : String(error)}`); }
  if (!response.ok) throw new Error(`HTTP ${response.status} while retrieving ${url}`);
  return response.text();
}
async function fetchJson(url) {
  const text = await fetchText(url);
  let parsed;
  try { parsed = JSON.parse(text); }
  catch (error) { throw new Error(`Invalid JSON payload from ${url}: ${error instanceof Error ? error.message : String(error)}`); }
  sourceFiles.set(url, createHash('sha256').update(text).digest('hex'));
  return parsed;
}
function normalizeOldForm(form = {}, tag) {
  const transcriptions = form.transcriptions ?? form.i ?? {};
  return {
    traditional: String(form.traditional ?? form.t ?? ''),
    pinyin: String(transcriptions.pinyin ?? transcriptions.y ?? ''),
    meanings: uniqueStrings(form.meanings ?? form.m),
    classifiers: uniqueStrings(form.classifiers ?? form.c),
    levels: [tag],
    sources: ['Complete HSK Vocabulary v1.4 / CC-CEDICT'],
  };
}
function normalizeOldEntry(raw, tag) {
  const hanzi = String(raw.simplified ?? raw.s ?? raw.word ?? raw.w ?? '').trim();
  if (!hanzi || !isHan(hanzi)) return null;
  const rawForms = raw.forms ?? raw.f ?? [];
  const forms = (Array.isArray(rawForms) ? rawForms : [rawForms]).map(form => normalizeOldForm(form, tag));
  const viable = forms.filter(form => form.pinyin || form.meanings.length || form.traditional);
  const first = viable[0] ?? { traditional: '', pinyin: '', meanings: [], classifiers: [], levels: [tag], sources: ['Complete HSK Vocabulary v1.4'] };
  return {
    id: `hsk:${hanzi}`, hanzi,
    traditional: first.traditional || String(raw.traditional ?? raw.t ?? ''),
    pinyin: first.pinyin,
    meanings: uniqueStrings(viable.flatMap(form => form.meanings)),
    radical: String(raw.radical ?? raw.r ?? ''), levels: [tag], forms: viable, examples: [],
    frequency: Number.isFinite(Number(raw.frequency ?? raw.q)) ? Number(raw.frequency ?? raw.q) : undefined,
    partsOfSpeech: uniqueStrings(raw.pos ?? raw.p),
  };
}
function normalizeGushiEntry(raw, level) {
  const hanzi = String(raw.hanzi ?? '').trim();
  if (!hanzi || !isHan(hanzi)) return null;
  const tag = `new-${level}`;
  const meanings = splitMeanings(raw.meaning);
  return {
    id: `hsk:${hanzi}`, hanzi, traditional: '', pinyin: String(raw.pinyin ?? ''), meanings, radical: '', levels: [tag],
    forms: [{ traditional: '', pinyin: String(raw.pinyin ?? ''), meanings, classifiers: [], levels: [tag], sources: ['Gushi HSK 3.0 CC BY-SA 4.0'] }],
    examples: raw.exampleChinese ? [{ hanzi: String(raw.exampleChinese), pinyin: String(raw.examplePinyin ?? ''), meaning: String(raw.exampleEnglish ?? ''), level: tag, source: 'Gushi' }] : [],
    frequency: undefined, partsOfSpeech: [],
  };
}
function mergeForms(forms) {
  const map = new Map();
  for (const form of forms) {
    const key = `${form.traditional}|${form.pinyin}|${form.meanings.join('|')}|${form.classifiers.join('|')}`;
    const prior = map.get(key);
    map.set(key, prior ? { ...prior, levels: uniqueStrings([...prior.levels, ...form.levels]), sources: uniqueStrings([...prior.sources, ...form.sources]) } : form);
  }
  return [...map.values()];
}
function mergeEntry(a, b) {
  const examples = new Map();
  for (const example of [...a.examples, ...b.examples]) examples.set(`${example.level}|${example.hanzi}|${example.pinyin}|${example.meaning}`, example);
  return {
    ...a,
    traditional: a.traditional || b.traditional,
    pinyin: a.pinyin || b.pinyin,
    radical: a.radical || b.radical,
    meanings: uniqueStrings([...a.meanings, ...b.meanings]),
    levels: uniqueStrings([...a.levels, ...b.levels]),
    forms: mergeForms([...a.forms, ...b.forms]),
    examples: [...examples.values()],
    partsOfSpeech: uniqueStrings([...a.partsOfSpeech, ...b.partsOfSpeech]),
    frequency: a.frequency ?? b.frequency,
  };
}
function normalizeCharacter(raw, level) {
  const hanzi = String(raw.hanzi ?? '').trim();
  if (!hanzi || [...hanzi].length !== 1 || !isHan(hanzi)) return null;
  return { hanzi, levels: [`new-${level}`], pinyin: String(raw.pinyin ?? ''), meaning: String(raw.meaning ?? ''), exampleChinese: String(raw.exampleChinese ?? ''), examplePinyin: String(raw.examplePinyin ?? ''), exampleEnglish: String(raw.exampleEnglish ?? ''), radical: String(raw.radical ?? raw.radicalName ?? ''), components: uniqueStrings(Array.isArray(raw.components) ? raw.components : []), strokes: raw.strokes != null && raw.strokes !== '' && Number.isFinite(Number(raw.strokes)) ? Number(raw.strokes) : undefined, source: 'Gushi' };
}
function mergeCharacterRows(rows) {
  const map = new Map();
  for (const row of rows) {
    const prior = map.get(row.hanzi);
    map.set(row.hanzi, prior ? { ...prior, levels: uniqueStrings([...prior.levels, ...row.levels]) } : row);
  }
  return [...map.values()];
}

const jobs = [
  ...Array.from({ length: 6 }, (_, index) => ({ kind: 'old-word', level: index + 1 })),
  ...Array.from({ length: 6 }, (_, index) => ({ kind: 'new-word', level: index + 1 })),
  ...Array.from({ length: 6 }, (_, index) => ({ kind: 'new-character', level: index + 1 })),
];
const combined = new Map();
const characterRows = [];
const levelCounts = { old: {}, new: {} };
let loaded = 0;
let sourceEntryCount = 0;
for (let start = 0; start < jobs.length; start += 3) {
  const group = await Promise.all(jobs.slice(start, start + 3).map(async job => {
    const tag = `${job.kind.startsWith('old') ? 'old' : 'new'}-${job.level}`;
    if (job.kind === 'old-word') {
      const rows = await fetchJson(`${OLD_BASE}/${job.level}.min.json`);
      const expected = OLD_WORD_COUNTS[job.level - 1];
      if (!Array.isArray(rows) || rows.length !== expected) throw new Error(`HSK 2.0 level ${job.level} failed its pinned source-count check: expected ${expected} rows, got ${Array.isArray(rows) ? rows.length : 'not an array'}.`);
      const entries = rows.map(row => normalizeOldEntry(row, tag)).filter(Boolean);
      if (entries.length !== expected || new Set(entries.map(entry => entry.hanzi)).size !== expected) throw new Error(`HSK 2.0 level ${job.level}: expected ${expected} valid, unique records, got ${entries.length}.`);
      return { job, rows: rows.length, entries, characters: [] };
    }
    const kind = job.kind === 'new-word' ? 'words' : 'characters';
    const expected = job.kind === 'new-word' ? GUSHI_WORD_COUNTS[job.level - 1] : GUSHI_CHARACTER_COUNTS[job.level - 1];
    const payload = await fetchJson(`${GUSHI_BASE}-${kind}-${job.level}.json`);
    const expectedKind = job.kind === 'new-word' ? 'words' : 'chars';
    if (payload?.level !== job.level || payload?.kind !== expectedKind || Number(payload?.count) !== expected || !payload?.license?.includes('CC BY-SA 4.0') || !payload?.source?.includes('November 2025') || payload?.updated !== UPDATED || !Array.isArray(payload?.data) || payload.data.length !== expected) {
      throw new Error(`HSK 3.0 ${kind}, level ${job.level}, failed the pinned completeness check. Expected ${expected} verified rows; no partial import was saved.`);
    }
    if (job.kind === 'new-word') {
      const entries = payload.data.map(row => normalizeGushiEntry(row, job.level)).filter(Boolean);
      if (entries.length !== expected || new Set(entries.map(entry => entry.hanzi)).size !== expected) throw new Error(`HSK 3.0 words level ${job.level}: expected ${expected} valid, unique entries; got ${entries.length}.`);
      return { job, rows: payload.data.length, entries, characters: [] };
    }
    const characters = payload.data.map(row => normalizeCharacter(row, job.level)).filter(Boolean);
    if (characters.length !== expected) throw new Error(`HSK 3.0 character level ${job.level}: expected ${expected} valid entries; got ${characters.length}.`);
    return { job, rows: payload.data.length, entries: [], characters };
  }));
  for (const result of group) {
    loaded++;
    sourceEntryCount += result.job.kind === 'new-character' ? 0 : result.rows;
    if (result.job.kind !== 'new-character') levelCounts[result.job.kind === 'old-word' ? 'old' : 'new'][String(result.job.level)] = result.rows;
    for (const entry of result.entries) combined.set(entry.hanzi, combined.has(entry.hanzi) ? mergeEntry(combined.get(entry.hanzi), entry) : entry);
    characterRows.push(...result.characters);
    console.log(`[${loaded}/${EXPECTED_LISTS}] ${result.job.kind === 'old-word' ? 'HSK 2.0' : result.job.kind === 'new-word' ? 'HSK 3.0 words' : 'HSK 3.0 characters'} level ${result.job.level}: ${result.rows} verified rows`);
  }
}

const entries = [...combined.values()].sort((a, b) => (a.frequency ?? Number.MAX_SAFE_INTEGER) - (b.frequency ?? Number.MAX_SAFE_INTEGER) || a.hanzi.localeCompare(b.hanzi, 'zh-CN'));
const characters = mergeCharacterRows(characterRows);
const allHanzi = new Set();
for (const entry of entries) {
  for (const char of entry.hanzi) if (isHan(char)) allHanzi.add(char);
  for (const char of entry.traditional) if (isHan(char)) allHanzi.add(char);
  for (const form of entry.forms) for (const char of form.traditional) if (isHan(char)) allHanzi.add(char);
}
for (const character of characters) allHanzi.add(character.hanzi);
const counts = { old: {}, new: {} };
for (const scheme of ['old', 'new']) {
  let cumulative = 0;
  for (let level = 1; level <= 6; level++) {
    cumulative += levelCounts[scheme][String(level)] ?? 0;
    counts[scheme][String(level)] = cumulative;
  }
}
const expectedOldWords = OLD_WORD_COUNTS.reduce((sum, value) => sum + value, 0);
const expectedNewWords = GUSHI_WORD_COUNTS.reduce((sum, value) => sum + value, 0);
const expectedCharacters = GUSHI_CHARACTER_COUNTS.reduce((sum, value) => sum + value, 0);
if (loaded !== EXPECTED_LISTS || counts.old['6'] !== expectedOldWords || counts.new['6'] !== expectedNewWords || characters.length !== expectedCharacters || allHanzi.size < 1800 || entries.length <= 4500) {
  throw new Error(`Completeness sanity check failed. Lists=${loaded}/${EXPECTED_LISTS}; HSK2.0 rows=${counts.old['6']}/${expectedOldWords}; HSK3.0 rows=${counts.new['6']}/${expectedNewWords}; official HSK3.0 characters=${characters.length}; all unique Hanzi=${allHanzi.size}. No output was written.`);
}
for (let level = 1; level <= 6; level++) {
  for (const [scheme, expected] of [['old', OLD_WORD_COUNTS[level - 1]], ['new', GUSHI_WORD_COUNTS[level - 1]]]) {
    const tagged = entries.filter(entry => entry.levels.includes(`${scheme}-${level}`)).length;
    if (tagged !== expected) throw new Error(`Merged headword index lost or added ${scheme.toUpperCase()} level ${level} links: expected ${expected}, got ${tagged}. No output was written.`);
  }
  const taggedCharacters = characters.filter(character => character.levels.includes(`new-${level}`)).length;
  if (taggedCharacters !== GUSHI_CHARACTER_COUNTS[level - 1]) throw new Error(`HSK 3.0 character level ${level} links expected ${GUSHI_CHARACTER_COUNTS[level - 1]}, got ${taggedCharacters}. No output was written.`);
}

const oldLicense = await fetchText(`https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/${OLD_VERSION}/LICENSE`);
if (!oldLicense.startsWith('MIT License') || !/\bcopyright\b/i.test(oldLicense)) throw new Error('The upstream HSK 2.0 MIT license could not be verified; no output was written.');
const gushiLicenseUrl = `${GUSHI_PAGE}/LICENCE.txt`;
const gushiLicense = await fetchText(gushiLicenseUrl);
const oldLicenseUrl = `https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/${OLD_VERSION}/LICENSE`;
sourceFiles.set(oldLicenseUrl, createHash('sha256').update(oldLicense).digest('hex'));
sourceFiles.set(gushiLicenseUrl, createHash('sha256').update(gushiLicense).digest('hex'));
const compactGushiLicense = gushiLicense.toUpperCase().replace(/[\s-]/g, '');
if ((!compactGushiLicense.includes('CCBYSA4.0') && !compactGushiLicense.includes('ATTRIBUTIONSHAREALIKE4.0')) || !gushiLicense.includes('Gushi')) throw new Error('Gushi attribution/share-alike license could not be verified; no output was written.');

const data = {
  metadata: {
    status: 'synced',
    source: 'HSK 2.0: Complete HSK Vocabulary v1.4; HSK 3.0: Gushi official syllabus data, November 2025, checked 2026-10-14',
    sourceUrl: OLD_REPO,
    sourceVersion: `hsk20-${OLD_VERSION}+hsk30-gushi-${UPDATED}`,
    license: 'HSK 2.0 compilation MIT with CC-CEDICT-derived definitions; HSK 3.0 vocabulary and character data CC BY-SA 4.0 (Gushi)',
    generatedAt: new Date().toISOString(), sourceUpdated: UPDATED,
    sourceEntryCount, entryCount: entries.length, hanziCount: allHanzi.size, characterSyllabusCount: characters.length,
    oldCount: counts.old['6'], newCount: counts.new['6'], levelCounts, counts,
    listsLoaded: loaded, listsExpected: EXPECTED_LISTS,
    sourceFiles: [...sourceFiles.entries()].map(([url, sha256]) => ({ url, sha256 })).sort((a, b) => a.url.localeCompare(b.url)),
  },
  entries, characters,
};
await mkdir(dirname(TARGET), { recursive: true });
const noticeText = `# Yukoto third-party data notices\n\n## HSK 2.0 vocabulary\nSource: [Complete HSK Vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary), pinned release ${OLD_VERSION}. Original level lists: ${OLD_BASE}/{1..6}.min.json. The source compilation is MIT-licensed; the source project documents dictionary definitions derived from [CC-CEDICT](https://www.mdbg.net/chinese/dictionary), CC BY-SA 4.0. Preserve the notices and applicable ShareAlike conditions for adapted dictionary definitions.\n\n${oldLicense}\n\n## HSK 3.0 vocabulary and reading characters\nAttribution: [HSK 3.0 syllabus data by Gushi](https://gushichinese.com/hsk-3.0/downloads), licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The list is based on the official HSK 3.0 syllabus published November 2025; Gushi says the data was checked on 2026-10-14. Definitions derive from CC-CEDICT (CC BY-SA 4.0). Examples are described by Gushi as largely from [Tatoeba](https://tatoeba.org), CC BY 2.0 FR, plus examples written for Gushi. Adapted HSK 3.0 data redistributed by Yukoto must retain attribution and be shared under CC BY-SA 4.0.\n\n${gushiLicense}\n\n## Audio exclusion\nThe Gushi word and character JSON files include audio URLs, but Yukoto intentionally does not store or hotlink these recordings: Gushi explicitly excludes synthesized audio from the data licence. Yukoto uses the learner's browser speech synthesis instead.\n\n## Completeness and scope\nThe importer verifies all 18 source files: six HSK 2.0 vocabulary lists, six HSK 3.0 vocabulary lists, and six HSK 3.0 reading-character lists. It checks the documented row counts for the current HSK 3.0 levels 1–6, validates file metadata and licensing markers, and refuses to write a partial curriculum. HSK 2.0 counts are calculated from the pinned source files and checked against a broad minimum because that source does not provide a machine-readable count manifest. These checks confirm source-file consistency, not independent word-by-word auditing against a testing authority. The official syllabus remains authoritative if any compilation differs. HSK 3.0 levels 7–9 are intentionally outside Yukoto's current level 1–6 interface.\n`;
const tempTarget = `${TARGET}.tmp-${process.pid}`;
const tempNotices = `${NOTICES}.tmp-${process.pid}`;
try {
  await mkdir(dirname(TARGET), { recursive: true });
  await writeFile(tempTarget, JSON.stringify(data));
  await writeFile(tempNotices, noticeText);
  await rename(tempTarget, TARGET);
  await rename(tempNotices, NOTICES);
} finally {
  await rm(tempTarget, { force: true });
  await rm(tempNotices, { force: true });
}
console.log(`\nImported ${entries.length} unique headwords; HSK 2.0 source rows ${counts.old['6']}; HSK 3.0 source rows ${counts.new['6']}; ${characters.length} official HSK 3.0 reading characters; ${allHanzi.size} unique Hanzi. All ${loaded}/${EXPECTED_LISTS} source lists verified.`);
console.log(`Wrote ${TARGET} and ${NOTICES}. Keep the curriculum data notice with redistributed copies.`);

}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nYukoto curriculum sync failed: ${message}`);
  console.error('No new curriculum file was written. Check source availability and rerun npm run sync:curriculum.');
  process.exitCode = 1;
});
