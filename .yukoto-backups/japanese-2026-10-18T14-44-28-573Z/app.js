import { STARTER_WORDS, HIRAGANA, KATAKANA, KANJI_BY_LEVEL, DICTIONARY_ENTRIES } from './data.js';

const app = document.getElementById('app');
const movieUrl = 'https://www.youtube.com/watch?v=xU47nhruN-Q';
const approvedArt = {
  original: './assets/approved-scene.svg',
  first: './assets/approved-first.png',
  japanese: './assets/approved-japanese.png',
};
const params = new URLSearchParams(location.search);
const artwork = Object.prototype.hasOwnProperty.call(approvedArt, params.get('art')) ? params.get('art') : 'original';
const artSrc = approvedArt[artwork];
const groups = ['All', 'Greetings', 'Numbers', 'Pronouns', 'Useful phrases'];
const state = {
  page: ['home', 'words', 'reading'].includes(location.hash.replace('#', '')) ? location.hash.slice(1) : 'home',
  uiLanguage: localStorage.getItem('yukoto-jp-ui-language') || 'en', languageOpen: false,
  category: 'All', search: '', revealed: new Set(), remembered: new Set(readArray('yukoto-jp-known')),
  tab: 'hiragana', level: 5, selected: '', dictionary: false, dictSearch: '', dictCategory: 'All',
  dictSelected: '', dock: false, quiz: false, quizAnswered: '', quizCurrent: 0, quizSequence: [], toast: '',
  mobileNav: false,
};
let transitionTimer;
function readArray(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const jpVoice = text => {
  if (!('speechSynthesis' in window)) { showToast('Speech playback is unavailable in this browser.'); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP'; u.rate = 0.82;
  const voices = speechSynthesis.getVoices();
  u.voice = voices.find(v => v.lang.toLowerCase() === 'ja-jp') || voices.find(v => v.lang.toLowerCase().startsWith('ja')) || null;
  speechSynthesis.speak(u);
};
function wikipedia(c) { return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(c + ' Japanese character')}`; }
function showToast(message) { state.toast = message; refreshOverlay(); setTimeout(() => { if (state.toast === message) {state.toast = ''; refreshOverlay();} }, 5000); }
function exitToChinese() {
  document.body.classList.add('scene-exiting');
  setTimeout(() => { location.assign(new URL('../', location.href).href); }, 440);
}
function navigate(page) {
  if (state.page === page) { window.scrollTo({top:0, behavior:'smooth'}); return; }
  document.body.classList.add('scene-switching');
  clearTimeout(transitionTimer);
  transitionTimer = setTimeout(() => { state.page = page; state.search = ''; location.hash = page; document.body.classList.remove('scene-switching'); render(); window.scrollTo({top:0, behavior:'instant'}); }, 270);
}
const petal = () => '<span class="petal-mark" aria-hidden="true">✿</span>';
const bookIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7.2C9.8 5.7 6.6 5.1 3 5.6v13c4.3-.8 7.4 0 9 1.3 1.6-1.3 4.7-2.1 9-1.3v-13c-3.6-.5-6.8.1-9 1.6Z"/><path d="M12 7.2V20"/></svg>`;
const eyesIcon = '<span class="otoku-eyes" aria-hidden="true"><i></i><i></i></span>';
const labels = {
 en: {home:'Home',words:'Words & Phrases',reading:'Reading',welcome:'Welcome to Japanese',subtitle:'A new language. A new world.',tagline:'Learn · Practice · Grow',intro:'A little about this place',why:'Why Japanese?',trailer:'Watch the Your Name trailer',begin:'Start learning',speak:'Hear the welcome',lang:'Language'},
 ja: {home:'ホーム',words:'単語・フレーズ',reading:'読み方',welcome:'日本語へようこそ',subtitle:'新しい言葉、新しい世界。',tagline:'学ぶ · 練習する · 成長する',intro:'はじめに',why:'なぜ日本語？',trailer:'「君の名は。」予告編を見る',begin:'学習を始める',speak:'歓迎の言葉を聞く',lang:'言語'},
 zh: {home:'首页',words:'单词与短语',reading:'阅读',welcome:'欢迎学习日语',subtitle:'一种新语言，一个新世界。',tagline:'学习 · 练习 · 成长',intro:'关于这里',why:'为什么学习日语？',trailer:'观看《你的名字。》预告片',begin:'开始学习',speak:'聆听欢迎语',lang:'语言'}
};
function t(key) {return labels[state.uiLanguage]?.[key] || labels.en[key] || key;}
function languageMenu() {return `<div class="ui-language-wrap"><button class="ui-language-button" data-action="language-menu" aria-label="${t('lang')}" aria-expanded="${state.languageOpen}">文 <span>⌄</span></button>${state.languageOpen?`<div class="ui-language-popover" role="menu">${[['en','English'],['ja','日本語'],['zh','中文']].map(([code,name])=>`<button role="menuitem" class="${state.uiLanguage===code?'active':''}" data-action="set-language" data-lang="${code}">${name} ${state.uiLanguage===code?'✓':''}</button>`).join('')}<button data-action="chinese" role="menuitem">Learning Chinese ↗</button></div>`:''}</div>`;}
function header() {
 return `<header class="inner-header live-header"><a class="brand-link" href="#home" data-page="home">${petal()} <span>Yukoto</span><small>語りで、つながる</small></a><nav class="inner-nav" aria-label="Japanese learning pages"><a href="#home" data-page="home" class="${state.page==='home'?'selected':''}">${t('home')}</a><a href="#words" data-page="words" class="${state.page==='words'?'selected':''}">${t('words')}</a><a href="#reading" data-page="reading" class="${state.page==='reading'?'selected':''}">${t('reading')}</a></nav><div class="inner-actions">${languageMenu()}<button data-action="toggle-dock" class="header-book" aria-label="Open resources">本</button></div></header>`;
}
function home() {
 return `<div class="live-home">${header()}<main id="main"><section class="live-hero" aria-labelledby="homepage-title"><div class="hero-art" aria-hidden="true"></div><div class="hero-shade" aria-hidden="true"></div><div class="floating-petals" aria-hidden="true"><i>✿</i><i>✿</i><i>✿</i><i>✿</i></div><div class="hero-copy"><span class="hero-kicker">YUKOTO · 日本語</span><h1 id="homepage-title"><span class="hero-japanese">ようこそ<br>日本語へー</span><span class="hero-english">${t('welcome')}</span></h1><p class="hero-subtitle">${t('subtitle')}</p><p class="hero-tagline">${t('tagline')}</p><div class="hero-buttons"><button class="hero-cta" data-page="words">${t('begin')} →</button><button class="hero-listen" data-action="speak-welcome">♫ ${t('speak')}</button></div></div><button class="hero-scroll" data-action="scroll-intro" aria-label="Scroll to introduction">⌄ <span>Scroll to explore</span></button></section>
 <section class="live-intro" id="intro"><div class="intro-inner"><div class="intro-story"><p class="section-kicker">✿ はじめに</p><h2>${t('intro')}</h2><p>I honestly believe that <em>“anything worth doing is worth doing well.”</em> It is with this belief I crafted this to not just help, but motivate any and all Japanese learners who, like me, want to know and use this language they came to love.</p><h3>${t('why')}</h3><ul class="why-list"><li>Explore Japanese through real conversations, not only memorisation.</li><li>Learn hiragana, katakana and kanji in manageable steps.</li><li>Discover expressions, politeness and cultural nuance beyond English.</li><li>Build confidence by speaking and reading every day.</li></ul></div><div class="trailer-panel"><span class="section-kicker">A LITTLE INSPIRATION</span><h2>君の名は。 <small>Your Name</small></h2><p>Sometimes a story makes you fall in love with a language.</p><a href="${movieUrl}" target="_blank" rel="noopener noreferrer" class="trailer-link"><span>▶</span> ${t('trailer')} ↗</a><div class="trailer-visual" aria-hidden="true"><span>君の名は。</span></div></div></div></section><section class="path-section"><h2>Begin your journey</h2><p>Choose a small step, practise it, then come back tomorrow.</p><div class="path-cards"><button data-page="words"><span>01 · 話す</span><strong>${t('words')}</strong><small>Daily phrases, pronunciation and recall practice →</small></button><button data-page="reading"><span>02 · 読む</span><strong>${t('reading')}</strong><small>Hiragana, katakana and kanji →</small></button></div></section></main></div>`;
}
function learningFrame(inner) {
  return `<div class="study-scene"><img class="study-background-art" src="${artSrc}" alt="" aria-hidden="true"/><div class="study-background" aria-hidden="true"></div>${header()}<main id="main" class="study-content">${inner}</main></div>`;
}
function pageIntro(kicker, title, desc, japanese = '') {
  return `<div class="study-page-intro"><div><p class="study-kicker">${petal()} ${kicker}</p><h1>${title}</h1><p class="study-lede">${desc}</p></div><span class="intro-kanji" aria-hidden="true">${japanese}</span></div>`;
}
function words() {
  const filtered = STARTER_WORDS.filter(w => (state.category === 'All' || w.group === state.category) && `${w.japanese} ${w.reading} ${w.romaji||''} ${w.meaning}`.toLowerCase().includes(state.search.toLowerCase()));
  const cards = filtered.map((w,i) => {
    const expanded = state.revealed.has(w.japanese), known = state.remembered.has(w.japanese);
    return `<article class="vocab-card" style="animation-delay:${Math.min(i*22,200)}ms">
      <div class="vocab-top"><span>${esc(w.group)}</span><button class="sound-button" data-action="speak" data-say="${esc(w.japanese)}" title="Hear spoken Japanese" aria-label="Play ${esc(w.japanese)}">◖))</button></div>
      <button class="vocab-word" data-action="word-reveal" data-word="${esc(w.japanese)}" aria-expanded="${expanded}"><strong>${esc(w.japanese)}</strong><span>${expanded ? esc(w.reading) : 'Tap to reveal pronunciation'}</span></button>
      <div class="vocab-meaning ${expanded?'shown':''}">${expanded ? `<span>${esc(w.meaning)}</span>${w.romaji?`<small>${esc(w.romaji)}</small>`:''}${w.note?`<p>${esc(w.note)}</p>`:''}` : '<span class="soft-tip">Try recalling its meaning first.</span>'}</div>
      <div class="vocab-actions"><button data-action="word-reveal" data-word="${esc(w.japanese)}">${expanded?'Hide meaning':'Reveal meaning'} <span>⌄</span></button><button class="${known?'known':''}" data-action="remember" data-word="${esc(w.japanese)}">${known?'✓ Remembered':'☆ Remember'}</button></div>
    </article>`;
  }).join('');
  return learningFrame(`${pageIntro('DAILY JAPANESE · WORDS YOU WILL REALLY USE','Words &amp; Phrases','Learn a little, say it aloud, then try remembering it before you reveal the meaning.','言葉')}
    <section class="study-glass main-study-glass">
      <div class="study-toolbar"><div class="filter-pills">${groups.map(c=>`<button data-category="${esc(c)}" class="${state.category===c?'active':''}">${esc(c)}</button>`).join('')}</div><input data-input="word-search" class="study-search" type="search" value="${esc(state.search)}" aria-label="Search Japanese words" placeholder="Search a word, meaning or reading…"></div>
      <div class="tool-summary"><span>${filtered.length} of ${STARTER_WORDS.length} practical starters</span><span>${state.remembered.size} remembered</span><button class="soft-action" data-action="start-quiz">Practice recall ↗</button></div>
      <div class="vocab-grid">${cards || '<p class="no-results">No matching words. Try a shorter search.</p>'}</div>
    </section>
    ${state.quiz ? quizMarkup() : `<aside class="study-bottom-tip">${petal()} <div><strong>Use it, don't just recognise it.</strong><p>Try saying each phrase aloud, then imagine where you'd use it in Japan.</p></div><button data-action="start-quiz" class="outline-button">Try a mini quiz →</button></aside>`}`);
}
function startQuiz() {
  const pool = STARTER_WORDS.filter(w => state.category === 'All' || w.group === state.category);
  state.quizSequence = [...pool].sort(() => Math.random() - .5).slice(0, Math.min(6, pool.length));
  state.quizCurrent = 0; state.quizAnswered = ''; state.quiz = true; render();
  requestAnimationFrame(() => document.getElementById('practice-quiz')?.scrollIntoView({behavior:'smooth',block:'center'}));
}
function quizMarkup() {
  const word = state.quizSequence[state.quizCurrent];
  if (!word) return '';
  const all = STARTER_WORDS.filter(w=> w.japanese!==word.japanese);
  const distractors = [...all].sort((a,b)=> (a.japanese.charCodeAt(0)%17)-(b.japanese.charCodeAt(0)%17)).slice((state.quizCurrent*3)%Math.max(all.length-3,1),(state.quizCurrent*3)%Math.max(all.length-3,1)+3);
  const answers = [word,...distractors].sort((a,b)=> (a.meaning.length%7)-(b.meaning.length%7));
  const checked = !!state.quizAnswered;
  return `<section id="practice-quiz" class="study-glass quiz-container"><div class="quiz-top"><span>QUICK RECALL CHALLENGE</span><button data-action="close-quiz" aria-label="Close quiz">✕</button></div><p>QUESTION ${state.quizCurrent+1} OF ${state.quizSequence.length}</p><strong class="quiz-target">${esc(word.japanese)}</strong><button class="sound-button" data-action="speak" data-say="${esc(word.japanese)}">◖)) Listen</button><p>What does this mean?</p><div class="quiz-answers">${answers.map(a=>`<button ${checked?'disabled':''} class="${checked&&a.meaning===word.meaning?'correct':''} ${checked&&a.meaning===state.quizAnswered&&a.meaning!==word.meaning?'wrong':''}" data-action="answer" data-answer="${esc(a.meaning)}">${esc(a.meaning)}</button>`).join('')}</div>${checked?`<p class="quiz-feedback">${state.quizAnswered===word.meaning?'Correct! Keep going.':`The answer is: ${esc(word.meaning)}. Try saying it once.`}</p><button data-action="quiz-next" class="solid-button">${state.quizCurrent===state.quizSequence.length-1?'Finish practice':'Next →'}</button>`:''}</section>`;
}
function reading() {
  const tabLabel = {hiragana:'Hiragana',katakana:'Katakana',kanji:'Kanji'}[state.tab];
  const items = state.tab === 'hiragana'?HIRAGANA:state.tab==='katakana'?KATAKANA:(KANJI_BY_LEVEL[state.level]||[]);
  const filtered = items.filter(k => (state.tab==='kanji'?`${k.char} ${k.meaning} ${k.on} ${k.kun} ${k.words.map(w=>w.word+' '+w.meaning+' '+w.reading).join(' ')}`:`${k.char} ${k.romaji} ${k.meaning} ${k.example}`).toLowerCase().includes(state.search.toLowerCase()));
  const size = window.innerWidth < 700 ? 2 : 4;
  let grid = '';
  for (let i=0; i<filtered.length; i+=size) {
    const batch = filtered.slice(i,i+size);
    grid += `<div class="character-row">${batch.map(k=>`<button class="character-tile ${state.selected===k.char?'selected':''}" data-action="select-char" data-char="${esc(k.char)}" aria-expanded="${state.selected===k.char}"><strong>${esc(k.char)}</strong><span>${esc(state.tab==='kanji' ? k.meaning.split(';')[0] : k.romaji)}</span></button>`).join('')}</div>`;
    const picked = batch.find(k=>k.char===state.selected);
    if (picked) grid += state.tab==='kanji'?kanjiDetail(picked):kanaDetail(picked);
  }
  return learningFrame(`${pageIntro('READ. RECOGNISE. REMEMBER.','Reading Studio','Select a character, hear it pronounced, and learn how it behaves inside a real word.','文字')}
    <section class="study-glass main-study-glass reading-glass"><div class="reading-tabs" role="tablist" aria-label="Writing systems">${[['hiragana','あ','Hiragana'],['katakana','ア','Katakana'],['kanji','漢','Kanji']].map(([id,c,label])=>`<button role="tab" aria-selected="${state.tab===id}" data-tab="${id}" class="${state.tab===id?'active':''}"><strong>${c}</strong><span>${label}</span></button>`).join('')}</div>
      <div class="study-toolbar reading-toolbar"><div><h2>${tabLabel} <span>${state.tab==='kanji'?`· JLPT N${state.level}`:''}</span></h2><p>${state.tab==='kanji'?'N5 first. Explore common readings and vocabulary combinations without leaving this page.':'Tap a character, reveal an example, then practise speaking it.'}</p></div><div class="reading-filters">${state.tab==='kanji'?`<label class="level-select">JLPT LEVEL <select data-select="level" aria-label="Select JLPT Kanji level">${[5,4,3,2,1].map(n=>`<option value="${n}" ${state.level===n?'selected':''}>N${n}</option>`).join('')}</select></label>`:''}<input data-input="reading-search" type="search" class="study-search" value="${esc(state.search)}" placeholder="Search characters or meanings" aria-label="Search ${tabLabel}"></div></div>
      <div class="tool-summary"><span>${filtered.length} ${tabLabel.toLowerCase()} characters</span><span>Tap a tile to expand its information here</span></div>
      <div class="characters-list">${grid || '<p class="no-results">No characters found. Try a shorter search.</p>'}</div>
      <p class="footnote">${state.tab==='kanji'?'The supplied kanji library is a curated starter index (largest selection at N5), not the complete JLPT syllabus. Character readings depend on the vocabulary and context.':'Japanese text-to-speech depends on the Japanese voices available in your browser or device.'}</p>
    </section><aside class="study-bottom-tip">${petal()} <div><strong>Recognise it in a real word.</strong><p>Learning a kanji with vocabulary is more reliable than memorising a list of readings in isolation.</p></div><button data-action="open-dict" class="outline-button">Open dictionary →</button></aside>`);
}
function kanjiDetail(k) {
  return `<div class="character-detail"><div class="detail-leading"><strong>${esc(k.char)}</strong><div><span>MEANING</span><h3>${esc(k.meaning)}</h3><button data-action="speak" data-say="${esc(k.words[0]?.word || k.char)}" class="soft-action">◖)) Hear an example</button></div></div><div class="reading-types"><div><small>音読み · ON'YOMI</small><strong>${esc(k.on)}</strong></div><div><small>訓読み · KUN'YOMI</small><strong>${esc(k.kun)}</strong></div></div><div class="word-examples"><small>IN WORDS &amp; COMPOUNDS</small>${k.words.map(w=>`<div class="sample-word"><strong>${esc(w.word)}</strong><span>${esc(w.reading)}</span><span>${esc(w.meaning)}</span><button data-action="speak" data-say="${esc(w.word)}" title="Hear Japanese">◖))</button></div>`).join('')}</div><div class="detail-links"><a href="${wikipedia(k.char)}" target="_blank" rel="noopener noreferrer">Learn more on Wikipedia ↗</a><button data-action="select-char" data-char="${esc(k.char)}">Close ×</button></div></div>`;
}
function kanaDetail(k) {return `<div class="character-detail kana-detail"><strong class="large-kana">${esc(k.char)}</strong><div><span>PRONUNCIATION</span><h3>${esc(k.romaji)}</h3><p>Example: <strong>${esc(k.example)}</strong> · ${esc(k.meaning)}</p><p>Reading: ${esc(k.exampleReading)}</p><button class="solid-button" data-action="speak" data-say="${esc(k.example)}">◖)) Listen to the example</button></div><button data-action="select-char" data-char="${esc(k.char)}">×</button></div>`;}
function dictionary() {
  if (!state.dictionary) return '';
  const visible = DICTIONARY_ENTRIES.filter(k=> (state.dictCategory==='All'||k.category===state.dictCategory)&&`${k.char} ${k.reading} ${k.meaning}`.toLowerCase().includes(state.dictSearch.toLowerCase()));
  const selected = DICTIONARY_ENTRIES.find(k=> k.char===state.dictSelected);
  return `<div class="modal-scrim" data-action="modal-backdrop"><section class="dictionary-panel" role="dialog" aria-modal="true" aria-labelledby="dictionary-title">
    <header class="modal-header"><div><span class="study-kicker">CHARACTER LIBRARY</span><h2 id="dictionary-title">言葉の辞書 <small>Yukoto Dictionary</small></h2><p>Look up the characters currently included in the learning library.</p></div><button data-action="close-dict" class="close-modal" aria-label="Close dictionary">×</button></header>
    <div class="dictionary-controls"><input data-input="dict-search" type="search" placeholder="Search character, reading or meaning" aria-label="Search Japanese dictionary" value="${esc(state.dictSearch)}"><div class="filter-pills">${['All','Hiragana','Katakana','Kanji'].map(c=>`<button class="${state.dictCategory===c?'active':''}" data-dict-category="${c}">${c}</button>`).join('')}</div></div>
    ${selected?`<div class="dictionary-feature"><strong>${esc(selected.char)}</strong><div><h3>${esc(selected.meaning)}</h3><p>${esc(selected.category)} · ${esc(selected.reading)}</p><a href="${wikipedia(selected.char)}" target="_blank" rel="noopener noreferrer">Wikipedia details ↗</a></div></div>`:''}
    <div class="dictionary-list">${visible.slice(0,240).map(e=>`<button class="${state.dictSelected===e.char?'selected':''}" data-dict-char="${esc(e.char)}"><strong>${esc(e.char)}</strong><span>${esc(e.reading)}</span><small>${esc(e.meaning)}</small></button>`).join('')||'<p>No matching characters.</p>'}</div><p class="footnote">Curated app dictionary, not an exhaustive index of all Japanese characters. Wikipedia links open searches for individual characters.</p>
  </section></div>`;
}
function dock() {
  return `<div class="real-dock ${state.dock?'open':''}">
    ${state.dock?`<div class="dock-options"><button class="dock-option dock-dictionary" data-action="open-dict" title="Open the Japanese dictionary">${bookIcon}<span>Dictionary</span></button><button class="dock-option dock-otoku" data-action="otoku" title="Otoku — coming later">${eyesIcon}<span>Otoku AI</span></button></div>`:''}
    ${state.page!=='home'?`<button class="dock-main" data-action="toggle-dock" aria-expanded="${state.dock}" aria-label="${state.dock?'Close resources':'Dictionary and Otoku'}">本</button>`:''}
  </div>${state.toast?`<div class="message-toast" role="status"><span>✿</span>${esc(state.toast)}<button data-action="close-toast" aria-label="Dismiss message">×</button></div>`:''}`;
}
function footer() {return `<footer class="site-footer"><div class="footer-columns"><div class="footer-brand"><span class="footer-logo">言</span><div><strong>Yukoto<span>.</span></strong><p>A quiet place to keep learning.</p></div></div><div><h3>Disclaimer</h3><p>There are already a lot of language sites and apps on the web, so my aim is to help my friends learn the so-called hard languages — Chinese and Japanese — at their own pace, meaningfully, and excel at them.</p></div><div><h3>Credits</h3><p>Inspired by free, wonderful tools such as Obenkyo, Free Japanese Lessons, and Tae Kim’s Guide to Learning Japanese.</p></div></div><div class="footer-base"><span>Made for curious minds.</span><span>慢慢来 · Take it one step at a time.</span></div></footer>`;}
function refreshOverlay() {
  const old = document.getElementById('scene-overlay');
  if (old) {old.innerHTML = dock() + dictionary();}
  if (state.dictionary) document.querySelector('.dictionary-controls input')?.focus({preventScroll:true});
}
function render() {
  document.documentElement.dataset.theme = 'dark'; document.documentElement.lang = state.uiLanguage;
  document.title = `${state.page==='home'?'Welcome':state.page==='words'?'Words & Phrases':'Reading'} — Yukoto 日本語`;
  app.innerHTML = (state.page==='home'?home():state.page==='words'?words():reading())+`<div id="scene-overlay">${dock()}${dictionary()}</div>`+footer();
  if (state.dictionary) document.querySelector('.dictionary-controls input')?.focus({preventScroll:true});
}
function restoreInput(selector, value) {
  const item = document.querySelector(selector);
  if (item){ item.focus({preventScroll:true}); item.setSelectionRange?.(value.length,value.length); }
}
function rerenderKeepingPosition() { const y=scrollY; render(); window.scrollTo({top:y,behavior:'instant'}); }
document.addEventListener('click', event => {
  const target = event.target.closest('[data-action], [data-page], [data-category], [data-tab], [data-dict-category], [data-dict-char]');
  if (!target) return;
  const {action,page,category,tab,dictCategory,dictChar,word,char,say,answer}=target.dataset;
  if (page) {event.preventDefault(); navigate(page); return;}
  if (category) {state.category=category;state.quiz=false;rerenderKeepingPosition(); return;}
  if (tab) {state.tab=tab;state.selected='';state.search='';rerenderKeepingPosition(); return;}
  if (dictCategory) {state.dictCategory=dictCategory;state.dictSelected='';refreshOverlay();return;}
  if (dictChar){state.dictSelected=dictChar;refreshOverlay();return;}
  switch(action){
    case 'chinese': exitToChinese(); break;
    case 'language-menu': state.languageOpen=!state.languageOpen; rerenderKeepingPosition(); break;
    case 'set-language': state.uiLanguage=target.dataset.lang;state.languageOpen=false;localStorage.setItem('yukoto-jp-ui-language',state.uiLanguage);rerenderKeepingPosition();break;
    case 'speak-welcome': jpVoice('ようこそ、日本語へ。'); break;
    case 'speak': jpVoice(say); break;
    case 'scroll-intro': document.getElementById('intro')?.scrollIntoView({behavior:'smooth'});break;
    case 'toggle-dock':state.dock=!state.dock;refreshOverlay();break;
    case 'open-dict':state.dock=false;state.dictionary=true;refreshOverlay();break;
    case 'close-dict':state.dictionary=false;refreshOverlay();break;
    case 'modal-backdrop':if(target===event.target){state.dictionary=false;refreshOverlay();}break;
    case 'otoku':state.dock=false;showToast('Otoku is reserved for the later AI upgrade. No AI features have been added.');break;
    case 'close-toast':state.toast='';refreshOverlay();break;
    case 'word-reveal':state.revealed.has(word)?state.revealed.delete(word):state.revealed.add(word);rerenderKeepingPosition();break;
    case 'remember':state.remembered.has(word)?state.remembered.delete(word):state.remembered.add(word);localStorage.setItem('yukoto-jp-known',JSON.stringify([...state.remembered]));rerenderKeepingPosition();break;
    case 'select-char':state.selected=state.selected===char?'':char;rerenderKeepingPosition();break;
    case 'start-quiz':startQuiz();break;
    case 'close-quiz':state.quiz=false;rerenderKeepingPosition();break;
    case 'answer': if(!state.quizAnswered){state.quizAnswered=answer;rerenderKeepingPosition();document.getElementById('practice-quiz')?.scrollIntoView({behavior:'smooth',block:'center'});}break;
    case 'quiz-next': if(state.quizCurrent===state.quizSequence.length-1){state.quiz=false;showToast('Great work. Keep practising a little every day.');}else{state.quizCurrent++;state.quizAnswered='';}rerenderKeepingPosition();document.getElementById('practice-quiz')?.scrollIntoView({behavior:'smooth',block:'center'});break;
  }
  if(target.matches('button, a')) { const petalBurst=document.createElement('span');petalBurst.className='click-petal';petalBurst.textContent='✿';petalBurst.style.left=event.clientX+'px';petalBurst.style.top=event.clientY+'px';document.body.append(petalBurst);setTimeout(()=>petalBurst.remove(),760); }
});
document.addEventListener('input', event => {
  const input=event.target;if(!input.dataset?.input)return;
  if(input.dataset.input==='word-search'){state.search=input.value;rerenderKeepingPosition();restoreInput('[data-input="word-search"]',state.search);}
  if(input.dataset.input==='reading-search'){state.search=input.value;rerenderKeepingPosition();restoreInput('[data-input="reading-search"]',state.search);}
  if(input.dataset.input==='dict-search'){state.dictSearch=input.value;const value=input.value;refreshOverlay();restoreInput('[data-input="dict-search"]',value);}
});
document.addEventListener('change', event => {if(event.target.dataset?.select==='level'){state.level=Number(event.target.value);state.selected='';rerenderKeepingPosition();}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){state.dock=false;state.dictionary=false;refreshOverlay();}});
window.addEventListener('hashchange',()=>{const newPage=location.hash.replace('#','');if(['home','words','reading'].includes(newPage)&&newPage!==state.page){state.page=newPage;state.search='';render();window.scrollTo(0,0);}});
render();
