import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve('.');
const japaneseData = await import(pathToFileURL(resolve(root, 'public/japanese/data.js')).href);
const curriculum = JSON.parse(await readFile(resolve(root, 'src/data/curriculum.json'), 'utf8'));

const chineseLearn = {
  characters: [
    ['人', 'rén', 'person; people', 'A person standing with legs apart.', '人们 (rénmen) — people'],
    ['口', 'kǒu', 'mouth; opening', 'A simple outline of an open mouth.', '入口 (rùkǒu) — entrance'],
    ['日', 'rì', 'sun; day', 'An old drawing of the sun enclosed by a boundary.', '日子 (rìzi) — day; days'],
    ['月', 'yuè', 'moon; month', 'A picture of a crescent moon with inner strokes.', '月亮 (yuèliang) — moon'],
    ['山', 'shān', 'mountain', 'Three peaks, with the middle peak tallest.', '高山 (gāoshān) — high mountain'],
    ['水', 'shuǐ', 'water', 'Flowing water shown with a central stream and side drops.', '水果 (shuǐguǒ) — fruit'],
    ['木', 'mù', 'tree; wood', 'A trunk with branches and roots.', '木头 (mùtou) — wood'],
    ['火', 'huǒ', 'fire', 'Flames rising from a small base.', '火车 (huǒchē) — train'],
    ['手', 'shǒu', 'hand', 'A hand with fingers extending from the palm.', '手机 (shǒujī) — mobile phone'],
    ['女', 'nǚ', 'woman; female', 'An old pictograph of a person with folded arms.', '女儿 (nǚ’ér) — daughter'],
    ['子', 'zǐ', 'child; son', 'A small child with a head and outstretched arms.', '孩子 (háizi) — child'],
    ['田', 'tián', 'field', 'A divided field seen from above.', '田地 (tiándì) — fields'],
    ['中', 'zhōng', 'middle; China (in compounds)', 'A line through the centre of a marked area.', '中国 (Zhōngguó) — China'],
    ['大', 'dà', 'big; large', 'A person with arms and legs spread wide.', '大家 (dàjiā) — everyone'],
    ['小', 'xiǎo', 'small; little', 'A central mark with two small marks beside it.', '小心 (xiǎoxīn) — be careful']
  ],
  idioms: [
    ['一心一意', 'yìxīn yíyì', 'wholeheartedly; with undivided attention', 'one heart, one mind', 'Used when someone focuses on one thing and puts their full attention into it.'],
    ['一举两得', 'yì jǔ liǎng dé', 'To achieve two useful things with one action.', 'one action, two gains', 'Said when one choice solves two needs.'],
    ['画蛇添足', 'huà shé tiān zú', 'draw a snake and add feet', 'To spoil something by adding unnecessary details.', 'Said when an extra action makes a good result worse.'],
    ['对牛弹琴', 'duì niú tán qín', 'play a zither to a cow', 'To explain something to someone who cannot appreciate or understand it.', 'Often used humorously when an explanation is not reaching its audience.'],
    ['井底之蛙', 'jǐng dǐ zhī wā', 'a frog at the bottom of a well', 'Someone with a very limited view of the world.', 'Used as a caution about narrow experience; it can sound critical.'],
    ['守株待兔', 'shǒu zhū dài tù', 'wait by a tree stump for a rabbit', 'To wait for luck instead of making an effort.', 'A caution against relying on a lucky accident.']
  ],
  phrases: [
    ['请问，洗手间在哪里？', 'qǐngwèn, xǐshǒujiān zài nǎlǐ?', 'Excuse me, where is the restroom?', 'Use 请问 to politely open a question to a stranger.'],
    ['这个多少钱？', 'zhège duōshao qián?', 'How much is this?', 'A common question when shopping; point to the item if needed.'],
    ['我想要这个。', 'wǒ xiǎng yào zhège.', 'I would like this.', 'Use when ordering or choosing an item; point to what you mean.'],
    ['请给我一杯水。', 'qǐng gěi wǒ yì bēi shuǐ.', 'Please give me a glass of water.', 'A polite request in a café or restaurant.'],
    ['可以刷卡吗？', 'kěyǐ shuākǎ ma?', 'Can I pay by card?', 'Ask before paying; payment options vary by shop.'],
    ['请说慢一点。', 'qǐng shuō màn yìdiǎn.', 'Please speak a little more slowly.', 'A useful, polite request when you are learning.'],
    ['我听不懂。', 'wǒ tīng bù dǒng.', 'I do not understand (what I hear).', 'Use when spoken Chinese is too difficult to follow.'],
    ['可以帮我吗？', 'kěyǐ bāng wǒ ma?', 'Could you help me?', 'A polite way to ask someone nearby for help.'],
    ['我在这里下车。', 'wǒ zài zhèlǐ xià chē.', 'I will get off here.', 'Tell a driver or travel companion where you plan to get off.'],
    ['麻烦给我打包。', 'máfan gěi wǒ dǎbāo.', 'Could you pack this to go, please?', 'A polite request for takeaway packaging in a restaurant.']
  ]
};

const japaneseLearn = {
  characters: [
    ['日', 'ひ / にち / じつ', 'sun; day', 'The sun is pictured inside a boundary.', '日本 (にほん) — Japan'],
    ['月', 'つき / げつ / がつ', 'moon; month', 'A crescent moon shape with inner marks.', '月曜日 (げつようび) — Monday'],
    ['人', 'ひと / じん / にん', 'person; people', 'Two strokes suggest a person standing.', '日本人 (にほんじん) — Japanese person'],
    ['山', 'やま / さん', 'mountain', 'Three mountain peaks are shown in outline.', '火山 (かざん) — volcano'],
    ['川', 'かわ / せん', 'river', 'Three flowing lines represent a river.', '小川 (おがわ) — stream'],
    ['木', 'き / もく / ぼく', 'tree; wood', 'A trunk with branches and roots.', '木曜日 (もくようび) — Thursday'],
    ['水', 'みず / すい', 'water', 'The strokes suggest water flowing from a source.', '水曜日 (すいようび) — Wednesday'],
    ['火', 'ひ / か', 'fire', 'The shape is based on rising flames.', '火曜日 (かようび) — Tuesday'],
    ['口', 'くち / こう', 'mouth; opening', 'A square opening is shown from the front.', '入口 (いりぐち) — entrance'],
    ['手', 'て / しゅ', 'hand', 'A hand shape with fingers and palm.', '手紙 (てがみ) — letter'],
    ['大', 'おお(きい) / だい / たい', 'big; large', 'A person stands with arms and legs spread.', '大学 (だいがく) — university'],
    ['小', 'ちい(さい) / しょう', 'small; little', 'Small marks sit around a central stroke.', '小学校 (しょうがっこう) — elementary school'],
    ['中', 'なか / ちゅう', 'inside; middle', 'A line marks the centre of a box.', '中国 (ちゅうごく) — China'],
    ['上', 'うえ / じょう', 'above; up', 'A mark sits above a baseline.', '上手 (じょうず) — skillful'],
    ['下', 'した / か / げ', 'below; down', 'A mark sits below a baseline.', '地下 (ちか) — underground']
  ],
  idioms: [
    ['十人十色', 'じゅうにんといろ · jūnin toiro', 'ten people, ten colours', 'Everyone has different tastes or opinions.', 'Said when acknowledging that people are not all alike.'],
    ['一石二鳥', 'いっせきにちょう · isseki nichō', 'one stone, two birds', 'To get two benefits from one action.', 'Used much like “kill two birds with one stone”; common in everyday conversation.'],
    ['温故知新', 'おんこちしん · onko chishin', 'review the old, learn the new', 'Learn something new by revisiting the past.', 'Often used about study, history, and learning from experience.'],
    ['自業自得', 'じごうじとく · jigō jitoku', 'one’s own actions, one’s own result', 'To face the consequences of your own actions.', 'Can sound blunt or judgmental; use carefully about someone else.'],
    ['七転八起', 'しちてんはっき · shichiten hakki', 'fall seven times, rise eight', 'Keep getting back up after setbacks.', 'An encouraging expression about perseverance.']
  ],
  phrases: [
    ['これをください。', 'これをください · kore o kudasai', 'This one, please.', 'A polite, simple way to order or choose an item.'],
    ['駅はどこですか。', 'えきはどこですか · eki wa doko desu ka', 'Where is the station?', 'Use to ask for the location of a station.'],
    ['いくらですか。', 'いくらですか · ikura desu ka', 'How much is it?', 'A basic shopping question; point to the item if helpful.'],
    ['もう一度お願いします。', 'もういちどおねがいします · mō ichido onegaishimasu', 'One more time, please.', 'Use politely when you need something repeated.'],
    ['ゆっくり話してください。', 'ゆっくりはなしてください · yukkuri hanashite kudasai', 'Please speak slowly.', 'A polite request when you are still learning Japanese.'],
    ['水をお願いします。', 'みずをおねがいします · mizu o onegaishimasu', 'Water, please.', 'A simple, polite request in a restaurant.'],
    ['写真を撮ってもいいですか。', 'しゃしんをとってもいいですか · shashin o totte mo ii desu ka', 'May I take a photo?', 'Ask permission before taking a photo, especially of people or inside a venue.'],
    ['カードは使えますか。', 'カードはつかえますか · kādo wa tsukaemasu ka', 'Can I use a card?', 'Ask whether card payment is accepted before ordering or paying.'],
    ['大丈夫です。', 'だいじょうぶです · daijōbu desu', 'It is okay / I am all right.', 'Meaning depends on context; it can also politely decline an offer.'],
    ['ここで降ります。', 'ここでおります · koko de orimasu', 'I will get off here.', 'Tell a driver or companion where you plan to get off.']
  ]
};

const chineseSourceWords = curriculum.entries
  .filter(entry => entry.hanzi && entry.pinyin && entry.meanings?.length && entry.levels?.some(level => /^(old|new)-[1-3]$/.test(level)))
  .sort((left, right) => left.hanzi.length - right.hanzi.length || left.hanzi.localeCompare(right.hanzi));
const japaneseSourceWords = japaneseData.STARTER_WORDS;

function levelForChinese(entry) {
  const levels = entry.levels.map(level => Number(level.split('-')[1])).filter(level => level <= 3);
  return `HSK ${Math.min(...levels)}`;
}

function createLanguage(language, learn, words) {
  const zh = language === 'zh';
  const audioCards = words.slice(0, 45).map((word, index) => ({
    id: `${language}-listen-${String(index + 1).padStart(3, '0')}`,
    group: 'listen',
    kind: 'audio',
    language,
    level: zh ? levelForChinese(word) : index < 35 ? 'N5' : 'N4',
    text: zh ? word.hanzi : word.japanese,
    reading: zh ? word.pinyin : `${word.reading}${word.romaji ? ` · ${word.romaji}` : ''}`,
    meaning: zh ? word.meanings[0] : word.meaning,
    ...(zh ? { example: word.examples?.[0]?.hanzi || '' } : {}),
    ...(zh ? { source: word.sources?.[0] || 'Yukoto HSK vocabulary' } : { source: 'Yukoto Japanese starter vocabulary' }),
    tags: ['starter', 'audio']
  }));
  const makeLearn = (items, kind) => items.map((item, index) => {
    const [text, reading, meaning, detail, example] = item;
    return {
      id: `${language}-${kind}-${String(index + 1).padStart(3, '0')}`,
      group: 'learn',
      kind,
      language,
      level: kind === 'idiom'
        ? zh ? `HSK ${index === 0 ? 1 : index === 1 ? 2 : 3}` : index === 0 ? 'N5' : 'N4'
        : zh ? `HSK ${index < 6 ? 1 : index < 11 ? 2 : 3}` : index < (kind === 'phrase' ? 5 : 10) ? 'N5' : 'N4',
      text,
      reading,
      meaning,
      ...(kind === 'character' ? { components: detail, example } : kind === 'idiom' ? { literalMeaning: detail, whenToUse: example } : { whenToUse: detail, example }),
      source: 'Original Rhiye starter content',
      tags: ['starter', zh ? 'beginner' : 'beginner']
    };
  });
  const videos = zh ? [
    ['LelIk-SEQyg', 'life-video', '水上樂園的社死瞬間，快找個地縫鑽進去吧！', '社死', 'shè sǐ', 'an embarrassing public moment'],
    ['LiaGKBHjUoA', 'life-video', '音樂“四重奏”串燒爆火後續！女生坐不住了大冒險在電梯裏唱歌網友：拖拉機的車身 法拉利的聲浪', '電梯', 'diàntī', 'elevator'],
    ['e8iQPpi8QfQ', 'life-video', '當我在燒烤攤和老婆唱歌，但她不想唱時，服務員居然', '燒烤攤', 'shāokǎo tān', 'barbecue stall'],
    ['HPuxFjAS0Ck', 'life-video', '音樂尖子生班自習課即興挑戰，誰知碰上顯眼包', '自習課', 'zìxí kè', 'study period'],
    ['Nemq71puHLA', 'screen-video', '茶花开了该回家了', '回家', 'huí jiā', 'go home'],
    ['IkLOflVJTME', 'life-video', 'Small Talk in China (as a foreigner)', '聊天', 'liáotiān', 'to chat'],
    ['of4BjnTqMUU', 'life-video', 'How to learn mandarin in 2025', '學習', 'xuéxí', 'to study; learning'],
    ['pfYr23j4my8', 'life-video', '如果你没参加高考，那你不是中国人', '高考', 'gāokǎo', 'China’s university entrance exam'],
    ['NMyDJveRyPA', 'life-video', 'After Work Chinese Conversation | Beginner Mandarin (HSK1–2)', '下班', 'xiàbān', 'to finish work'],
    ['MxyTJo1CNuk', 'life-video', 'Northern mandarin or southern mandarin accent, which’s better', '口音', 'kǒuyīn', 'accent'],
    ['oM-goqxbZkA', 'life-video', 'What business culture like in China?', '文化', 'wénhuà', 'culture'],
    ['7O2i7k9x_LE', 'life-video', 'What’s it like growing up half Chinese', '長大', 'zhǎng dà', 'to grow up'],
    ['YUTX1hucgR4', 'life-video', 'The best way to learn mandarin is …', '方法', 'fāngfǎ', 'method; way'],
    ['fVYwWQe1a4I', 'life-video', 'How did she actually learned mandarin so well?', '中文', 'Zhōngwén', 'Chinese language'],
    ['1jzqqy86--8', 'life-video', 'What not to do when learning Chinese', '不要', 'bú yào', 'do not; should not'],
    ['4QnGVGtSXgs', 'life-video', 'Living in China as an black women', '生活', 'shēnghuó', 'life; to live'],
    ['nqud3GxgAeA', 'life-video', 'Northern Chinese accent or southern?', '南方', 'nánfāng', 'the south'],
    ['dltIoJJmzhQ', 'life-video', 'What Chinese people think about Americans · Polyglot in China', '美國人', 'Měiguó rén', 'American person']
  ] : [
    ['wTSdRX6cCEg', 'screen-video', 'あだ名で有名人になった', 'あだ名', 'あだな · adana', 'nickname'],
    ['mK2iCy7XymM', 'life-video', "That's fine We'll wait | Restaurant conversation in Japanese", '待ちます', 'まちます · machimasu', 'we will wait'],
    ['QjLah772HJQ', 'screen-video', 'ゴルゴ松本有る難・無い難', '難しい', 'むずかしい · muzukashii', 'difficult'],
    ['1AKostAXdZ4', 'screen-video', 'あなたの人生は特別だった', '人生', 'じんせい · jinsei', 'life'],
    ['-mDhsDkuSAk', 'screen-video', '出だし歌った瞬間、全員号泣した理由', '歌う', 'うたう · utau', 'to sing'],
    ['QvBaa1ZOW-8', 'life-video', '日本の街中で中学生に話しかけたアメリカ人が衝撃を受けたこと', '中学生', 'ちゅうがくせい · chūgakusei', 'middle school student'],
    ['iN7CcICjcBg', 'screen-video', '原曲キーで出しきる超高音…竹中雄大の鳥肌ライブ', '高音', 'こうおん · kōon', 'high-pitched sound'],
    ['aH4MCC5dStw', 'screen-video', '一度だけじゃ終われないデュエット 点描の唄', '一度', 'いちど · ichido', 'once'],
    ['ew9ApDtpuYE', 'screen-video', '最低な君 - Hamano Haruki', '君', 'きみ · kimi', 'you (casual)'],
    ['P-fRDBJmj08', 'screen-video', 'mosi mosi? (anime singing...)', 'もしもし', 'もしもし · moshi moshi', 'hello (on the phone)'],
    ['PEeD60_zdhI', 'screen-video', '極悪難易度の曲を指一本で指揮する、驚異のラスト', '指', 'ゆび · yubi', 'finger'],
    ['rTGStNbQv1Y', 'screen-video', '【ギジコイ(GIJIKOI)】I’ll make you smile the most', '笑顔', 'えがお · egao', 'smile'],
    ['ErbfiPo_tMw', 'life-video', '【長女リクエスト】JKにSuica入りステッキを3Dプリンターで作ってプレゼントしてみた', '作る', 'つくる · tsukuru', 'to make'],
    ['0juoSAy0AXA', 'screen-video', 'Ranking NICHIJOU FUNNY Moments😭😂... The Last One Will Shock You', '日常', 'にちじょう · nichijō', 'everyday life; Nichijou'],
    ['XKH0xHuV8SU', 'screen-video', 'She saw it all... and told no one. #Nichijou #Principal #Deer', '見た', 'みた · mita', 'saw'],
    ['T0ukRnQhdQs', 'screen-video', 'Nichijou - Introducing oneself (lol)', '自己紹介', 'じこしょうかい · jikoshōkai', 'self-introduction'],
    ['b91zamJw6P0', 'life-video', '６選】キレイで見やすいノートの書き方 #ノート術 #勉強', 'ノート', 'のーと · nōto', 'notebook'],
    ['Kzr6o5qiVRI', 'screen-video', 'The Best Voices In Anime Pt. 2', '声', 'こえ · koe', 'voice']
  ];
  const videoCards = videos.map(([videoId, kind, title, text, reading, meaning]) => ({
    id: `${language}-video-${videoId}`,
    group: 'watch',
    kind,
    language,
    level: zh ? 'HSK 1' : 'N5',
    text: title,
    reading: zh ? 'Mandarin' : 'Japanese',
    meaning: '',
    videoId,
    startSeconds: 0,
    segmentVerified: true,
    embedVerified: true,
    listenFor: { text, reading, meaning },
    source: 'User-confirmed authorized YouTube Short; play the full Short.',
    tags: ['user-supplied', kind === 'life-video' ? 'daily-life' : 'series-film-anime']
  }));
  return {
    language,
    schemaVersion: 1,
    sourceNote: zh
      ? 'Chinese vocabulary is selected from the site’s existing HSK source data; original learning notes and daily phrases are written for Rhiye.'
      : 'Listening words are selected from the site’s existing Japanese starter vocabulary; original learning notes and phrases are written for Rhiye.',
    characters: makeLearn(learn.characters, 'character'),
    idioms: makeLearn(learn.idioms, 'idiom'),
    phrases: makeLearn(learn.phrases, 'phrase'),
    listen: audioCards,
    videos: videoCards,
    nativeSpeakerReview: zh
      ? [{ cardId: 'zh-idiom-004', note: 'Check register and tone for a humorous use of 对牛弹琴.' }]
      : [{ cardId: 'ja-phrase-009', note: 'Check context-sensitive nuance and polite refusal use of 大丈夫です.' }, { cardId: 'ja-idiom-004', note: 'Check how direct 自業自得 sounds in the described context.' }]
  };
}

await mkdir(resolve(root, 'public/rhiye/data'), { recursive: true });
for (const [language, learn, words] of [
  ['zh', chineseLearn, chineseSourceWords],
  ['ja', japaneseLearn, japaneseSourceWords]
]) {
  if (words.length < 45) throw new Error(`${language} source only provides ${words.length} listening cards; expected at least 45.`);
  const data = createLanguage(language, learn, words);
  const count = data.characters.length + data.idioms.length + data.phrases.length + data.listen.length;
  if (count < 75) throw new Error(`${language} pool has only ${count} learn and listen cards.`);
  await writeFile(resolve(root, `public/rhiye/data/${language}.json`), `${JSON.stringify(data, null, 2)}\n`);
  const suppliedVideos = data.videos.filter(card => card.videoId).length;
  const placeholders = data.videos.length - suppliedVideos;
  console.log(`${language}: ${count} learn/listen cards, ${suppliedVideos} authorized Shorts, and ${placeholders} placeholders.`);
}
