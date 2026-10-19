import { STARTER_WORDS, HIRAGANA, KATAKANA, KANJI_BY_LEVEL, LEVEL_LABELS, DICTIONARY_ENTRIES } from './data.js';

const $ = (selector, root = document) => root.querySelector(selector);
const ALL = (selector, root = document) => [...root.querySelectorAll(selector)];
const safe = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const icon = (name, size = 19) => {
  const shapes = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    book: '<path d="M12 7v14m0-14C9.5 5.5 6 5 3 6v13c3-1 6.5-.5 9 1.5M12 7c2.5-1.5 6-2 9-1v13c-3-1-6.5-.5-9 1.5"/>',
    reading: '<path d="M4 19.5V4.8A2 2 0 0 1 6 3h15v16H6a2 2 0 1 0 0 4h15M4 19.5A2.5 2.5 0 0 1 6.5 17H21"/>',
    volume: '<path d="M4 9v6h4l5 4V5L8 9H4Zm12-.5c1.7 1.5 1.7 5.5 0 7M19 5c3.5 3.5 3.5 10.5 0 14"/>',
    heart: '<path d="M20.7 5.5c-2-2-5.2-2-7.3 0L12 6.9l-1.4-1.4c-2-2-5.2-2-7.3 0-2.2 2.2-2.2 5.6 0 7.7L12 22l8.7-8.8c2.2-2.1 2.2-5.5 0-7.7Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-4 4-4 14 0 18m0-18c4 4 4 14 0 18"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    repeat: '<path d="M3 12c0-5 4-9 9-9 3 0 5 1 7 3m0-4v4h-4M21 12c0 5-4 9-9 9-3 0-5-1-7-3m0 4v-4h4"/>',
    close: '<path d="M5 5 19 19M19 5 5 19"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    external: '<path d="M12 5h7v7m0-7-9 9"/><path d="M19 13v6H5V5h6"/>',
    eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
    dots: '<circle cx="7" cy="12" r="1"/><circle cx="17" cy="12" r="1"/>'
  };
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${shapes[name] || shapes.dots}</svg>`;
};

const wordsId = item => `${item.group}:${item.japanese}`;
const loadSet = key => { try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); } };
const loadLocale = () => { try { return localStorage.getItem('yukoto-jp-locale') || 'en'; } catch { return 'en'; } };
const translations = {
  en: {
    home:'Home',words:'Words & Phrases',reading:'Reading',learnJapanese:'Learning Japanese',learnChinese:'Learn Chinese',
    language:'Interface language',headline:'Welcome to Japanese',heroSub:'A new language. A beautiful world. Begin your journey with a little practice every day.',
    prelude:'YOUR JAPANESE JOURNEY BEGINS HERE',first:'Start practicing',second:'Explore writing',scroll:'Scroll to discover',
    welcome:'A little about Yukoto',aboutShort:'A place to enjoy Japanese while actually learning to hear it, read it, and use it.',quote:'Anything worth doing, is worth doing well.',
    intro:'I honestly believe that “anything worth doing, is worth doing well”. It is with this belief I crafted this to not just help, but motivate any and all Japanese learners who, like me, want to know and use this language they came to love.',
    why:'Why learn Japanese?',benefit1:'Speak with confidence',benefit1text:'Real conversations start with simple, useful words.',
    benefit2:'Read a new world',benefit2text:'Learn hiragana, katakana and kanji one step at a time.',
    benefit3:'Connect with culture',benefit3text:'From anime and music to everyday life in Japan.',
    inspiration:'A little inspiration',trailerText:'One story, two lives, a language that carries feeling. Discover the magic of 君の名は。',
    trailerButton:'Play the trailer',trailerExternal:'Open on YouTube',ready:'Ready for your first conversation?',readyText:'Start with a greeting. Hear it, speak it, remember it.',
    wordsTitle:'Words & phrases',wordsText:'Japanese you can actually use. Listen, reveal the meaning, and save words to return to.',
    all:'All',saved:'Saved',practice:'Practice',remember:'Remember',showMeaning:'Show meaning',hideMeaning:'Hide meaning',sound:'Hear Japanese',
    searchWords:'Search words or meanings',progress:'words saved',filterResult:'cards shown',drill:'A little practice',drillHint:'Type the Japanese for this meaning (kana or kanji).',
    check:'Check answer',next:'Next question',correct:'Correct. Nicely done!',wrong:'The answer is',skip:'Show answer',
    readingTitle:'Learn to read',readingText:'Start with sounds. Build recognition. Explore the meaning and usage of each kanji without leaving this page.',
    hiragana:'Hiragana',katakana:'Katakana',kanji:'Kanji',levels:'JLPT levels',on:'On’yomi',kun:'Kun’yomi',sample:'Example',
    writingHint:'Tap a character to hear its sound and see a useful word.',kanjiHint:'Choose a level and select any kanji to expand its reading and example inline.',
    dictionary:'Dictionary',dictionaryHint:'Search Japanese words, readings and meanings across the full Jotoba dictionary.',dictionaryPlaceholder:'Find a character or meaning',clearSearch:'Clear search',dictionaryLoading:'Searching the Jotoba dictionary…',dictionaryError:'Could not reach Jotoba. You can still search Jisho directly.',dictionaryNoResults:'No dictionary results were returned.',
    nothing:'Nothing matched that search.',wiki:'Explore on Wikipedia',otoku:'Otoku',otokuLater:'Otoku is coming later',otokuHint:'The Japanese conversation AI will be added separately. For now, explore the reading and practice tools.',
    close:'Close',footer:'Learn · Practice · Grow',voiceNote:'Pronunciation uses your browser’s Japanese voice when available.',
    noWords:'No matching words yet.',subset:'Curated starter content; the JLPT lists are not complete.'
  },
  ja: {
    home:'ホーム',words:'単語・フレーズ',reading:'読みの練習',learnJapanese:'日本語を学ぶ',learnChinese:'中国語を学ぶ',
    language:'表示言語',headline:'日本語の世界へようこそ',heroSub:'新しい言葉、新しい世界。毎日少しずつ練習して、一緒に成長しましょう。',
    prelude:'ここから、日本語の旅が始まる',first:'練習を始める',second:'文字を学ぶ',scroll:'下へスクロール',
    welcome:'Yukotoについて',aboutShort:'覚えるだけではなく、聞いて、読んで、使える日本語を目指す場所です。',quote:'やるからには、ちゃんとやる。',
    intro:'私は「やるからには、ちゃんとやるべきだ」と信じています。このサイトは、日本語を好きになった人たちが、楽しみながら学び、実際に使えるようになるために作りました。',
    why:'日本語を学ぶ理由',benefit1:'自信を持って話そう',benefit1text:'まずは日常で使える単語から。',
    benefit2:'新しい世界を読もう',benefit2text:'ひらがな・カタカナ・漢字を少しずつ。',
    benefit3:'文化とつながろう',benefit3text:'アニメから日本の日常生活まで。',
    inspiration:'ちょっとしたきっかけ',trailerText:'一つの物語、二人の人生。『君の名は。』の美しさを感じてください。',
    trailerButton:'予告編を見る',trailerExternal:'YouTubeで見る',ready:'最初の会話を始めよう',readyText:'あいさつから。聞いて、話して、覚えましょう。',
    wordsTitle:'単語・フレーズ',wordsText:'すぐ使える日本語。音声を聞き、意味を確認し、単語を保存しましょう。',
    all:'すべて',saved:'保存済み',practice:'練習',remember:'保存',showMeaning:'意味を見る',hideMeaning:'意味を隠す',sound:'発音を聞く',
    searchWords:'単語や意味を検索',progress:'保存した単語',filterResult:'表示中',drill:'ちょっと練習',drillHint:'この意味に合う日本語を入力しましょう。',
    check:'答え合わせ',next:'次の問題',correct:'正解！よくできました。',wrong:'答え：',skip:'答えを見る',
    readingTitle:'読みの練習',readingText:'音から始めて、少しずつ読めるように。漢字を押すと読み方と使い方が表示されます。',
    hiragana:'ひらがな',katakana:'カタカナ',kanji:'漢字',levels:'JLPTレベル',on:'音読み',kun:'訓読み',sample:'例',
    writingHint:'文字を押して、発音と例を確認しましょう。',kanjiHint:'レベルを選んで漢字を押すと、同じページで詳細を確認できます。',
    dictionary:'辞書',dictionaryHint:'Jotobaの辞書から、日本語の単語・読み方・意味を検索できます。',dictionaryPlaceholder:'文字・読み方・意味を検索',clearSearch:'検索をクリア',dictionaryLoading:'Jotobaの辞書を検索中…',dictionaryError:'Jotobaに接続できませんでした。Jishoで検索できます。',dictionaryNoResults:'辞書に検索結果がありません。',
    nothing:'見つかりませんでした。',wiki:'Wikipediaで見る',otoku:'オトク',otokuLater:'オトクは準備中です',otokuHint:'日本語会話AIは後ほど追加します。今は読み方と単語の練習をどうぞ。',
    close:'閉じる',footer:'学ぶ · 練習する · 成長する',voiceNote:'発音には、利用できる場合にブラウザの日本語音声を使用します。',noWords:'該当する単語がありません。',subset:'学習用の抜粋です。JLPTの完全な一覧ではありません。'
  },
  zh: {
    home:'首页',words:'词汇和短语',reading:'阅读练习',learnJapanese:'学习日语',learnChinese:'学习中文',
    language:'界面语言',headline:'欢迎来到日语世界',heroSub:'一种新语言，一个美丽的新世界。每天练习一点，一起进步。',
    prelude:'从这里开始你的日语之旅',first:'开始练习',second:'学习文字',scroll:'向下探索',
    welcome:'关于 Yukoto',aboutShort:'在这里不仅要记住日语，更要听懂、读懂并真正使用它。',quote:'值得做的事，就值得认真做好。',
    intro:'我始终相信：“任何值得做的事，都值得认真做好。” 我创建这个网站，不仅为了帮助学习者，更希望鼓励像我一样热爱日语的人，真正理解并使用它。',
    why:'为什么学日语？',benefit1:'自信地交流',benefit1text:'从真实对话中常用的简单词汇开始。',
    benefit2:'读懂全新世界',benefit2text:'一步一步掌握平假名、片假名和汉字。',
    benefit3:'连接日本文化',benefit3text:'从动漫和音乐到日常生活。',
    inspiration:'一点灵感',trailerText:'一个故事，两种人生。感受《你的名字》的语言魅力。',
    trailerButton:'播放预告片',trailerExternal:'前往 YouTube',ready:'准备好第一次交流了吗？',readyText:'从打招呼开始。听一听，说一说，记一记。',
    wordsTitle:'词汇和短语',wordsText:'学习真正实用的日语。听读音、看释义、收藏要复习的词汇。',
    all:'全部',saved:'已收藏',practice:'练习',remember:'收藏',showMeaning:'显示含义',hideMeaning:'隐藏含义',sound:'播放发音',
    searchWords:'搜索单词或释义',progress:'已收藏词汇',filterResult:'显示卡片',drill:'小练习',drillHint:'输入对应的日语（假名或汉字）。',
    check:'检查答案',next:'下一题',correct:'回答正确！',wrong:'正确答案：',skip:'显示答案',
    readingTitle:'学会阅读',readingText:'先认识发音，再练习文字。点击汉字即可在当前页面查看读音、意义和例词。',
    hiragana:'平假名',katakana:'片假名',kanji:'汉字',levels:'JLPT 等级',on:'音读',kun:'训读',sample:'例词',
    writingHint:'点击字符，听发音并查看例词。',kanjiHint:'选择等级，点击汉字，即可在同一页面展开详情。',
    dictionary:'词典',dictionaryHint:'通过 Jotoba 词典搜索日语单词、读音和释义。',dictionaryPlaceholder:'搜索字符、读音或含义',clearSearch:'清除搜索',dictionaryLoading:'正在搜索 Jotoba 词典…',dictionaryError:'无法连接到 Jotoba。你仍可在 Jisho 上搜索。',dictionaryNoResults:'词典没有返回搜索结果。',
    nothing:'没有匹配结果。',wiki:'在维基百科中查看',otoku:'Otoku',otokuLater:'Otoku 即将推出',otokuHint:'日语对话 AI 将单独开发。目前可以先使用阅读和词汇练习。',
    close:'关闭',footer:'学习 · 练习 · 成长',voiceNote:'如果浏览器支持，将使用日语语音朗读。',noWords:'没有匹配的词汇。',subset:'精选的起步学习内容，不是完整的 JLPT 字表。'
  }
};
const getLocale = () => {try{const v=localStorage.getItem('yukoto-jp-ui');return translations[v]?v:'en';}catch{return 'en'}};
function getInitialPage(){
  const hashPage=location.hash.substring(1);
  if(['home','words','reading'].includes(hashPage))return hashPage;
  try{
    const navigation=performance.getEntriesByType('navigation')[0];
    const savedPage=sessionStorage.getItem('yukoto-jp-page');
    if(navigation?.type==='reload'&&['home','words','reading'].includes(savedPage))return savedPage;
  }catch{}
  return 'home';
}
const state = {
  page: getInitialPage(),
  locale:getLocale(),localeOpen:false,drawerOpen:false,dialog:null,dialogSearch:'',externalDictionary:[],dictionaryStatus:'idle',
  group:'All',wordSearch:'',onlySaved:false,revealed:new Set(),saved:loadSet('yukoto-jp-saved'),
  quizIndex:0,quizFeedback:'',readingTab:'hiragana',level:5,openKanji:null,selectedKana:null,
  playTrailer:false,menuOpen:false
};
const t = key => translations[state.locale][key] || translations.en[key] || key;
const kanjiTotal = Object.values(KANJI_BY_LEVEL).reduce((sum,list)=>sum+list.length,0);
const NAV = ['home','words','reading'];
let hasRenderedHome=false;
let homeAnimationStartedAt=0;
let dictionarySearchTimer;
let dictionaryController;
let dictionaryRequest=0;

const shell = () => `
<div class="site site--${state.page}${hasRenderedHome?' has-rendered-home':''}">
 <div class="scenery" aria-hidden="true"><img class="scenery__land" src="./assets/hero-background.webp" alt="" /></div>
 <img class="sakura-layer" src="./assets/sakura-branch.webp" alt="" aria-hidden="true" />
 <div class="petal-field" aria-hidden="true">${[...Array(11)].map((_,i)=>`<i class="petal" style="--left:${(i*37+13)%100}%;--size:${11+(i*7)%11}px;--duration:${15+(i*3)%14}s;--delay:-${(i*5)%21}s;--travel:${i%2?'-':'+'}${35+(i*29)%115}px"></i>`).join('')}</div>
 <header class="topbar">
  <a class="logo" href="#home" aria-label="Yukoto home"><span class="logo__petal" aria-hidden="true">✿</span><span><span class="logo__name">Yukoto</span><small class="logo__tag">語りで、つながる</small></span></a>
  <nav class="topbar__nav" aria-label="Japanese section navigation">${NAV.map((p,i)=>`<a href="#${p}" class="nav-item" ${state.page===p?'aria-current="page"':''}>${icon(i===0?'home':i===1?'book':'reading')}${t(p)}</a>`).join('')}</nav>
  <div class="topbar__tools">
   <a class="course-switch" href="../" title="${safe(t('learnChinese'))}" aria-label="${safe(t('learnChinese'))}">${icon('repeat',15)}<span>${t('learnChinese')}</span> <span aria-hidden="true">↔</span></a>
   <div class="locale"><button class="locale__button" data-action="toggle-locale" aria-expanded="${state.localeOpen}" aria-label="${t('language')}">${icon('globe',17)} <span>${state.locale.toUpperCase()}</span> ${icon('chevron',14)}</button>
   ${state.localeOpen?`<div class="locale__menu" role="menu" aria-label="${t('language')}">${[['en','English'],['ja','日本語'],['zh','中文']].map(([key,label])=>`<button role="menuitemradio" aria-checked="${state.locale===key}" data-action="locale" data-value="${key}">${label} ${state.locale===key?'✓':''}</button>`).join('')}</div>`:''}</div>
  </div>
 </header>
 <main id="main-content">${state.page==='home'?homePage():state.page==='words'?wordsPage():readingPage()}</main>
 <footer class="page-footer"><div class="footer-top"><div class="footer-brand"><span class="footer-brand__flower">✿</span><div><strong>Yukoto</strong><p>A quiet place to keep learning.</p></div></div><div class="footer-copy"><h4>Disclaimer</h4><p>There are already a lot of language sites and apps on the web, so my aim is to help my friends learn the so-called hard languages — Chinese and Japanese — at their own pace, meaningfully, and excel at them.</p></div><div class="footer-copy"><h4>Credits</h4><p>Inspired by wonderful learning tools such as Obenkyo, Free Japanese Lessons, and Tae Kim’s Guide to Learning Japanese.</p></div></div><div class="footer-bottom"><span>Made for curious minds.</span><span>慢慢来 · Take it one step at a time.</span><span>© ${new Date().getFullYear()} Yukoto</span></div></footer>
 ${fab()}
 ${state.dialog?modal():''}
</div>`;
function homePage(){return `
 <section class="home-hero" aria-labelledby="welcome-title">
  <div class="home-hero__copy">
   <div class="hero-eyebrow"><span aria-hidden="true">✿</span>${t('prelude')}</div>
   <h1 id="welcome-title" lang="ja">ようこそ<br /><em>日本語へー</em></h1>
   <p class="hero-english">${t('headline')}</p>
   <div class="hero-rule" aria-hidden="true"></div>
   <p class="hero-description">${t('heroSub')}</p>
   <div class="hero-actions"><a href="#words" class="btn btn--primary">${t('first')} ${icon('arrow',18)}</a><a href="#reading" class="btn btn--pink">${t('second')} ${icon('reading',17)}</a></div>
   <div class="hero-note"><button class="hero-speak" data-action="speak" data-text="ようこそ、日本語へ。" aria-label="Hear the Japanese welcome greeting">${icon('volume',16)} <span lang="ja">ようこそ日本語へー</span></button><span>聞く · 読む · 話す</span></div>
  </div>
  <div class="home-hero__art"><img class="heroine" src="./assets/hero-character.webp" alt="Illustrated adult woman wearing a sakura-patterned yukata with a traditional pink umbrella" fetchpriority="high" /></div>
  <a class="hero-scroll" href="#story">${t('scroll')} <span class="chevron" aria-hidden="true">⌄</span></a>
 </section>
 <section class="home-content" id="story">
  <div class="section-shell">
   <header class="section-head"><div class="eyebrow">✿ OUR LITTLE STORY</div><h2>${t('welcome')}</h2><p>${t('aboutShort')}</p></header>
   <div class="benefits">${[1,2,3].map((n)=>`<div class="glass benefit"><span class="benefit__icon" aria-hidden="true">${['','✦','花','心'][n]}</span><div><strong>${t('benefit'+n)}</strong><p>${t('benefit'+n+'text')}</p></div></div>`).join('')}</div>
   <div class="story-layout">
    <article class="glass story-panel"><span class="eyebrow">わたしの想い</span><h2 style="font-family:var(--serif);font-weight:600;font-size:clamp(24px,3vw,34px)">${t('welcome')}</h2><blockquote>${t('quote')}</blockquote><p>${t('intro')}</p><h3 style="font-family:var(--serif);font-weight:600;font-size:21px;margin-top:21px">${t('why')}</h3><p>日本語 — a language of subtle expression, shared stories, and new connections. <span style="color:#ffcced">一緒に頑張りましょう。</span></p></article>
    <article class="glass trailer-panel"><div class="trailer-frame">${state.playTrailer?`<iframe src="https://www.youtube-nocookie.com/embed/xU47nhruN-Q?autoplay=1&rel=0" title="Kimi no Na wa trailer" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`:`<button class="trailer-play" aria-label="${t('trailerButton')}" data-action="trailer">▶</button>`}</div><div class="trailer-meta"><h3>${t('inspiration')}</h3><p>${t('trailerText')}</p><a href="https://www.youtube.com/watch?v=xU47nhruN-Q" target="_blank" rel="noopener noreferrer">${t('trailerExternal')} ↗</a></div></article>
   </div>
   <div class="practice-cta" style="margin-top:24px"><div><h3>${t('ready')}</h3><p>${t('readyText')}</p></div><a href="#words" class="btn btn--primary">${t('first')} ${icon('arrow')}</a></div>
  </div>
 </section>`}
function savedCount(){return STARTER_WORDS.filter(w=>state.saved.has(wordsId(w))).length}
function filteredWords(){let rows=STARTER_WORDS.filter(w => (state.group==='All'||w.group===state.group)&&(!state.onlySaved||state.saved.has(wordsId(w))));const search=state.wordSearch.trim().toLocaleLowerCase();if(search)rows=rows.filter(w=>[w.japanese,w.reading,w.romaji,w.meaning,w.note].join(' ').toLocaleLowerCase().includes(search));return rows}
function wordCard(word){const id=wordsId(word);const revealed=state.revealed.has(id);return `<article class="word-card"><div class="word-card__top"><span class="word-card__group">${safe(word.group)}</span><span class="word-card__actions"><button class="icon-btn" data-action="speak" data-text="${safe(word.reading || word.japanese)}" aria-label="${t('sound')}" title="${t('sound')}">${icon('volume',17)}</button><button class="icon-btn ${state.saved.has(id)?'is-saved':''}" data-action="save" data-id="${safe(id)}" aria-label="${t('remember')}" aria-pressed="${state.saved.has(id)}" title="${t('remember')}">${icon('heart',17)}</button></span></div><div class="word-card__japanese" lang="ja">${safe(word.japanese)}</div><div class="word-card__reading" lang="ja">${safe(word.reading)} <span style="opacity:.7">/ ${safe(word.romaji)}</span></div><div class="word-card__meaning ${revealed?'':'is-hidden'}">${revealed?safe(word.meaning):'✦ '+t('showMeaning')}${revealed&&word.note?`<div style="margin-top:8px;color:#bccbea;font-size:11px">${safe(word.note)}</div>`:''}</div><div class="word-card__footer"><small>${revealed?'✿ '+t('practice'):'✿ Repeat aloud'}</small><button class="flat-btn" data-action="reveal" data-id="${safe(id)}">${revealed?t('hideMeaning'):t('showMeaning')} ${revealed?'↑':'↓'}</button></div></article>`}
function quizItem(){return STARTER_WORDS[state.quizIndex%STARTER_WORDS.length]}
function wordsPage(){const groups=['All',...new Set(STARTER_WORDS.map(w=>w.group))];const rows=filteredWords();const total=STARTER_WORDS.length;return `<div class="study-page"><div class="section-shell"><header class="study-head"><div><div class="eyebrow">ことば · THE EVERYDAY COLLECTION</div><h1>${t('wordsTitle')}</h1><p>${t('wordsText')}</p></div><div class="study-deco" aria-hidden="true">言</div></header><section class="glass learning-surface" aria-label="Vocabulary study"><div class="toolbar"><div class="filters">${groups.map(g=>`<button class="chip" aria-pressed="${state.group===g&&!state.onlySaved}" data-action="group" data-value="${safe(g)}">${g==='All'?t('all'):safe(g)}</button>`).join('')}<button class="chip" data-action="saved-filter" aria-pressed="${state.onlySaved}">♡ ${t('saved')}</button></div><label class="search-wrap">${icon('search',18)}<span class="sr-only">${t('searchWords')}</span><input type="search" id="word-search" value="${safe(state.wordSearch)}" placeholder="${t('searchWords')}" autocomplete="off"></label></div><hr class="bar-divider"><div class="toolbar"><div class="muted"><span id="word-results-count">${rows.length}</span> ${t('filterResult')} <span style="opacity:.35"> • </span> ${savedCount()} / ${total} ${t('progress')}</div><span class="muted">${t('voiceNote')}</span></div><div class="progress-bar" aria-label="Saved vocabulary progress"><span style="width:${savedCount()/total*100}%"></span></div><div class="word-grid" id="word-grid" style="margin-top:24px">${rows.length?rows.map(wordCard).join(''):`<div class="empty">${t('noWords')}</div>`}</div><section class="drill" id="practice-drill"><div class="eyebrow">✦ ${t('practice').toUpperCase()}</div><h3>${t('drill')}</h3><p>${t('drillHint')}</p><div class="drill__row"><span class="drill__prompt">${safe(quizItem().meaning)}</span><input class="drill__input" id="quiz-answer" placeholder="日本語で答えてみよう" aria-label="Japanese answer" autocomplete="off" spellcheck="false"><button class="btn btn--small" data-action="quiz-check">${t('check')}</button><button class="btn btn--small" data-action="quiz-next">${t('next')} ${icon('arrow',14)}</button></div><div class="drill__feedback" id="quiz-feedback" role="status">${safe(state.quizFeedback)}</div><button class="flat-btn" data-action="quiz-skip">${t('skip')}</button></section></section></div></div>`}
function kanaRow(item){const key=item.char;return `<button class="kana-tile" aria-pressed="${state.selectedKana===key}" data-action="kana" data-value="${safe(key)}"><strong lang="ja">${safe(key)}</strong><small>${safe(item.romaji)}</small></button>`}
function kanaDetail(){const items=state.readingTab==='hiragana'?HIRAGANA:KATAKANA;const item=items.find(k=>k.char===state.selectedKana)||items[0];return `<div class="glass kana-detail" id="kana-detail"><div><strong lang="ja">${safe(item.char)} <span style="font-size:16px;color:#c4daff">${safe(item.romaji)}</span></strong><p>${t('sample')}: <span lang="ja">${safe(item.example)}</span> <span style="opacity:.75">${item.meaning?'— '+safe(item.meaning):''}</span></p></div><button class="btn btn--small" data-action="speak" data-text="${safe(item.example||item.char)}">${icon('volume',17)} ${t('sound')}</button></div>`}
function kanjiCell(item){const open=state.openKanji===item.char;const wiki=`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(item.char+' kanji')}`;return `<article class="kanji-cell ${open?'is-open':''}"><button class="kanji-cell__button" data-action="kanji" data-value="${safe(item.char)}" aria-expanded="${open}"><span class="kanji-cell__char" lang="ja">${safe(item.char)}</span><span class="kanji-cell__body"><span class="kanji-cell__meaning">${safe(item.meaning)}</span><span class="kanji-cell__reading">${safe(item.on)}</span></span></button>${open?`<div class="kanji-cell__detail"><div><strong>${t('on')}</strong> ${safe(item.on||'—')}</div><div><strong>${t('kun')}</strong> ${safe(item.kun||'—')}</div>${item.words.map(word=>`<div style="margin-top:8px"><strong>${t('sample')}</strong> <span lang="ja">${safe(word.word)} (${safe(word.reading)})</span><br>${safe(word.meaning)}</div>`).join('')}<div style="display:flex;gap:12px;align-items:center;margin-top:10px"><button class="icon-btn" data-action="speak" data-text="${safe(item.words[0]?.reading||item.char)}" title="${t('sound')}" aria-label="${t('sound')}">${icon('volume',16)}</button><a href="${wiki}" target="_blank" rel="noopener noreferrer">${t('wiki')} ↗</a></div></div>`:''}</article>`}
function readingPage(){const tab=state.readingTab;const isKanji=tab==='kanji';const items=tab==='hiragana'?HIRAGANA:tab==='katakana'?KATAKANA:KANJI_BY_LEVEL[state.level];return `<div class="study-page"><div class="section-shell"><header class="study-head"><div><div class="eyebrow">ひらがな · カタカナ · 漢字</div><h1>${t('readingTitle')}</h1><p>${t('readingText')}</p></div><div class="study-deco" aria-hidden="true">読</div></header><section class="glass learning-surface"><div class="toolbar"><div class="tabs" role="tablist" aria-label="Japanese writing systems">${[['hiragana',t('hiragana')],['katakana',t('katakana')],['kanji',t('kanji')]].map(([key,label])=>`<button class="tab" role="tab" aria-selected="${tab===key}" data-action="reading-tab" data-value="${key}">${label}</button>`).join('')}</div>${isKanji?`<div class="levels" aria-label="${t('levels')}">${[5,4,3,2,1].map(n=>`<button class="chip" aria-pressed="${state.level===n}" data-action="level" data-value="${n}">N${n}</button>`).join('')}</div>`:''}</div><p class="muted" style="line-height:1.8;margin:5px 0 21px">${isKanji?t('kanjiHint'):t('writingHint')}</p>${isKanji?`<div class="toolbar" style="margin-bottom:18px"><strong style="font-size:13px">${LEVEL_LABELS[state.level]}</strong><span class="muted">${items.length} kanji · ${t('subset')}</span></div><div class="kanji-grid">${items.map(kanjiCell).join('')}</div><p class="level-note">${t('subset')}</p>`:`<div class="kana-grid">${items.map(kanaRow).join('')}</div>${kanaDetail()}`}</section></div></div>`}
function fab(){return `<div class="fab"><button class="fab__trigger" data-action="fab" aria-expanded="${state.drawerOpen}" aria-label="${t('dictionary')} / ${t('otoku')}">本</button>${state.drawerOpen?`<div class="fab__choices"><button class="fab__choice fab__choice--book" data-action="open-dictionary"><span>${t('dictionary')}</span><i aria-hidden="true">${icon('book',19)}</i></button><button class="fab__choice fab__choice--ai" data-action="open-otoku"><span>${t('otoku')}</span><i aria-hidden="true">${icon('eye',19)}</i></button></div>`:''}</div>`}
function filteredDictionary(){
  const q=state.dialogSearch.toLocaleLowerCase().trim();
  const local=DICTIONARY_ENTRIES.filter(e=>!q||[e.char,e.reading,e.meaning,e.category].some(v=>String(v).toLocaleLowerCase().includes(q)));
  const localKeys=new Set(local.map(e=>`${e.char}\u0000${e.reading}`));
  const external=state.externalDictionary.map(entry=>{
    const rawReading=entry.furigana||entry.reading||'';
    const match=rawReading.match(/\[([^\]|]+)\|([^\]]+)\]/);
    const senses=Array.isArray(entry.senses)?entry.senses:[];
    const meanings=senses.filter(sense=>!sense.language||sense.language==='English').flatMap(sense=>Array.isArray(sense.glosses)?sense.glosses:[]).slice(0,8);
    const partsOfSpeech=[...new Set(senses.flatMap(sense=>Array.isArray(sense.part_of_speech)?sense.part_of_speech.flatMap(part=>Object.keys(part)):[]))].slice(0,2).join(', ');
    return {char:match?match[1]:rawReading,reading:match?match[2].replace(/\|/g,''):entry.alt_readings?.join(' / ')||'',meaning:meanings.join('; '),category:partsOfSpeech||'Jotoba dictionary',source:'Jotoba'};
  }).filter(entry=>entry.char&&entry.meaning&&!localKeys.has(`${entry.char}\u0000${entry.reading}`));
  return [...local,...external];
}
function dictionaryList(){
  const rows=filteredDictionary();
  const query=state.dialogSearch.trim();
  const searchUrl=`https://jisho.org/search/${encodeURIComponent(query)}`;
  const jotobaUrl=`https://jotoba.de/search/0/${encodeURIComponent(query)}?l=en-US`;
  const status=state.dictionaryStatus==='loading'?`<p class="dictionary-status" role="status">${t('dictionaryLoading')}</p>`:state.dictionaryStatus==='error'?`<p class="dictionary-status" role="status">${t('dictionaryError')} <a href="${searchUrl}" target="_blank" rel="noopener noreferrer">Jisho ↗</a></p>`:'';
  const entries=rows.map(e=>`<div class="dictionary-entry"><strong lang="ja">${safe(e.char)}</strong><small>${safe(e.category)}</small><p>${safe(e.reading)}<br>${safe(e.meaning)}</p><a href="${e.source==='Jotoba'?jotobaUrl:`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(e.char+' Japanese character')}`}" target="_blank" rel="noopener noreferrer">${e.source==='Jotoba'?'Jotoba':t('wiki')} ↗</a></div>`).join('');
  const empty=query&&!rows.length&&state.dictionaryStatus==='ready'?`<div class="empty">${t('dictionaryNoResults')} <a href="${searchUrl}" target="_blank" rel="noopener noreferrer">Jisho ↗</a></div>`:!rows.length&&!status?`<div class="empty">${t('nothing')}</div>`:'';
  return `${status}${entries?`<div class="dictionary-grid">${entries}</div>`:''}${empty}`;
}
function renderDictionaryResults(){const container=$('#dictionary-results');if(container)container.innerHTML=dictionaryList()}
function resetDictionarySearch(){
  clearTimeout(dictionarySearchTimer);
  dictionaryController?.abort();
  dictionaryController=undefined;
  dictionaryRequest++;
  state.externalDictionary=[];
  state.dictionaryStatus='idle';
}
function scheduleDictionarySearch(query){
  resetDictionarySearch();
  const normalized=query.trim();
  state.dictionaryStatus=normalized?'loading':'idle';
  renderDictionaryResults();
  if(!normalized)return;
  const request=dictionaryRequest;
  dictionarySearchTimer=window.setTimeout(async()=>{
    const controller=new AbortController();
    dictionaryController=controller;
    try{
      const response=await fetch('https://jotoba.de/api/app/words',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query_str:normalized,settings:{jlpt:5,user_lang:'en-US',show_english:true,english_on_top:false,page_size:20,show_example_sentences:false,sentence_furigana:true},page:1,word_index:0}),signal:controller.signal});
      if(!response.ok)throw new Error(`Jotoba request failed with status ${response.status}`);
      const payload=await response.json();
      if(!payload||!Array.isArray(payload.content?.words))throw new Error('Jotoba returned an invalid dictionary response');
      if(request!==dictionaryRequest)return;
      state.externalDictionary=payload.content.words;
      state.dictionaryStatus='ready';
    }catch(error){
      if(error?.name==='AbortError')return;
      if(request!==dictionaryRequest)return;
      console.error('Japanese dictionary search failed:',error);
      state.dictionaryStatus='error';
    }
    renderDictionaryResults();
  },250);
}
function modal(){const dictionary=state.dialog==='dictionary';return `<div class="modal-backdrop" data-action="modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="dialog-title" class="dialog"><header class="dialog__header"><h2 id="dialog-title">${dictionary?t('dictionary'):t('otokuLater')}</h2><button class="icon-btn" data-action="close-modal" aria-label="${t('close')}">${icon('close',20)}</button></header><div class="dialog__body">${dictionary?`<p class="muted">${t('dictionaryHint')}</p><label class="search-wrap" style="max-width:440px;margin-top:16px">${icon('search')}<input type="search" id="dictionary-search" placeholder="${t('dictionaryPlaceholder')}" value="${safe(state.dialogSearch)}" autofocus><button type="button" class="search-clear" data-action="clear-dictionary-search" aria-label="${t('clearSearch')}" title="${t('clearSearch')}" ${state.dialogSearch?'':'hidden'}>${icon('close',16)}</button></label><div id="dictionary-results">${dictionaryList()}</div>`:`<p style="color:#d4e2ff;line-height:1.9">${t('otokuHint')}</p><div style="font-size:50px;text-align:center;padding:25px 0;color:#b9d5ff" aria-hidden="true">◉ ◉</div>`}</div></section></div>`}

function render(options={}){
  const scroll=options.keepScroll?scrollY:null;
  if(state.page==='home'&&homeAnimationStartedAt===0)homeAnimationStartedAt=performance.now();
  const elapsed=homeAnimationStartedAt?performance.now()-homeAnimationStartedAt:0;
  document.documentElement.style.setProperty('--hero-sway-delay',`${-elapsed/1000}s`);
  $('#app').innerHTML=shell();document.documentElement.lang=state.locale;
  if(state.page==='home')hasRenderedHome=true;
  if(state.dialog){const close=$('[data-action=close-modal]');close?.focus({preventScroll:true})}
  if(scroll!==null)window.scrollTo({top:scroll,behavior:'instant'});
}
function renderWordsGrid(){const node=$('#word-grid');if(!node)return;const rows=filteredWords();node.innerHTML=rows.length?rows.map(wordCard).join(''):`<div class="empty">${t('noWords')}</div>`;const count=$('#word-results-count');if(count)count.textContent=String(rows.length)}
function navigate(page, updateHash=true){if(!NAV.includes(page))return;resetDictionarySearch();state.page=page;state.drawerOpen=false;state.dialog=null;state.localeOpen=false;state.playTrailer=false;try{sessionStorage.setItem('yukoto-jp-page',page)}catch{}if(updateHash&&location.hash!==`#${page}`)history.pushState(null,'',`#${page}`);render();window.scrollTo({top:0,behavior:'instant'})}
function speak(text,onStart){if(!('speechSynthesis' in window))return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='ja-JP';utterance.rate=.83;utterance.pitch=1;const voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('ja'));if(voice)utterance.voice=voice;if(onStart)utterance.onstart=onStart;speechSynthesis.speak(utterance)}
const welcomeText='ようこそ日本語へ';
let welcomeStarted=false;
function clearWelcomeFallback(){document.removeEventListener('pointerdown',retryWelcome,true);document.removeEventListener('keydown',retryWelcome,true)}
function markWelcomeStarted(){welcomeStarted=true;clearWelcomeFallback()}
function playWelcome(){if(!welcomeStarted)speak(welcomeText,markWelcomeStarted)}
function retryWelcome(event){if(event.target instanceof Element&&event.target.closest('[data-action="speak"]'))return;clearWelcomeFallback();playWelcome()}
const rememberSaved=()=>{try{localStorage.setItem('yukoto-jp-saved',JSON.stringify([...state.saved]))}catch{}};
function handleAction(btn,event){const action=btn.dataset.action;const value=btn.dataset.value;switch(action){
 case 'toggle-locale':state.localeOpen=!state.localeOpen;render({keepScroll:true});break;
 case 'locale':state.locale=value;state.localeOpen=false;try{localStorage.setItem('yukoto-jp-ui',value)}catch{}render({keepScroll:true});break;
 case 'fab':state.drawerOpen=!state.drawerOpen;render({keepScroll:true});break;
 case 'open-dictionary':resetDictionarySearch();state.dialog='dictionary';state.drawerOpen=false;state.dialogSearch='';render({keepScroll:true});$('#dictionary-search')?.focus();break;
 case 'clear-dictionary-search':{const input=$('#dictionary-search');if(input){input.value='';state.dialogSearch='';const clearButton=$('[data-action="clear-dictionary-search"]');if(clearButton)clearButton.hidden=true;scheduleDictionarySearch('');input.focus()}break;}
 case 'open-otoku':resetDictionarySearch();state.dialog='otoku';state.drawerOpen=false;render({keepScroll:true});break;
 case 'close-modal':resetDictionarySearch();state.dialog=null;render({keepScroll:true});break;
 case 'trailer':state.playTrailer=true;render({keepScroll:true});break;
 case 'group':state.group=value;state.onlySaved=false;render({keepScroll:true});break;
 case 'saved-filter':state.onlySaved=!state.onlySaved;state.group='All';render({keepScroll:true});break;
 case 'speak':speak(btn.dataset.text,btn.dataset.text===welcomeText?markWelcomeStarted:undefined);break;
 case 'save':if(state.saved.has(btn.dataset.id))state.saved.delete(btn.dataset.id);else state.saved.add(btn.dataset.id);rememberSaved();render({keepScroll:true});break;
 case 'reveal':if(state.revealed.has(btn.dataset.id))state.revealed.delete(btn.dataset.id);else state.revealed.add(btn.dataset.id);render({keepScroll:true});break;
 case 'quiz-check':{const word=quizItem();const input=$('#quiz-answer')?.value.trim()||'';const expected=[word.japanese,word.reading].filter(Boolean).map(v=>v.replace(/[。！!\s]/g,''));const correct=input&&expected.includes(input.replace(/[。！!\s]/g,''));state.quizFeedback=correct?t('correct'):`${t('wrong')} ${word.japanese} (${word.reading})`;const output=$('#quiz-feedback');if(output)output.textContent=state.quizFeedback;break;}
 case 'quiz-next':state.quizIndex=(state.quizIndex+1)%STARTER_WORDS.length;state.quizFeedback='';render({keepScroll:true});$('#quiz-answer')?.focus();break;
 case 'quiz-skip':state.quizFeedback=`${t('wrong')} ${quizItem().japanese} (${quizItem().reading})`;$('#quiz-feedback').textContent=state.quizFeedback;break;
 case 'reading-tab':state.readingTab=value;state.selectedKana=null;state.openKanji=null;render({keepScroll:true});break;
 case 'level':state.level=Number(value);state.openKanji=null;render({keepScroll:true});break;
 case 'kanji':state.openKanji=state.openKanji===value?null:value;render({keepScroll:true});break;
 case 'kana':state.selectedKana=value;render({keepScroll:true});const k=(state.readingTab==='hiragana'?HIRAGANA:KATAKANA).find(e=>e.char===value);if(k)speak(k.char);break;
 case 'modal-backdrop':if(event.target.classList.contains('modal-backdrop')){resetDictionarySearch();state.dialog=null;render({keepScroll:true})}break;
 }}

document.addEventListener('click',event=>{
  const nav=event.target.closest('a[href^="#"]');if(nav){const hash=nav.getAttribute('href').slice(1);if(NAV.includes(hash)){event.preventDefault();navigate(hash);return}}
  const btn=event.target.closest('[data-action]');if(btn){event.preventDefault();handleAction(btn,event);return}
  if(state.localeOpen&&!event.target.closest('.locale')){state.localeOpen=false;render({keepScroll:true})}
});
document.addEventListener('input',event=>{if(event.target.id==='word-search'){state.wordSearch=event.target.value;renderWordsGrid()}if(event.target.id==='dictionary-search'){state.dialogSearch=event.target.value;const clearButton=$('[data-action="clear-dictionary-search"]');if(clearButton)clearButton.hidden=!event.target.value;scheduleDictionarySearch(state.dialogSearch)}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(state.dialog){resetDictionarySearch();state.dialog=null;render({keepScroll:true})}else if(state.localeOpen||state.drawerOpen){state.localeOpen=false;state.drawerOpen=false;render({keepScroll:true})}}if(event.key==='Enter'&&event.target.id==='quiz-answer'){$('[data-action=quiz-check]')?.click()}});
window.addEventListener('popstate',()=>{const current=location.hash.substring(1);navigate(NAV.includes(current)?current:'home',false)});
window.addEventListener('hashchange',()=>{const current=location.hash.substring(1);if(NAV.includes(current)&&current!==state.page)navigate(current,false)});

render();
if(state.page==='home'&&'speechSynthesis'in window){document.addEventListener('pointerdown',retryWelcome,true);document.addEventListener('keydown',retryWelcome,true);playWelcome()}
