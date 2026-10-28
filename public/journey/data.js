import {STARTER_WORDS,HIRAGANA,KATAKANA} from '../japanese/data.js';
import {hskDataset} from './datasets/hsk-vocabulary.js';
import {jlptDataset} from './datasets/jlpt-vocabulary.js';
// Curated starter lessons are examples, not full JLPT/HSK datasets or exam certification.
// Stable IDs are shared by Guided Path, Free Explore, Library and Review.
export const languages = {
  ja: { label: 'Japanese', native: '日本語', short: 'JP', level: 'Foundation · pre-N5 / N5', hello: '今日も一歩ずつ。', description: 'Find your rhythm. Make every word count.', locale: 'ja-JP' },
  zh: { label: 'Chinese', native: '中文', short: 'ZH', level: 'Foundation · introductory HSK', hello: '每天进步一点点。', description: 'One new phrase. One new possibility.', locale: 'zh-CN' }
};
const jp = [
  {id:'ja-greetings',unit:'01 · First connections',title:'Say hello naturally',subtitle:'Greetings for everyday situations',time:7,emoji:'✦',words:[
    ['ohayou','おはようございます','Ohayō gozaimasu','Good morning','おはようございます。','Good morning.'],
    ['konnichiwa','こんにちは','Konnichiwa','Hello / good afternoon','こんにちは、田中さん。','Hello, Tanaka.'],
    ['konbanwa','こんばんは','Konbanwa','Good evening','こんばんは、みなさん。','Good evening, everyone.'],
    ['arigatou','ありがとうございます','Arigatō gozaimasu','Thank you (polite)','ありがとうございます。','Thank you very much.']
  ],reading:{native:'朝、先生に会いました。「おはようございます」と言いました。',roman:'Asa, sensei ni aimashita. “Ohayō gozaimasu” to iimashita.',translation:'In the morning, I met my teacher. I said, “Good morning.”'},quiz:0},
  {id:'ja-introductions',unit:'01 · First connections',title:'Introduce yourself',subtitle:'Names, origins and polite beginnings',time:9,emoji:'◈',words:[
    ['watashi','私','Watashi','I / me','私は学生です。','I am a student.'],
    ['namae','名前','Namae','Name','お名前は何ですか。','What is your name?'],
    ['hajimemashite','はじめまして','Hajimemashite','Nice to meet you','はじめまして。アキです。','Nice to meet you. I am Aki.'],
    ['yoroshiku','よろしくお願いします','Yoroshiku onegai shimasu','I look forward to knowing / working with you','よろしくお願いします。','Pleased to meet you.']
  ],reading:{native:'はじめまして。私はアキです。日本から来ました。よろしくお願いします。',roman:'Hajimemashite. Watashi wa Aki desu. Nihon kara kimashita. Yoroshiku onegai shimasu.',translation:'Nice to meet you. I am Aki. I came from Japan. Pleased to meet you.'},quiz:2},
  {id:'ja-simple-questions',unit:'01 · First connections',title:'Ask simple questions',subtitle:'Start a two-way conversation',time:8,emoji:'❊',words:[
    ['nani','何','Nani','What','これは何ですか。','What is this?'],
    ['doko','どこ','Doko','Where','駅はどこですか。','Where is the station?'],
    ['dare','誰','Dare','Who','あの人は誰ですか。','Who is that person?'],
    ['hai','はい','Hai','Yes','はい、そうです。','Yes, that is right.']
  ],reading:{native:'「駅はどこですか」「あそこです」「ありがとうございます」',roman:'“Eki wa doko desu ka?” “Asoko desu.” “Arigatō gozaimasu.”',translation:'“Where is the station?” “Over there.” “Thank you.”'},quiz:1},
  {id:'ja-daily-life',unit:'02 · Everyday moments',title:'Talk about your day',subtitle:'Time, today and tomorrow',time:9,emoji:'☼',words:[
    ['kyou','今日','Kyō','Today','今日は月曜日です。','Today is Monday.'],
    ['ashita','明日','Ashita','Tomorrow','明日は休みです。','Tomorrow is a day off.'],
    ['ima','今','Ima','Now','今、勉強しています。','I am studying now.'],
    ['mainichi','毎日','Mainichi','Every day','毎日、日本語を勉強します。','I study Japanese every day.']
  ],reading:{native:'今日は忙しいです。でも、明日は休みです。毎日少し勉強します。',roman:'Kyō wa isogashii desu. Demo, ashita wa yasumi desu. Mainichi sukoshi benkyō shimasu.',translation:'Today is busy. But tomorrow is a day off. I study a little every day.'},quiz:0},
  {id:'ja-food',unit:'02 · Everyday moments',title:'Order something to eat',subtitle:'Food, drinks and simple requests',time:10,emoji:'◌',words:[
    ['mizu','水','Mizu','Water','水をください。','Water, please.'],
    ['tabemono','食べ物','Tabemono','Food','好きな食べ物は何ですか。','What food do you like?'],
    ['oishii','おいしい','Oishii','Delicious','この料理はおいしいです。','This dish is delicious.'],
    ['kudasai','ください','Kudasai','Please give me','お茶をください。','Tea, please.']
  ],reading:{native:'カフェで水とパンをくださいと言いました。パンはおいしいです。',roman:'Kafe de mizu to pan o kudasai to iimashita. Pan wa oishii desu.',translation:'At a café I asked for water and bread. The bread is delicious.'},quiz:0},
  {id:'ja-directions',unit:'03 · Out in the world',title:'Find your way around',subtitle:'Locations, movement and directions',time:10,emoji:'↗',words:[
    ['eki','駅','Eki','Train station','駅に行きます。','I am going to the station.'],
    ['migi','右','Migi','Right','右に曲がってください。','Please turn right.'],
    ['hidari','左','Hidari','Left','左にあります。','It is on the left.'],
    ['chikai','近い','Chikai','Near','駅は近いです。','The station is nearby.']
  ],reading:{native:'駅は近いです。次の道を右に曲がってください。',roman:'Eki wa chikai desu. Tsugi no michi o migi ni magatte kudasai.',translation:'The station is near. Please turn right at the next road.'},quiz:1}
];
const cn = [
  {id:'zh-greetings',unit:'01 · First connections',title:'Say hello naturally',subtitle:'Greetings and everyday politeness',time:7,emoji:'✦',words:[
    ['nihao','你好','Nǐ hǎo','Hello','你好！','Hello!'],
    ['zaoshanghao','早上好','Zǎoshang hǎo','Good morning','老师，早上好！','Good morning, teacher!'],
    ['xiexie','谢谢','Xièxie','Thank you','谢谢你！','Thank you!'],
    ['zaijian','再见','Zàijiàn','Goodbye','明天见，再见！','See you tomorrow, goodbye!']
  ],reading:{native:'早上，小明见到老师。他说：“老师，早上好！”老师说：“你好！”',roman:'Zǎoshang, Xiǎomíng jiàn dào lǎoshī. Tā shuō: “Lǎoshī, zǎoshang hǎo!” Lǎoshī shuō: “Nǐ hǎo!”',translation:'In the morning, Xiaoming meets his teacher. He says, “Good morning, teacher!” The teacher says, “Hello!”'},quiz:1},
  {id:'zh-introductions',unit:'01 · First connections',title:'Introduce yourself',subtitle:'Names and where you are from',time:9,emoji:'◈',words:[
    ['wo','我','Wǒ','I / me','我是学生。','I am a student.'],
    ['mingzi','名字','Míngzi','Name','你叫什么名字？','What is your name?'],
    ['jiao','叫','Jiào','To be called','我叫小美。','My name is Xiaomei.'],
    ['renshi','认识','Rènshi','To know / meet','很高兴认识你。','Nice to meet you.']
  ],reading:{native:'你好！我叫小美。我是学生。很高兴认识你！',roman:'Nǐ hǎo! Wǒ jiào Xiǎoměi. Wǒ shì xuésheng. Hěn gāoxìng rènshi nǐ!',translation:'Hello! My name is Xiaomei. I am a student. Nice to meet you!'},quiz:1},
  {id:'zh-simple-questions',unit:'01 · First connections',title:'Ask simple questions',subtitle:'Who, what and where',time:8,emoji:'❊',words:[
    ['shenme','什么','Shénme','What','这是什么？','What is this?'],
    ['nali','哪里','Nǎlǐ','Where','你在哪里？','Where are you?'],
    ['shei','谁','Shéi','Who','他是谁？','Who is he?'],
    ['ma','吗','Ma','Yes/no question particle','你是老师吗？','Are you a teacher?']
  ],reading:{native:'“你在哪里？”“我在学校。”“你是学生吗？”“是的。”',roman:'“Nǐ zài nǎlǐ?” “Wǒ zài xuéxiào.” “Nǐ shì xuésheng ma?” “Shì de.”',translation:'“Where are you?” “I am at school.” “Are you a student?” “Yes.”'},quiz:1},
  {id:'zh-daily-life',unit:'02 · Everyday moments',title:'Talk about your day',subtitle:'Today, tomorrow and routines',time:9,emoji:'☼',words:[
    ['jintian','今天','Jīntiān','Today','今天天气很好。','The weather is nice today.'],
    ['mingtian','明天','Míngtiān','Tomorrow','明天见！','See you tomorrow!'],
    ['xianzai','现在','Xiànzài','Now','我现在学习中文。','I am studying Chinese now.'],
    ['meitian','每天','Měitiān','Every day','我每天读书。','I read every day.']
  ],reading:{native:'今天天气很好。我现在学习中文。明天我也要学习。',roman:'Jīntiān tiānqì hěn hǎo. Wǒ xiànzài xuéxí Zhōngwén. Míngtiān wǒ yě yào xuéxí.',translation:'The weather is nice today. I am studying Chinese now. I also want to study tomorrow.'},quiz:0},
  {id:'zh-food',unit:'02 · Everyday moments',title:'Order something to eat',subtitle:'Food, drinks and polite requests',time:10,emoji:'◌',words:[
    ['shui','水','Shuǐ','Water','我要一杯水。','I want a glass of water.'],
    ['chi','吃','Chī','To eat','你想吃什么？','What would you like to eat?'],
    ['hao chi','好吃','Hǎochī','Tasty','这个很好吃。','This is delicious.'],
    ['qing','请','Qǐng','Please','请给我一杯茶。','Please give me a cup of tea.']
  ],reading:{native:'我去饭店。我说：“请给我一杯水。”这个菜很好吃。',roman:'Wǒ qù fàndiàn. Wǒ shuō: “Qǐng gěi wǒ yì bēi shuǐ.” Zhège cài hěn hǎochī.',translation:'I go to a restaurant. I say, “Please give me a glass of water.” This dish is very tasty.'},quiz:0},
  {id:'zh-directions',unit:'03 · Out in the world',title:'Find your way around',subtitle:'Places and basic directions',time:10,emoji:'↗',words:[
    ['chezhan','车站','Chēzhàn','Station','车站在哪里？','Where is the station?'],
    ['you','右','Yòu','Right','往右走。','Walk to the right.'],
    ['zuo','左','Zuǒ','Left','往左走。','Walk to the left.'],
    ['jin','近','Jìn','Near','车站很近。','The station is near.']
  ],reading:{native:'车站很近。先往左走，然后往右走。',roman:'Chēzhàn hěn jìn. Xiān wǎng zuǒ zǒu, ránhòu wǎng yòu zǒu.',translation:'The station is nearby. First walk left, then walk right.'},quiz:2}
];
// A single set of IDs is shared between practice, review, guided study and the existing pages.
// HSK level membership comes directly from the source-verified, bundled Chinese corpus.
// Japanese N-level membership is community/curated, not an official JLPT specification.
function expand(code, list) {
 return list.map((l,idx)=>({id:l.id,language:code,track:'foundation',level:'foundation',order:idx+1,unit:l.unit,title:l.title,subtitle:l.subtitle,time:l.time,emoji:l.emoji,words:l.words.map(([id,native,roman,meaning,example,exampleMeaning])=>({id:code+'-'+id.replaceAll(' ','-'),native,roman,meaning,example,exampleMeaning})),reading:l.reading,quiz:l.quiz}));
}
const starter={ja:expand('ja',jp),zh:expand('zh',cn)};
const canonical=new Map();
const preferExistingId=(lang,native,id)=>{
 const key=lang+'|'+native;
 if(!canonical.has(key))canonical.set(key,id);
};
// Foundation lesson IDs take precedence: those IDs may already be in saved progress.
for(const lang of ['ja','zh'])for(const lesson of starter[lang])for(const word of lesson.words)
 preferExistingId(lang,word.native,word.id);
// Keep the original Japanese word-card identities even after importing OpenJLPT.
// A written form can appear in both sources; the progress bridge must remain stable.
for(const row of STARTER_WORDS)
 preferExistingId('ja',row.japanese,`ja-existing:${row.group}:${row.japanese}`);
// Several community entries can use the same spelling (including homographs).
// The word-level progress bridge stores one canonical ID for that spelling.
for(const word of jlptDataset.words)
 preferExistingId('ja',word.native,word.id);
const canonicalId=(lang,native,fallback)=>canonical.get(lang+'|'+native)||fallback;
const augmented={ja:[],zh:[]};
const group=(items,count)=>{const batches=[];for(let i=0;i<items.length;i+=count)batches.push(items.slice(i,i+count));return batches};
function makeLesson(lang,track,level,index,words,kind='vocabulary'){
 const first=words.find(w=>w.example&&w.example!==w.native)||words[0];
 const sourceSentence=Boolean(first?.example && first.example!==first.native);
 return {id:`${lang}-${track}-${level}-${String(index+1).padStart(3,'0')}`,language:lang,track,level,order:index+1,unit:lang==='zh'?`${track==='new'?'HSK 3.0':'HSK 2.0'} · Level ${level}`:level==='foundation'?'Kana foundations':`${level} · Curated word study`,title:kind==='kana'?`${level} · Characters ${index*10+1}–${index*10+words.length}`:`${level==='foundation'?'Kana':level} · Study set ${index+1}`,subtitle:`${words.length} ${kind==='kana'?'symbols':'words'} · ${sourceSentence?'source-backed reading example':'recognition, listening and recall'}`,time:Math.max(6,Math.ceil(words.length*1.3)),emoji:'◈',words,
 reading:{native:first.example||first.native,roman:first.exampleRoman||first.roman||'',translation:first.exampleMeaning||first.meaning,isSentence:sourceSentence,source:first.source||'Yukoto'},quiz:0,generated:true};
}
for(const track of ['new','old'])for(let level=1;level<=6;level++){
 const words=hskDataset.entries.filter(row=>row[4].includes(`${track}-${level}`)).map(row=>{
  const [id,native,roman,meaning,levels,examples]=row;
  const example=examples.find(e=>e[3]===`${track}-${level}`)||examples[0];
  return {id:canonicalId('zh',native,id),native,roman,meaning,example:example?.[0]||native,exampleRoman:example?.[1]||'',exampleMeaning:example?.[2]||meaning,levels,source:example?'Gushi source sentence':'HSK vocabulary syllabus'};
 });
 group(words,10).forEach((batch,i)=>augmented.zh.push(makeLesson('zh',track,String(level),i,batch)));
}
const japaneseWords=jlptDataset.words.map(w=>({id:canonicalId('ja',w.native,w.id),native:w.native,roman:w.roman||w.reading||'',meaning:w.meaning,example:w.example||w.native,exampleMeaning:w.exampleMeaning||w.meaning,reading:w.reading,source:w.source,level:w.level}));
const jpGroups=['Foundation','N5','N4','N3','N2','N1'];
for(const level of jpGroups){const words=[...new Map(japaneseWords.filter(w=>w.level===level).map(w=>[w.id,w])).values()];group(words,10).forEach((batch,i)=>augmented.ja.push(makeLesson('ja','jlpt',level,i,batch)))}
for(const [type,list] of [['hiragana',HIRAGANA],['katakana',KATAKANA]]){
 const words=list.map(row=>({id:`ja-kana:${type}:${row.char}`,native:row.char,roman:row.romaji,meaning:`${type==='hiragana'?'Hiragana':'Katakana'} syllable ${row.romaji}`,example:row.example,exampleMeaning:row.meaning,source:'Original Yukoto kana chart'}));
 group(words,10).forEach((batch,i)=>augmented.ja.push(makeLesson('ja',type,'foundation',i,batch,'kana')));
}
export const lessons={ja:[...starter.ja,...augmented.ja],zh:[...starter.zh,...augmented.zh]};
const lessonMap=new Map([...lessons.ja,...lessons.zh].map(l=>[l.id,l]));
const wordCatalog={};
for(const lang of ['ja','zh']){
 const catalog=new Map();
 for(const lesson of lessons[lang])for(const word of lesson.words){
  if(!catalog.has(word.id))catalog.set(word.id,{...word,lessonId:lesson.id,lessonTitle:lesson.title});
 }
 if(lang==='ja')for(const row of STARTER_WORDS){const id=canonicalId('ja',row.japanese,`ja-existing:${row.group}:${row.japanese}`);if(!catalog.has(id))catalog.set(id,{id,native:row.japanese,roman:row.romaji||'',meaning:row.meaning,example:row.japanese,exampleMeaning:row.meaning,lessonId:'ja-existing',lessonTitle:`Original Yukoto · ${row.group}`});}
 wordCatalog[lang]=[...catalog.values()];
}
export const getLessons=lang=>lessons[lang]||lessons.ja;
export const allWords=lang=>wordCatalog[lang]||wordCatalog.ja;
export const findLesson=id=>lessonMap.get(id);
export const getCatalogInfo=lang=>lang==='zh'?{mode:'source-verified HSK vocabulary assignments',count:allWords('zh').length,levels:['foundation','new-1','new-2','new-3','new-4','new-5','new-6','old-1','old-2','old-3','old-4','old-5','old-6'],metadata:hskDataset.metadata}:{mode:jlptDataset.metadata.coverage,count:allWords('ja').length,levels:jpGroups,metadata:jlptDataset.metadata};
