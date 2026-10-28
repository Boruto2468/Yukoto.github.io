import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {STARTER_WORDS,HIRAGANA,KATAKANA} from '../public/japanese/data.js';
import {getLessons,allWords,findLesson,getCatalogInfo} from '../public/journey/data.js';
const hsk=JSON.parse((await readFile('src/data/curriculum.json','utf8')));
const lessonIds=new Set();
for(const lang of ['ja','zh']){
 const lessons=getLessons(lang), words=allWords(lang);
 assert.ok(lessons.length>=40,`${lang} needs a real lesson library`);
 assert.ok(lessons.filter(l=>l.track==='foundation').length===6,`${lang} needs the six curated foundation units`);
 assert.equal(new Set(words.map(w=>w.id)).size,words.length,`duplicate ${lang} word IDs`);
 for(const l of lessons){assert.equal(l.language,lang);assert.ok(l.words.length>0&&l.words.length<=10,l.id);assert.ok(l.reading.native&&l.reading.translation,l.id);assert.equal(findLesson(l.id),l);assert.ok(!lessonIds.has(l.id),l.id);lessonIds.add(l.id);for(const w of l.words)assert.ok(w.id&&w.native&&w.meaning,l.id);}
}
const zhWords=allWords('zh');const jaWords=allWords('ja');
const hskIds=new Set(hsk.entries.map(e=>e.id));
assert.ok(zhWords.length>=hskIds.size);
assert.ok([...hskIds].every(id=>zhWords.some(w=>w.id===id)||getLessons('zh').some(l=>l.words.some(w=>w.native===id.slice(4)))),'every unique HSK headword should exist in guided/library');
for(const track of ['old','new'])for(let level=1;level<=6;level++){
 const lessons=getLessons('zh').filter(l=>l.track===track&&l.level===String(level));
 assert.ok(lessons.length>0);
 const expected=new Set(hsk.entries.filter(row=>row.levels.includes(`${track}-${level}`)).map(row=>row.hanzi));
 const actual=new Set(lessons.flatMap(l=>l.words.map(w=>w.native)));
 assert.deepEqual(actual,expected,`HSK ${track}-${level} missing vocabulary`);
}
assert.ok(STARTER_WORDS.every(w=>jaWords.some(item=>item.native===w.japanese)));
assert.ok(jaWords.some(w=>w.id.startsWith('ja-kana:hiragana')));
assert.ok(jaWords.some(w=>w.id.startsWith('ja-kana:katakana')));
assert.ok(getLessons('ja').some(l=>l.track==='jlpt'&&l.level==='N5'));
assert.equal(getCatalogInfo('zh').metadata.entries,hsk.entries.length);
const bridge=JSON.parse((await readFile('src/guided/wordIds.json','utf8')));
for(const lang of ['zh','ja'])for(const word of allWords(lang))assert.equal(bridge[lang][word.native],word.id,`bridge ${lang} ${word.native}`);
console.log(`Guided data verified: ${getLessons('zh').length} Mandarin + ${getLessons('ja').length} Japanese lessons; ${zhWords.length} Chinese + ${jaWords.length} Japanese study entries; HSK old/new all six levels aligned.`);
