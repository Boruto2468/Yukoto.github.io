/** Regenerate static guided-study projections from the canonical original Yukoto data.
 * This script does not re-fetch HSK sources or rewrite saved user progress.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve('.');
const original=JSON.parse(await readFile(resolve(root,'src/data/curriculum.json'),'utf8'));
if(original.metadata?.status!=='synced'||original.entries?.length<4000)throw new Error('HSK curriculum is unverified; run npm run check:data and import:local before preparing journey.');
const entries=original.entries.map(x=>{
 const examples=(x.examples||[]).filter(e=>e.hanzi&&e.meaning).slice(0,2).map(e=>[e.hanzi,e.pinyin||'',e.meaning,e.level||'']);
 return [x.id,x.hanzi,x.pinyin||'',x.meanings?.[0]||'',x.levels,examples];
});
const hsk={metadata:{sourceVersion:original.metadata.sourceVersion,levelCounts:original.metadata.levelCounts,entries:entries.length,description:'Study index generated from original src/data/curriculum.json; source hashes are preserved in that file.'},entries};
await writeFile(resolve(root,'public/journey/datasets/hsk-vocabulary.js'),'export const hskDataset = '+JSON.stringify(hsk)+';\n');
const characters=original.characters.map(c=>Object.fromEntries(['hanzi','levels','pinyin','meaning','exampleChinese','examplePinyin','exampleEnglish','radical','components','strokes'].filter(k=>k in c).map(k=>[k,c[k]])));
await writeFile(resolve(root,'public/journey/datasets/hsk-characters.js'),'export const hskCharacters = '+JSON.stringify(characters)+';\n');
const {allWords}=await import('../public/journey/data.js');
const mapping={};
for(const lang of ['ja','zh']){
 mapping[lang]=Object.fromEntries(allWords(lang).map(w=>[w.native,w.id]));
 if(Object.keys(mapping[lang]).length<30)throw new Error('Incomplete guided word mapping '+lang);
}
await writeFile(resolve(root,'src/guided/wordIds.json'),JSON.stringify(mapping));
console.log(`Guided projections ready: ${entries.length} HSK words, ${characters.length} source characters, ${Object.keys(mapping.ja).length} Japanese and ${Object.keys(mapping.zh).length} Chinese dictionary bridges.`);
