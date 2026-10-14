import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const path = resolve('src/data/curriculum.json');
const data = JSON.parse(await readFile(path, 'utf8'));
const errors = [];
const oldCounts = [150, 150, 300, 600, 1300, 2500];
const newCounts = [300, 200, 500, 1000, 1600, 1800];
const characterCounts = [246, 125, 284, 441, 431, 413];
const sum = values => values.reduce((a, b) => a + b, 0);
const meta = data?.metadata;
const localImport = meta?.sourceVersion === 'local-csv-hearmandarin-gushi-2026-10-14';
if (meta?.status !== 'synced') errors.push('metadata.status is not "synced"');
if (!localImport && meta?.sourceVersion !== 'hsk20-v1.4+hsk30-gushi-2026-10-14') errors.push('sourceVersion does not match a supported source snapshot');
if (meta?.listsLoaded !== 18 || meta?.listsExpected !== 18) errors.push('not all 18 level lists were imported and validated');
if (meta?.sourceEntryCount !== sum(oldCounts) + sum(newCounts)) errors.push(`combined source word-row count is ${meta?.sourceEntryCount}; expected ${sum(oldCounts) + sum(newCounts)}`);
if (meta?.oldCount !== sum(oldCounts)) errors.push(`HSK 2.0 count is ${meta?.oldCount}; expected ${sum(oldCounts)}`);
if (meta?.newCount !== sum(newCounts)) errors.push(`HSK 3.0 count is ${meta?.newCount}; expected ${sum(newCounts)}`);
if (meta?.characterSyllabusCount !== sum(characterCounts)) errors.push(`HSK 3.0 character assignment count is ${meta?.characterSyllabusCount}; expected ${sum(characterCounts)}`);
if (!Array.isArray(data.entries) || data.entries.length <= 4500) errors.push('unique merged headword index is missing or suspiciously small');
if (!Array.isArray(meta?.sourceFiles) || meta.sourceFiles.some(file => typeof file.url !== 'string' || !/^[a-f0-9]{64}$/i.test(file.sha256))) errors.push('source manifest must contain a SHA-256 fingerprint for every input');
if (localImport) {
  const urls = new Set((meta.sourceFiles ?? []).map(file => file.url));
  for (const url of ['https://hearmandarin.com/datasets/hsk-3-0-words.csv','https://gushichinese.com/hsk-3.0/downloads/hsk-3.0-words-all.csv','https://gushichinese.com/hsk-3.0/downloads/hsk-3.0-characters-all.csv']) if (!urls.has(url)) errors.push(`local source manifest is missing ${url}`);
  if ((meta.sourceFiles ?? []).length !== 3) errors.push('local CSV source manifest must contain exactly three CSV inputs');
} else {
  if (meta.sourceFiles.length !== 20 || meta.sourceFiles.filter(file => /\.json$/i.test(file.url)).length !== 18) errors.push('online source manifest must contain 18 JSON lists and two licence notices');
  const expectedJsonUrls = [
    ...Array.from({ length: 6 }, (_, i) => `https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/v1.4/wordlists/exclusive/old/${i + 1}.min.json`),
    ...Array.from({ length: 6 }, (_, i) => `https://gushichinese.com/hsk-3.0/downloads/hsk-3.0-words-${i + 1}.json`),
    ...Array.from({ length: 6 }, (_, i) => `https://gushichinese.com/hsk-3.0/downloads/hsk-3.0-characters-${i + 1}.json`),
  ];
  if (Array.isArray(meta.sourceFiles)) {
    const actualJsonUrls = meta.sourceFiles.filter(file => typeof file.url === 'string' && /\.json$/i.test(file.url)).map(file => file.url).sort();
    if (new Set(actualJsonUrls).size !== 18 || JSON.stringify(actualJsonUrls) !== JSON.stringify([...expectedJsonUrls].sort())) errors.push('source manifest URLs do not match the 18 pinned JSON source files');
    const requiredLicences = ['https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/v1.4/LICENSE','https://gushichinese.com/hsk-3.0/downloads/LICENCE.txt'];
    for (const url of requiredLicences) if (!meta.sourceFiles.some(file => file.url === url && /^[a-f0-9]{64}$/i.test(file.sha256))) errors.push(`source manifest is missing a verified licence notice: ${url}`);
  }
}
if (Array.isArray(data.entries) && meta?.entryCount !== data.entries.length) errors.push('metadata entryCount differs from actual word index');
if (!Array.isArray(data.characters) || data.characters.length !== sum(characterCounts)) errors.push('official reading-character index is missing or incomplete');
for (let level = 1; level <= 6; level++) {
  if (meta?.levelCounts?.old?.[String(level)] !== oldCounts[level - 1]) errors.push(`HSK 2.0 level ${level} source row count differs`);
  if (meta?.levelCounts?.new?.[String(level)] !== newCounts[level - 1]) errors.push(`HSK 3.0 level ${level} source row count differs`);
  for (const [scheme, expected] of [['old', oldCounts[level - 1]], ['new', newCounts[level - 1]]]) {
    const tagged = (Array.isArray(data.entries) ? data.entries : []).filter(entry => entry.levels?.includes(`${scheme}-${level}`)).length;
    if (tagged !== expected) errors.push(`${scheme.toUpperCase()} level ${level} has ${tagged} tagged headwords; expected ${expected}`);
  }
  const taggedCharacters = (Array.isArray(data.characters) ? data.characters : []).filter(char => char.levels?.includes(`new-${level}`)).length;
  if (taggedCharacters !== characterCounts[level - 1]) errors.push(`HSK 3.0 character level ${level} has ${taggedCharacters} tagged characters; expected ${characterCounts[level - 1]}`);
}
const ids = new Set(); const uniqueChars = new Set();
for (const entry of Array.isArray(data.entries) ? data.entries : []) {
  if (!entry.hanzi || !Array.isArray(entry.levels) || !Array.isArray(entry.forms) || !Array.isArray(entry.meanings)) errors.push(`malformed word record: ${entry?.id ?? '(no id)'}`);
  if (ids.has(entry.id)) errors.push(`duplicate word id: ${entry.id}`); ids.add(entry.id);
  for (const char of `${entry.hanzi ?? ''}${entry.traditional ?? ''}${(entry.forms ?? []).map(form => form.traditional ?? '').join('')}`) if (/\p{Script=Han}/u.test(char)) uniqueChars.add(char);
}
for (const char of Array.isArray(data.characters) ? data.characters : []) uniqueChars.add(char.hanzi);
if (meta?.hanziCount !== uniqueChars.size) errors.push(`metadata Hanzi count (${meta?.hanziCount}) differs from built index (${uniqueChars.size})`);
if ((Array.isArray(data.characters) ? data.characters : []).some(char => typeof char.hanzi !== 'string' || [...char.hanzi].length !== 1 || !char.levels?.length)) errors.push('character syllabus contains malformed record');
if (errors.length) { console.error('Yukoto curriculum verification FAILED:'); for (const error of [...new Set(errors)]) console.error(` - ${error}`); console.error('\nCompleteness has not been confirmed. Check the input files, then rerun import and verification.'); process.exit(1); }
console.log('Yukoto curriculum verification PASSED.');
console.log(`Source mode: ${localImport ? 'browser-downloaded local CSVs' : 'direct source JSON import'}.`);
console.log(`HSK 2.0: ${meta.oldCount.toLocaleString()} vocabulary assignments across six levels.`);
console.log(`HSK 3.0: ${meta.newCount.toLocaleString()} vocabulary assignments and ${meta.characterSyllabusCount.toLocaleString()} reading-character assignments across levels 1–6.`);
console.log(`Merged index: ${data.entries.length.toLocaleString()} unique headwords and ${meta.hanziCount.toLocaleString()} unique Hanzi; ${meta.listsLoaded}/${meta.listsExpected} level lists checked.`);
