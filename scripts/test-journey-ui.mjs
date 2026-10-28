import assert from 'node:assert/strict';
const stored=new Map();const events=new Map();const root={innerHTML:'',addEventListener:(t,fn)=>events.set(t,fn)};
globalThis.location={search:'?lang=zh'};
globalThis.history={replaceState:()=>{}};
globalThis.localStorage={getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)};
globalThis.window={addEventListener(){},scrollTo(){}};
globalThis.document={getElementById:id=>id==='app'?root:null,body:{classList:{toggle(){}},appendChild(){} },documentElement:{lang:'en'},querySelector:()=>null,createElement:()=>({style:{},click(){},remove(){}})};
await import('../public/journey/app.js');
const click=(dataset)=>events.get('click')({target:{closest:()=>({dataset})}});
const change=(id,value)=>events.get('change')({target:{id,value,checked:true}});
const has=x=>root.innerHTML.includes(x);
assert.ok(has('Dashboard'));
assert.ok(has('<div class="brandname">yu<span>ko</span><span>to.</span></div>'));
click({page:'path'});assert.ok(has('Your learning path'));
change('path-track','new');change('path-level','1');assert.ok(has('HSK 3.0'));
let count=(root.innerHTML.match(/class="lesson-card"/g)||[]).length;assert.ok(count<=16&&count>0,count);
click({action:'path-next'});assert.ok(has('Page 2'));
click({page:'library'});assert.ok(has('Showing 48 of'));
change('unit-filter','new-1');assert.ok(has('new-1')||has('HSK 3.0'));
click({action:'library-more'});assert.ok(has('Showing 96 of'));
click({lang:'ja'});click({page:'path'});change('path-track','jlpt');change('path-level','N5');assert.ok(has('N5 · Curated word study')||has('N5 · Study'));
click({page:'lesson',lesson:'ja-jlpt-N5-001'});assert.ok(has('Listen first'));
click({page:'characters'});assert.ok(has('Kanji reading studio'));assert.ok((root.innerHTML.match(/class="vocab-card character-card"/g)||[]).length<=36);
click({page:'grammar'});assert.ok(has('Grammar patterns'));assert.ok(has('Sentence basics')||has('How a Japanese sentence works'));
click({lang:'zh'});click({page:'characters'});assert.ok(has('Hanzi reading studio'));change('character-filter','new-1');assert.ok(has('new-1'));
click({page:'grammar'});assert.ok(has('Grammar patterns'));assert.ok(has('是 · identity'));
click({page:'lesson',lesson:'zh-new-1-001'});for(let i=0;i<10;i++)click({action:'next-step'}); // listen step
for(let i=0;i<10;i++)click({action:'next-step'}); // speaking step
click({action:'next-step'}); // reading stage
for(let i=0;i<10;i++){click({choice:'0'});click({action:'next-step'});}
assert.ok(JSON.parse(stored.get('yukoto.hybrid.v1')).progress.zh.completed.includes('zh-new-1-001'));
assert.ok(!JSON.parse(stored.get('yukoto.hybrid.v1')).progress.ja.completed.includes('zh-new-1-001'));
console.log('UI state-flow verified: HSK level selection, paged path/library, language separation, N5 lesson navigation.');
