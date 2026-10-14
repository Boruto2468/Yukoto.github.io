import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const target = resolve('src/data/curriculum.json');
const sync = resolve('scripts/sync-curriculum.mjs');
const strict = process.argv.includes('--strict');
const EXPECTED_OLD = [150, 150, 300, 600, 1300, 2500].reduce((a,b)=>a+b,0);
const EXPECTED_NEW = [300, 200, 500, 1000, 1600, 1800].reduce((a,b)=>a+b,0);
const EXPECTED_CHARS = [246, 125, 284, 441, 431, 413].reduce((a,b)=>a+b,0);
function isComplete(parsed) {
  const meta = parsed?.metadata;
  if (meta?.status !== 'synced' || !Array.isArray(parsed.entries) || parsed.entries.length <= 4500 || !Array.isArray(parsed.characters)) return false;
  if (meta?.listsLoaded !== 18 || meta?.listsExpected !== 18 || meta?.sourceEntryCount !== EXPECTED_OLD + EXPECTED_NEW || meta?.oldCount !== EXPECTED_OLD || meta?.newCount !== EXPECTED_NEW || meta?.characterSyllabusCount !== EXPECTED_CHARS || meta?.hanziCount < 1800 || parsed.characters.length !== EXPECTED_CHARS || meta.entryCount !== parsed.entries.length) return false;
  if (!Array.isArray(meta.sourceFiles) || meta.sourceFiles.some(file => typeof file.url !== 'string' || !/^[a-f0-9]{64}$/i.test(file.sha256))) return false;
  const remoteSnapshot = meta.sourceVersion === 'hsk20-v1.4+hsk30-gushi-2026-10-14'
    && meta.sourceFiles.length === 20 && meta.sourceFiles.filter(file => /\.json$/i.test(file.url)).length === 18;
  const localCsvSnapshot = meta.sourceVersion === 'local-csv-hearmandarin-gushi-2026-10-14'
    && meta.sourceFiles.length === 3 && meta.sourceFiles.every(file => /\.csv(?:$|\?)/i.test(file.url));
  return remoteSnapshot || localCsvSnapshot;
}
let current;
try { current = JSON.parse(await readFile(target, 'utf8')); } catch { current = null; }
if (isComplete(current)) {
  console.log(`Yukoto curriculum is ready (${current.metadata.sourceVersion}; 18/18 level lists verified).`);
} else {
  console.log('No complete verified curriculum snapshot is stored. Trying the direct online JSON importer.');
  console.log('If your terminal cannot reach source sites, download the three CSVs in a browser and run: npm run import:local');
  const result = spawnSync(process.execPath, [sync], { stdio: 'inherit', timeout: 90000 });
  let after = null;
  try { after = JSON.parse(await readFile(target, 'utf8')); } catch { after = null; }
  if (result.status !== 0 || !isComplete(after)) {
    const problem = result.error?.message || (result.signal ? `importer stopped (${result.signal})` : `importer exit code ${result.status}`);
    const message = `A complete curriculum import was not confirmed (${problem}).`;
    if (strict) {
      console.error(`\n${message}\nFor an offline source import, place the three original CSVs in data/import/ and run npm run import:local, then npm run check:data.\n`);
      process.exit(1);
    }
    console.warn(`\n${message}\nYukoto will start with its practice examples. The Reading tab shows the import status; it will not label starter content as the full curriculum.\n`);
  }
}
