import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourcePath = resolve('src/data/curriculum.ts');
const source = await readFile(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const tempDir = await mkdtemp(join(tmpdir(), 'yukoto-curriculum-test-'));
try {
  const modulePath = join(tempDir, 'curriculum.mjs');
  await writeFile(modulePath, compiled, 'utf8');
  const { finalizeCurriculum } = await import(pathToFileURL(modulePath).href);
  const form = (scheme, level, pinyin, meanings) => ({
    traditional: '', pinyin, meanings, classifiers: [], levels: [`${scheme}-${level}`], sources: ['fixture'],
  });
  const entry = (hanzi, levels, meanings, pinyin = '') => ({
    id: `hsk:${hanzi}`, hanzi, traditional: '', pinyin, meanings, radical: '', levels,
    forms: levels.map(tag => form(tag.split('-')[0], Number(tag.split('-')[1]), pinyin, meanings)),
    examples: [], partsOfSpeech: [],
  });
  const character = (hanzi, level) => ({
    hanzi, levels: [`new-${level}`], pinyin: '', meaning: '', exampleChinese: '',
    examplePinyin: '', exampleEnglish: '', radical: '', components: [], source: 'Gushi',
  });
  const oldCounts = { '1':150, '2':150, '3':300, '4':600, '5':1300, '6':2500 };
  const newCounts = { '1':300, '2':200, '3':500, '4':1000, '5':1600, '6':1800 };
  const fixture = finalizeCurriculum(
    [entry('你好', ['old-1', 'new-1'], ['hello'], 'nǐ hǎo'), entry('你们', ['old-1'], ['you plural'], 'nǐmen')],
    [character('我', 1), character('我', 2)], 18, 10400,
    { old: oldCounts, new: newCounts }, 'synced',
  );
  assert.equal(fixture.metadata.listsLoaded, 18);
  assert.equal(fixture.metadata.counts.old['6'], 5000);
  assert.equal(fixture.metadata.counts.new['6'], 5400);
  assert.equal(fixture.metadata.characterSyllabusCount, 1, 'duplicate Hanzi across character levels should merge');
  assert.deepEqual(fixture.characters[0].levels, ['new-1', 'new-2']);
  assert.equal(fixture.metadata.hanziCount, 4, 'unique Hanzi should include simplified words and official reading characters');
  console.log('Yukoto curriculum aggregation smoke-test passed.');
  console.log('This fixture tests aggregation only; it does not assert that the external HSK source lists are imported.');
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
