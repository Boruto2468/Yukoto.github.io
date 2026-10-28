export type CurriculumExample = {
  hanzi: string;
  pinyin: string;
  meaning: string;
  level: string;
  source: 'Gushi';
};

export type CurriculumForm = {
  traditional: string;
  pinyin: string;
  meanings: string[];
  classifiers: string[];
  levels: string[];
  sources: string[];
};

export type CurriculumEntry = {
  id: string;
  hanzi: string;
  traditional: string;
  pinyin: string;
  meanings: string[];
  radical: string;
  levels: string[];
  forms: CurriculumForm[];
  examples: CurriculumExample[];
  frequency?: number;
  partsOfSpeech: string[];
};

export type CurriculumCharacter = {
  hanzi: string;
  levels: string[];
  pinyin: string;
  meaning: string;
  exampleChinese: string;
  examplePinyin: string;
  exampleEnglish: string;
  radical: string;
  components: string[];
  strokes?: number;
  source: 'Gushi';
};

export type CurriculumData = {
  metadata: {
    status: string;
    source: string;
    sourceUrl: string;
    sourceVersion: string;
    license: string;
    generatedAt: string | null;
    sourceEntryCount: number;
    entryCount: number;
    hanziCount: number;
    characterSyllabusCount: number;
    oldCount: number;
    newCount: number;
    levelCounts: { old: Record<string, number>; new: Record<string, number> };
    counts: { old: Record<string, number>; new: Record<string, number> };
    listsLoaded: number;
    listsExpected: number;
    sourceUpdated: string;
    sourceFiles: Array<{ url: string; sha256: string }>;
  };
  entries: CurriculumEntry[];
  characters: CurriculumCharacter[];
};

export type CurriculumLoadState = {
  status: 'idle' | 'loading' | 'cached' | 'ready' | 'error';
  loaded: number;
  total: number;
  message?: string;
};

export const OLD_SOURCE_VERSION = 'v1.4';
export const NEW_SOURCE_UPDATED = '2026-10-14';
export const SOURCE_VERSION = `hsk20-${OLD_SOURCE_VERSION}+hsk30-gushi-${NEW_SOURCE_UPDATED}`;
export const SOURCE_REPOSITORY = 'https://github.com/drkameleon/complete-hsk-vocabulary';
export const OLD_SOURCE_BASE = `https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/${OLD_SOURCE_VERSION}/wordlists/exclusive/old`;
export const GUSHI_DOWNLOADS = 'https://gushichinese.com/hsk-3.0/downloads';
export const GUSHI_BASE = `${GUSHI_DOWNLOADS}/hsk-3.0`;
export const EXPECTED_LISTS = 18;
export const OLD_WORD_COUNTS = [150, 150, 300, 600, 1300, 2500];
export const GUSHI_WORD_COUNTS = [300, 200, 500, 1000, 1600, 1800];
export const GUSHI_CHARACTER_COUNTS = [246, 125, 284, 441, 431, 413];

export const emptyCurriculum: CurriculumData = {
  metadata: {
    status: 'not-synced',
    source: 'HSK 2.0: Complete HSK Vocabulary; HSK 3.0: Gushi, official syllabus published November 2025',
    sourceUrl: SOURCE_REPOSITORY,
    sourceVersion: SOURCE_VERSION,
    license: 'HSK 2.0 compilation MIT; CC-CEDICT-derived definitions and HSK 3.0 word/character data CC BY-SA 4.0',
    generatedAt: null,
    sourceEntryCount: 0,
    entryCount: 0,
    hanziCount: 0,
    characterSyllabusCount: 0,
    oldCount: 0,
    newCount: 0,
    levelCounts: { old: {}, new: {} },
    counts: { old: {}, new: {} },
    listsLoaded: 0,
    listsExpected: EXPECTED_LISTS,
    sourceUpdated: NEW_SOURCE_UPDATED,
    sourceFiles: [],
  },
  entries: [],
  characters: [],
};

const uniqueStrings = (items: unknown[]): string[] => [...new Set(items.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map(item => item.trim()))];
const isHan = (value: string) => /\p{Script=Han}/u.test(value);
const splitMeanings = (value: unknown): string[] => uniqueStrings(typeof value === 'string' ? value.split(/\s*;\s*/) : Array.isArray(value) ? value : []);

function normalizeOldForm(form: any, tag: string): CurriculumForm {
  const transcription = form?.transcriptions ?? form?.i ?? {};
  const meanings = form?.meanings ?? form?.m ?? [];
  const classifiers = form?.classifiers ?? form?.c ?? [];
  return {
    traditional: String(form?.traditional ?? form?.t ?? ''),
    pinyin: String(transcription?.pinyin ?? transcription?.y ?? ''),
    meanings: uniqueStrings(Array.isArray(meanings) ? meanings : []),
    classifiers: uniqueStrings(Array.isArray(classifiers) ? classifiers : []),
    levels: [tag],
    sources: ['Complete HSK Vocabulary v1.4 / CC-CEDICT'],
  };
}

function normalizeOldRecord(raw: any, tag: string): CurriculumEntry | null {
  const hanzi = String(raw?.simplified ?? raw?.s ?? raw?.word ?? raw?.w ?? '').trim();
  if (!hanzi || !isHan(hanzi)) return null;
  const rawForms = raw?.forms ?? raw?.f ?? [];
  const forms = (Array.isArray(rawForms) ? rawForms : [rawForms]).map((form: any) => normalizeOldForm(form, tag));
  const viableForms = forms.filter((form: CurriculumForm) => form.pinyin || form.meanings.length || form.traditional);
  const first = viableForms[0] ?? { traditional: '', pinyin: '', meanings: [], classifiers: [], levels: [tag], sources: ['Complete HSK Vocabulary v1.4'] };
  return {
    id: `hsk:${hanzi}`,
    hanzi,
    traditional: first.traditional || String(raw?.traditional ?? raw?.t ?? ''),
    pinyin: first.pinyin,
    meanings: uniqueStrings(viableForms.flatMap((form: CurriculumForm) => form.meanings)),
    radical: String(raw?.radical ?? raw?.r ?? ''),
    levels: [tag],
    forms: viableForms,
    examples: [],
    frequency: Number.isFinite(Number(raw?.frequency ?? raw?.q)) ? Number(raw?.frequency ?? raw?.q) : undefined,
    partsOfSpeech: uniqueStrings(Array.isArray(raw?.pos ?? raw?.p) ? (raw?.pos ?? raw?.p) : []),
  };
}

function normalizeGushiWord(raw: any, level: number): CurriculumEntry | null {
  const hanzi = String(raw?.hanzi ?? '').trim();
  if (!hanzi || !isHan(hanzi)) return null;
  const tag = `new-${level}`;
  const meanings = splitMeanings(raw?.meaning);
  const form: CurriculumForm = {
    traditional: '',
    pinyin: String(raw?.pinyin ?? ''),
    meanings,
    classifiers: [],
    levels: [tag],
    sources: ['Gushi, official HSK 3.0 syllabus data, CC BY-SA 4.0'],
  };
  const example = raw?.exampleChinese ? [{
    hanzi: String(raw.exampleChinese),
    pinyin: String(raw?.examplePinyin ?? ''),
    meaning: String(raw?.exampleEnglish ?? ''),
    level: tag,
    source: 'Gushi' as const,
  }] : [];
  return {
    id: `hsk:${hanzi}`,
    hanzi,
    traditional: '',
    pinyin: form.pinyin,
    meanings,
    radical: '',
    levels: [tag],
    forms: [form],
    examples: example,
    frequency: undefined,
    partsOfSpeech: [],
  };
}

function mergeForms(left: CurriculumForm[], right: CurriculumForm[]): CurriculumForm[] {
  const map = new Map<string, CurriculumForm>();
  for (const form of [...left, ...right]) {
    const key = `${form.traditional}|${form.pinyin}|${form.meanings.join('|')}|${form.classifiers.join('|')}`;
    const previous = map.get(key);
    map.set(key, previous ? {
      ...previous,
      levels: uniqueStrings([...previous.levels, ...form.levels]),
      sources: uniqueStrings([...previous.sources, ...form.sources]),
    } : form);
  }
  return [...map.values()];
}

function mergeEntry(existing: CurriculumEntry, incoming: CurriculumEntry): CurriculumEntry {
  const exampleMap = new Map<string, CurriculumExample>();
  for (const example of [...existing.examples, ...incoming.examples]) {
    exampleMap.set(`${example.level}|${example.hanzi}|${example.pinyin}|${example.meaning}`, example);
  }
  const forms = mergeForms(existing.forms, incoming.forms);
  return {
    ...existing,
    traditional: existing.traditional || incoming.traditional,
    pinyin: existing.pinyin || incoming.pinyin,
    radical: existing.radical || incoming.radical,
    meanings: uniqueStrings([...existing.meanings, ...incoming.meanings]),
    levels: uniqueStrings([...existing.levels, ...incoming.levels]),
    forms,
    examples: [...exampleMap.values()],
    partsOfSpeech: uniqueStrings([...existing.partsOfSpeech, ...incoming.partsOfSpeech]),
    frequency: existing.frequency ?? incoming.frequency,
  };
}

function normalizeGushiCharacter(raw: any, level: number): CurriculumCharacter | null {
  const hanzi = String(raw?.hanzi ?? '').trim();
  if (!hanzi || [...hanzi].length !== 1 || !isHan(hanzi)) return null;
  return {
    hanzi,
    levels: [`new-${level}`],
    pinyin: String(raw?.pinyin ?? ''),
    meaning: String(raw?.meaning ?? ''),
    exampleChinese: String(raw?.exampleChinese ?? ''),
    examplePinyin: String(raw?.examplePinyin ?? ''),
    exampleEnglish: String(raw?.exampleEnglish ?? ''),
    radical: String(raw?.radical ?? raw?.radicalName ?? ''),
    components: uniqueStrings(Array.isArray(raw?.components) ? raw.components : []),
    strokes: raw?.strokes != null && raw?.strokes !== '' && Number.isFinite(Number(raw.strokes)) ? Number(raw.strokes) : undefined,
    source: 'Gushi',
  };
}

export function finalizeCurriculum(
  entries: CurriculumEntry[],
  characters: CurriculumCharacter[],
  listCount: number,
  sourceEntryCount: number,
  levelCounts: { old: Record<string, number>; new: Record<string, number> },
  status: 'synced' | 'cached' = 'synced',
): CurriculumData {
  const uniqueHanzi = new Set<string>();
  for (const entry of entries) {
    for (const char of entry.hanzi) if (isHan(char)) uniqueHanzi.add(char);
    for (const char of entry.traditional) if (isHan(char)) uniqueHanzi.add(char);
    for (const form of entry.forms) for (const char of form.traditional) if (isHan(char)) uniqueHanzi.add(char);
  }
  for (const character of characters) uniqueHanzi.add(character.hanzi);
  const counts = { old: {} as Record<string, number>, new: {} as Record<string, number> };
  for (const scheme of ['old', 'new'] as const) {
    let cumulative = 0;
    for (let level = 1; level <= 6; level++) {
      cumulative += levelCounts[scheme][String(level)] ?? 0;
      counts[scheme][String(level)] = cumulative;
    }
  }
  const characterMap = new Map<string, CurriculumCharacter>();
  for (const character of characters) {
    const existing = characterMap.get(character.hanzi);
    if (existing) {
      characterMap.set(character.hanzi, { ...existing, levels: uniqueStrings([...existing.levels, ...character.levels]) });
    } else characterMap.set(character.hanzi, character);
  }
  const uniqueCharacters = [...characterMap.values()];
  return {
    metadata: {
      ...emptyCurriculum.metadata,
      status,
      source: 'HSK 2.0: Complete HSK Vocabulary v1.4; HSK 3.0: Gushi official syllabus data, published November 2025 and checked 2026-10-14',
      sourceUrl: SOURCE_REPOSITORY,
      sourceVersion: SOURCE_VERSION,
      license: 'HSK 2.0 compilation MIT with CC-CEDICT-derived definitions; HSK 3.0 vocabulary and character data CC BY-SA 4.0 (Gushi)',
      generatedAt: new Date().toISOString(),
      sourceEntryCount,
      entryCount: entries.length,
      hanziCount: uniqueHanzi.size,
      characterSyllabusCount: uniqueCharacters.length,
      oldCount: counts.old['6'] ?? 0,
      newCount: counts.new['6'] ?? 0,
      levelCounts,
      counts,
      listsLoaded: listCount,
      listsExpected: EXPECTED_LISTS,
      sourceUpdated: NEW_SOURCE_UPDATED,
    },
    entries,
    characters: uniqueCharacters,
  };
}

function cacheDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise(resolve => {
    let request: IDBOpenDBRequest;
    try { request = indexedDB.open('yukoto-curriculum-cache', 3); }
    catch { resolve(null); return; }
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('datasets')) request.result.createObjectStore('datasets');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

export async function readCurriculumCache(): Promise<CurriculumData | null> {
  const db = await cacheDb();
  if (!db) return null;
  return new Promise(resolve => {
    try {
      const request = db.transaction('datasets', 'readonly').objectStore('datasets').get(SOURCE_VERSION);
      request.onsuccess = () => {
        const cached = request.result as CurriculumData | undefined;
        const valid = cached?.metadata?.sourceVersion === SOURCE_VERSION && cached.metadata.status !== 'not-synced' && cached.metadata.listsLoaded === EXPECTED_LISTS && cached.metadata.oldCount === OLD_WORD_COUNTS.reduce((sum, count) => sum + count, 0) && cached.metadata.newCount === GUSHI_WORD_COUNTS.reduce((sum, count) => sum + count, 0) && cached.metadata.characterSyllabusCount === GUSHI_CHARACTER_COUNTS.reduce((sum, count) => sum + count, 0) && Array.isArray(cached.entries) && cached.entries.length > 4500 && Array.isArray(cached.characters) && cached.characters.length === GUSHI_CHARACTER_COUNTS.reduce((sum, count) => sum + count, 0) && cached.metadata.hanziCount >= 1800 && Array.isArray(cached.metadata.sourceFiles) && cached.metadata.sourceFiles.filter(file => /\.json$/i.test(file.url) && /^[a-f0-9]{64}$/i.test(file.sha256)).length === EXPECTED_LISTS;
        resolve(valid ? { ...cached!, metadata: { ...cached!.metadata, status: 'cached' } } : null);
      };
      request.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

export async function writeCurriculumCache(data: CurriculumData): Promise<void> {
  const db = await cacheDb();
  if (!db) return;
  await new Promise<void>(resolve => {
    try {
      const transaction = db.transaction('datasets', 'readwrite');
      transaction.objectStore('datasets').put(data, SOURCE_VERSION);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
      transaction.onabort = () => resolve();
    } catch { resolve(); }
  });
}

const browserSourceDigests = new Map<string, string>();
async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-cache', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Could not load curriculum source (HTTP ${response.status}): ${url}`);
  const rawText = await response.text();
  try {
    const payload = JSON.parse(rawText);
    try {
      if (globalThis.crypto?.subtle) {
        const bytes = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawText));
        const digest = [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
        browserSourceDigests.set(url, digest);
      }
    } catch { /* A browser without Web Crypto can still load verified row counts. */ }
    return payload;
  } catch { throw new Error(`The source returned invalid JSON: ${url}`); }
}

let activeLoad: Promise<CurriculumData> | null = null;

export function loadCurriculum(onProgress?: (loaded: number, total: number, label: string) => void): Promise<CurriculumData> {
  if (activeLoad) return activeLoad;
  activeLoad = (async () => {
    browserSourceDigests.clear();
    const combined = new Map<string, CurriculumEntry>();
    const characterRows: CurriculumCharacter[] = [];
    const sourceLevelCounts = { old: {} as Record<string, number>, new: {} as Record<string, number> };
    let sourceEntryCount = 0;
    let loaded = 0;
    const jobs = [
      ...Array.from({ length: 6 }, (_, index) => ({ kind: 'old-word' as const, scheme: 'old' as const, level: index + 1 })),
      ...Array.from({ length: 6 }, (_, index) => ({ kind: 'new-word' as const, scheme: 'new' as const, level: index + 1 })),
      ...Array.from({ length: 6 }, (_, index) => ({ kind: 'new-character' as const, scheme: 'new' as const, level: index + 1 })),
    ];
    for (let start = 0; start < jobs.length; start += 3) {
      const batch = jobs.slice(start, start + 3);
      const results = await Promise.all(batch.map(async job => {
        const tag = `${job.scheme}-${job.level}`;
        if (job.kind === 'old-word') {
          const records = await fetchJson(`${OLD_SOURCE_BASE}/${job.level}.min.json`);
          const expected = OLD_WORD_COUNTS[job.level - 1];
          if (!Array.isArray(records) || records.length !== expected) throw new Error(`HSK 2.0 level ${job.level} failed its pinned source-count check: expected ${expected} rows, received ${Array.isArray(records) ? records.length : 'not an array'}.`);
          const entries = records.map((record: any) => normalizeOldRecord(record, tag)).filter((entry: CurriculumEntry | null): entry is CurriculumEntry => Boolean(entry));
          if (entries.length !== expected || new Set(entries.map(entry => entry.hanzi)).size !== expected) throw new Error(`HSK 2.0 level ${job.level}: expected ${expected} valid, unique vocabulary records, received ${entries.length}.`);
          return { job, rows: records.length, entries, characters: [] as CurriculumCharacter[] };
        }
        const kindName = job.kind === 'new-word' ? 'words' : 'characters';
        const expected = job.kind === 'new-word' ? GUSHI_WORD_COUNTS[job.level - 1] : GUSHI_CHARACTER_COUNTS[job.level - 1];
        const url = `${GUSHI_BASE}-${kindName}-${job.level}.json`;
        const payload = await fetchJson(url);
        const records = payload?.data;
        const expectedKind = job.kind === 'new-word' ? 'words' : 'chars';
        const validHeader = payload?.level === job.level && payload?.kind === expectedKind && Number(payload?.count) === expected && payload?.license?.includes('CC BY-SA 4.0') && payload?.source?.includes('November 2025') && payload?.updated === NEW_SOURCE_UPDATED;
        if (!validHeader || !Array.isArray(records) || records.length !== expected || Number(payload?.count) !== records.length) {
          throw new Error(`HSK 3.0 ${kindName} level ${job.level} failed the pinned completeness check. Expected ${expected} records in the 2025 syllabus snapshot; no partial curriculum was published.`);
        }
        if (job.kind === 'new-word') {
          const entries = records.map((record: any) => normalizeGushiWord(record, job.level)).filter((entry: CurriculumEntry | null): entry is CurriculumEntry => Boolean(entry));
          if (entries.length !== expected || new Set(entries.map(entry => entry.hanzi)).size !== expected) throw new Error(`HSK 3.0 words level ${job.level}: expected ${expected} valid, unique entries; received ${entries.length}.`);
          return { job, rows: records.length, entries, characters: [] as CurriculumCharacter[] };
        }
        const chars = records.map((record: any) => normalizeGushiCharacter(record, job.level)).filter((entry: CurriculumCharacter | null): entry is CurriculumCharacter => Boolean(entry));
        if (chars.length !== expected) throw new Error(`HSK 3.0 characters level ${job.level}: expected ${expected} valid entries; received ${chars.length}.`);
        return { job, rows: records.length, entries: [] as CurriculumEntry[], characters: chars };
      }));
      for (const result of results) {
        sourceEntryCount += result.job.kind === 'new-character' ? 0 : result.rows;
        if (result.job.kind !== 'new-character') sourceLevelCounts[result.job.scheme][String(result.job.level)] = result.rows;
        for (const entry of result.entries) {
          const existing = combined.get(entry.hanzi);
          combined.set(entry.hanzi, existing ? mergeEntry(existing, entry) : entry);
        }
        characterRows.push(...result.characters);
        loaded += 1;
        const label = result.job.kind === 'old-word'
          ? `HSK 2.0 Level ${result.job.level}`
          : result.job.kind === 'new-word'
            ? `HSK 3.0 Level ${result.job.level} words`
            : `HSK 3.0 Level ${result.job.level} characters`;
        onProgress?.(loaded, EXPECTED_LISTS, label);
      }
    }
    const entries = [...combined.values()].sort((a, b) => (a.frequency ?? Number.MAX_SAFE_INTEGER) - (b.frequency ?? Number.MAX_SAFE_INTEGER) || a.hanzi.localeCompare(b.hanzi, 'zh-CN'));
    const data = finalizeCurriculum(entries, characterRows, loaded, sourceEntryCount, sourceLevelCounts);
    data.metadata.sourceFiles = [...browserSourceDigests.entries()].filter(([url]) => jobs.some(job => url.endsWith(`/${job.level}.min.json`) && job.kind === 'old-word') || url.includes('/hsk-3.0-words-') || url.includes('/hsk-3.0-characters-')).map(([url, sha256]) => ({ url, sha256 })).sort((a, b) => a.url.localeCompare(b.url));
    const metadata = data.metadata;
    const exactNewWords = GUSHI_WORD_COUNTS.reduce((sum, count) => sum + count, 0);
    const exactCharacters = GUSHI_CHARACTER_COUNTS.reduce((sum, count) => sum + count, 0);
    const exactOldWords = OLD_WORD_COUNTS.reduce((sum, count) => sum + count, 0);
    const exactSourceWordRows = exactOldWords + exactNewWords;
    if (loaded !== EXPECTED_LISTS || metadata.sourceEntryCount !== exactSourceWordRows || metadata.oldCount !== exactOldWords || metadata.newCount !== exactNewWords || metadata.characterSyllabusCount !== exactCharacters || metadata.hanziCount < 1800 || metadata.entryCount <= 4500) {
      throw new Error(`Curriculum integrity check failed: ${loaded}/${EXPECTED_LISTS} lists; source word rows ${metadata.sourceEntryCount}/${exactSourceWordRows}; HSK 2.0 ${metadata.oldCount}/${exactOldWords}; HSK 3.0 ${metadata.newCount}/${exactNewWords}; official HSK 3.0 character syllabus ${metadata.characterSyllabusCount}; ${metadata.hanziCount} unique Hanzi. Nothing incomplete was cached.`);
    }
    await writeCurriculumCache(data);
    return data;
  })();
  activeLoad = activeLoad.catch(error => { browserSourceDigests.clear(); activeLoad = null; throw error; });
  return activeLoad;
}
