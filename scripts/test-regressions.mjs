/** Regression suite for the routes and JLPT ID collisions reported in v3.0. */
import assert from 'node:assert/strict';
import {readFile,copyFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {STARTER_WORDS} from '../public/japanese/data.js';
import {migrateImportedWordIds} from '../public/journey/progress-migration.js';
import {allWords} from '../public/journey/data.js';

// Check a real OpenJLPT overlap even on machines with only the bundled fallback.
const dir=await mkdtemp(join(tmpdir(),'yukoto-jlpt-id-test-'));
try{
  const base=join(dir,'public');
  for(const relative of ['japanese/data.js','journey/data.js','journey/datasets/hsk-vocabulary.js']){
    const output=join(base,relative);
    await mkdir(dirname(output),{recursive:true});
    await copyFile(resolve('public',relative),output);
  }
  await writeFile(join(base,'journey/datasets/jlpt-vocabulary.js'),`export const jlptDataset=${JSON.stringify({
    metadata:{coverage:'regression fixture'},
    words:[
      {id:'ja-openjlpt:import-duplicate',native:'おはよう',roman:'ohayou',meaning:'morning greeting',level:'N5',source:'fixture'},
      {id:'ja-openjlpt:import-unique',native:'探検',roman:'tanken',meaning:'exploration',level:'N5',source:'fixture'},
      {id:'ja-openjlpt:import-homograph-1',native:'生',reading:'せい',roman:'sei',meaning:'life',level:'N5',source:'fixture'},
      {id:'ja-openjlpt:import-homograph-2',native:'生',reading:'なま',roman:'nama',meaning:'raw',level:'N5',source:'fixture'}
    ],kanji:[],grammar:[]
  })};\n`);
  await writeFile(join(dir,'package.json'),'{"type":"module"}');
  const {allWords:fromImport,getLessons}=await import(pathToFileURL(join(base,'journey/data.js')).href);
  const japanese=fromImport('ja');
  const greeting=japanese.find(w=>w.native==='おはよう');
  assert.equal(greeting?.id,'ja-existing:Greetings:おはよう', 'original vocabulary ID must survive JLPT import');
  assert.equal(japanese.find(w=>w.native==='探検')?.id,'ja-openjlpt:import-unique');
  const idsByNative=new Map();
  for(const word of japanese){
    const old=idsByNative.get(word.native);
    assert.ok(old===undefined||old===word.id,`ambiguous bridge for ${word.native}: ${old} vs ${word.id}`);
    idsByNative.set(word.native,word.id);
  }
  assert.ok(getLessons('ja').some(l=>l.track==='jlpt'&&l.level==='N5'));
} finally {await rm(dir,{recursive:true,force:true})}

// Restore records created by the buggy pre-fix mapping, including ones that
// contain only the ID and no native spelling.
const progress={words:{
 'ja-openjlpt:import-duplicate':{seen:1,attempts:2,correct:1,due:'2026-11-01T00:00:00.000Z'},
 'ja-existing:Greetings:おはよう':{seen:2,attempts:1,correct:1,due:'2026-11-05T00:00:00.000Z'}
}};
assert.ok(migrateImportedWordIds(progress,[{id:'ja-openjlpt:import-duplicate',native:'おはよう'}],[{id:'ja-existing:Greetings:おはよう',native:'おはよう'}]));
assert.equal(progress.words['ja-existing:Greetings:おはよう'].attempts,3);
assert.equal(progress.words['ja-existing:Greetings:おはよう'].correct,2);
assert.equal(progress.words['ja-existing:Greetings:おはよう'].due,'2026-11-01T00:00:00.000Z');
assert.ok(!('ja-openjlpt:import-duplicate' in progress.words));

// Check static HTML targets are explicit so Vite cannot respond with the
// Chinese SPA fallback for the Japanese studio link.
const [jp,studio,cn,vite]=await Promise.all([
  readFile('public/japanese/app.js','utf8'),
  readFile('public/journey/app.js','utf8'),
  readFile('src/main.tsx','utf8'),
  readFile('vite.config.ts','utf8')
]);
assert.equal((jp.match(/\.\.\/journey\/index\.html\?lang=ja/g)||[]).length,2);
assert.match(studio,/return state\.lang==='ja'\?'\.\.\/japanese\/index\.html':'\.\.\/index\.html'/);
assert.ok(cn.includes("siteUrl('journey/index.html?lang=zh')"));
assert.ok(cn.includes("siteUrl('japanese/index.html')"));
assert.ok(vite.includes("base: './'"));
for(const lang of ['ja','zh']){
  const entries=allWords(lang);
  const bySpelling=new Map();
  for(const w of entries){
    const prior=bySpelling.get(w.native);
    assert.ok(prior===undefined||prior===w.id,`duplicate IDs for ${lang}:${w.native}`);
    bySpelling.set(w.native,w.id);
  }
}
for(const word of STARTER_WORDS){
  assert.ok(allWords('ja').some(w=>w.native===word.japanese&&w.id.startsWith('ja-')));
}
console.log('Regression checks passed: imported JLPT overlaps, canonical progress IDs, both studio routes and original-page return links.');
