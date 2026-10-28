/** Optional online import of the community OpenJLPT corpus. No fabricated syllabus claims.
 * The app ships with the original Yukoto Japanese library as an offline fallback.
 * Run once with internet access: npm run sync:jlpt
 */
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const ref=process.env.OPENJLPT_REF||'main';
const base=`https://raw.githubusercontent.com/evanclan/OpenJLPT/${ref}/data/json`;
const levels=['n5','n4','n3','n2','n1'];
const stamp=[];
async function get(kind,level){
 const url=`${base}/${kind}/${level}.json`;
 const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(`${url}: HTTP ${response.status}`);
 const text=await response.text();const contents=JSON.parse(text);
 if(!Array.isArray(contents))throw new Error(`${url}: expected JSON array`);
 stamp.push({url,sha256:createHash('sha256').update(text).digest('hex'),rows:contents.length});
 return contents;
}
const existing=await import('../public/japanese/data.js');
const words=[];const kanji=[];const grammar=[];
for(const level of levels){
 const [v,k,g]=await Promise.all([get('vocab',level),get('kanji',level),get('grammar',level)]);
 if(v.length<100||k.length<25||g.length<10)throw new Error(`Suspiciously small OpenJLPT ${level} files`);
 for(const w of v){if(!w.word||!w.reading||!w.meanings?.length)continue;
  const example=(w.examples||[]).find(x=>x.ja&&x.en);
  words.push({id:`ja-openjlpt:${w.id||level+':'+w.word+':'+w.reading}`,native:w.word,reading:w.reading,roman:w.romaji||'',meaning:w.meanings[0],level:level.toUpperCase(),source:'OpenJLPT / JMdict',group:'JLPT community level',example:example?.ja||w.word,exampleMeaning:example?.en||w.meanings[0],exampleReading:example?.furigana||'',exampleSourceId:example?.tatoeba_id||null});
 }
 for(const c of k)if(c.character||c.char||c.kanji)kanji.push({char:c.character||c.char||c.kanji,meaning:Array.isArray(c.meanings)?c.meanings[0]:c.meaning||'',on:c.onyomi||[],kun:c.kunyomi||[],level:level.toUpperCase(),source:'OpenJLPT / KANJIDIC2'});
 for(const point of g)if(point.pattern||point.title||point.grammar)grammar.push({...point,level:level.toUpperCase(),source:'OpenJLPT'});
}
const existingWords=existing.STARTER_WORDS.map(x=>({id:`ja-existing:${x.group}:${x.japanese}`,native:x.japanese,reading:x.reading||'',roman:x.romaji||'',meaning:x.meaning,level:'Foundation',source:'Original Yukoto',group:x.group,example:x.japanese,exampleMeaning:x.meaning}));
const report={source:'OpenJLPT (community N5–N1, derived from JMdict/KANJIDIC2 and attributed examples)',coverage:'Community JLPT classification; not an official JLPT syllabus',license:'CC BY-SA 4.0; see THIRD_PARTY_NOTICES.md and OpenJLPT/NOTICE.md',upstream:'https://github.com/evanclan/OpenJLPT',sourceRef:ref,sourceManifest:stamp,wordCount:words.length,kanjiCount:kanji.length,grammarCount:grammar.length};
const src={metadata:report,words:[...existingWords,...words],kanji,grammar};
if(words.length<6500||kanji.length<1600||grammar.length<300)throw new Error(`Incomplete JLPT import: ${words.length} vocab, ${kanji.length} Kanji, ${grammar.length} grammar; existing fallback preserved.`);
const dst=resolve('public/journey/datasets/jlpt-vocabulary.js');
await writeFile(dst,'export const jlptDataset = '+JSON.stringify(src)+';\n');
await writeFile(resolve('data/openjlpt-manifest.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Bundled ${words.length} community JLPT vocabulary entries, ${kanji.length} Kanji, ${grammar.length} grammar points. Verify with npm run test:guided.`);

const regen=spawnSync(process.execPath,[resolve('scripts/prepare-journey.mjs')],{stdio:'inherit'});if(regen.status!==0)throw new Error('Japanese dataset downloaded, but the cross-page progress mapping could not be regenerated. Run npm run prepare:journey.');
