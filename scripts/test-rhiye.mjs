import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { DAILY_CARD_COUNT, generateQuizCards, localDateKey, selectDailyCards, shuffleFeed } from '../public/rhiye/selection.js';

const character = id => ({ id, group: 'learn', kind: 'character', language: 'zh', text: id, level: 'HSK 1' });
const makePool = size => ({
  characters: Array.from({ length: size }, (_, index) => character(`char-${index}`)),
  idioms: Array.from({ length: size }, (_, index) => ({ ...character(`idiom-${index}`), kind: 'idiom' })),
  phrases: Array.from({ length: size }, (_, index) => ({ ...character(`phrase-${index}`), kind: 'phrase' })),
  listen: Array.from({ length: size }, (_, index) => ({ ...character(`audio-${index}`), group: 'listen', kind: 'audio' })),
  videos: Array.from({ length: size }, (_, index) => ({ ...character(`video-${index}`), group: 'watch', kind: 'life-video' }))
});

test('daily cards are stable by local date and include one of each learn kind', () => {
  const pool = makePool(20);
  const options = { date: '2026-10-21', language: 'zh', level: 'HSK 1' };
  const today = selectDailyCards(pool, options);
  assert.deepEqual(selectDailyCards(pool, options), today);
  assert.deepEqual(today.filter(card => card.group === 'learn').map(card => card.kind), ['character', 'idiom', 'phrase']);
  assert.equal(today.filter(card => card.group === 'listen').length, 3);
  assert.equal(today.filter(card => card.group === 'watch').length, 3);
});

test('daily pool rotation does not repeat until the pool has been used', () => {
  const pool = makePool(12);
  const seen = new Set();
  for (let day = 1; day <= 12; day += 1) {
    const card = selectDailyCards(pool, { date: `2026-11-${String(day).padStart(2, '0')}`, language: 'zh', level: 'HSK 1' })[0];
    assert.equal(seen.has(card.id), false);
    seen.add(card.id);
  }
  assert.equal(seen.size, 12);
});

test('watch cards rotate through the full pool before repeating', () => {
  const pool = makePool(12);
  pool.videos = pool.videos.map((card, index) => ({
    ...card,
    kind: index % 2 === 0 ? 'life-video' : 'screen-video'
  }));
  const seen = new Set();
  for (let day = 1; day <= 4; day += 1) {
    const date = `2026-11-${String(day).padStart(2, '0')}`;
    const watch = selectDailyCards(pool, { date, language: 'zh', level: 'HSK 1' })
      .filter(card => card.group === 'watch');
    assert.equal(watch.length, 3);
    assert.ok(watch.some(card => card.kind === 'life-video'));
    assert.ok(watch.some(card => card.kind === 'screen-video'));
    for (const card of watch) {
      assert.equal(seen.has(card.id), false);
      seen.add(card.id);
    }
  }
  assert.equal(seen.size, 12);
});

test('quiz targets can be old history cards and wrong answers increase target weight', () => {
  const oldCards = [character('old-a'), character('old-b'), character('old-c'), character('old-d')];
  const history = oldCards.map(card => ({ card, dateSeen: '2024-01-01' }));
  const randomValues = [0, 0, 0.99, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let randomIndex = 0;
  const quizzes = generateQuizCards(history, [], { 'old-a': 3 }, () => randomValues[randomIndex++] ?? 0);
  assert.equal(quizzes.length, 3);
  assert.ok(quizzes.every(quiz => oldCards.some(card => card.id === quiz.targetId)));
  assert.ok(quizzes.some(quiz => quiz.targetId === 'old-a'));
  assert.equal(new Set(quizzes.map(quiz => quiz.mode)).size, 3);

  const largerHistory = Array.from({ length: 10 }, (_, index) => ({
    card: character(`old-${index}`),
    dateSeen: '2017-01-01'
  }));
  const occurrences = Object.fromEntries(largerHistory.map(entry => [entry.card.id, 0]));
  let seed = 0x12345678;
  const repeatableRandom = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let run = 0; run < 500; run += 1) {
    for (const quiz of generateQuizCards(largerHistory, [], { 'old-0': 3 }, repeatableRandom)) {
      occurrences[quiz.targetId] += 1;
    }
  }
  const averageOther = Object.entries(occurrences).filter(([id]) => id !== 'old-0').reduce((sum, [, count]) => sum + count, 0) / 9;
  assert.ok(occurrences['old-0'] > averageOther * 1.5);
});

test('cold-start quizzes only target today cards and appear after their targets', () => {
  const today = Array.from({ length: 9 }, (_, index) => character(`today-${index}`));
  const quizzes = generateQuizCards([], today, {}, () => 0.23);
  assert.equal(quizzes.length, 3);
  assert.ok(quizzes.every(quiz => today.some(card => card.id === quiz.targetId)));
  const feed = shuffleFeed([...today, ...quizzes], [], () => Math.random());
  for (const quiz of quizzes) {
    assert.ok(feed.findIndex(card => card.id === quiz.targetId) < feed.findIndex(card => card.id === quiz.id));
  }
  assert.equal(feed.length, DAILY_CARD_COUNT);
});

test('feed shuffle changes ordering without adjacent groups when possible', () => {
  const cards = [
    ...Array.from({ length: 3 }, (_, index) => ({ ...character(`l-${index}`), group: 'learn' })),
    ...Array.from({ length: 3 }, (_, index) => ({ ...character(`q-${index}`), group: 'quiz', targetId: `l-${index}` })),
    ...Array.from({ length: 3 }, (_, index) => ({ ...character(`a-${index}`), group: 'listen' })),
    ...Array.from({ length: 3 }, (_, index) => ({ ...character(`w-${index}`), group: 'watch' }))
  ];
  const first = shuffleFeed(cards, ['l-0', 'l-1', 'l-2'], Math.random);
  const second = shuffleFeed(cards, ['l-0', 'l-1', 'l-2'], Math.random);
  assert.equal(first.length, DAILY_CARD_COUNT);
  assert.notDeepEqual(first.map(card => card.id), second.map(card => card.id));
  assert.ok(first.every((card, index) => index === 0 || first[index - 1].group !== card.group));
});

test('local date key uses the supplied browser-local calendar date', () => {
  assert.equal(localDateKey(new Date(2026, 0, 9, 23, 59)), '2026-01-09');
});

test('language pools include 36 full-length authorized Shorts without unused entries', async () => {
  for (const language of ['zh', 'ja']) {
    const pool = JSON.parse(await readFile(new URL(`../public/rhiye/data/${language}.json`, import.meta.url), 'utf8'));
    const learnAndListen = [...pool.characters, ...pool.idioms, ...pool.phrases, ...pool.listen];
    assert.ok(learnAndListen.length >= 75);
    assert.equal(pool.characters.length > 0, true);
    assert.equal(pool.idioms.length > 0, true);
    assert.equal(pool.phrases.length > 0, true);
    assert.equal(pool.listen.length > 0, true);
    assert.equal(pool.videos.length, 18);
    const linkedVideos = pool.videos.filter(card => card.videoId);
    assert.equal(linkedVideos.length, 18);
    assert.ok(linkedVideos.every(card => /^[\w-]{11}$/.test(card.videoId)
      && card.source.includes('authorized')
      && card.embedVerified === true
      && card.segmentVerified === true
      && card.startSeconds === 0
      && !Object.hasOwn(card, 'endSeconds')));
    assert.ok(pool.videos.every(card => card.listenFor?.text && card.listenFor.reading && card.listenFor.meaning));
    assert.ok(learnAndListen.every(card => card.id && card.language === language && card.text && card.reading && card.meaning));
    const level = language === 'zh' ? 'HSK 1' : 'N5';
    const daily = selectDailyCards(pool, { date: '2026-10-21', language, level });
    assert.equal(daily.length, 9);
    assert.equal(daily.filter(card => card.group === 'learn').length, 3);
    assert.equal(daily.filter(card => card.group === 'listen').length, 3);
    assert.equal(daily.filter(card => card.group === 'watch').length, 3);
    const watchSeen = new Set();
    const watchKinds = new Set();
    for (let day = 1; day <= 6; day += 1) {
      const date = `2026-10-${String(day).padStart(2, '0')}`;
      const watchCards = selectDailyCards(pool, { date, language, level })
        .filter(card => card.group === 'watch');
      assert.equal(watchCards.length, 3);
      for (const card of watchCards) {
        assert.equal(watchSeen.has(card.id), false);
        watchSeen.add(card.id);
        watchKinds.add(card.kind);
      }
    }
    assert.equal(watchSeen.size, 18);
    assert.ok(watchKinds.has('life-video'));
    assert.ok(watchKinds.has('screen-video'));
    assert.ok(daily.every(card => language === 'zh'
      ? Number(card.level.replace(/\D/g, '')) <= 1
      : Number(card.level.replace(/\D/g, '')) >= 5));
    const levels = language === 'zh' ? ['HSK 1', 'HSK 2', 'HSK 3'] : ['N5', 'N4'];
    for (const selectedLevel of levels) {
      const filteredDaily = selectDailyCards(pool, { date: '2026-10-21', language, level: selectedLevel });
      assert.equal(filteredDaily.length, 9);
      assert.ok(filteredDaily.every(card => language === 'zh'
        ? Number(card.level.replace(/\D/g, '')) <= Number(selectedLevel.replace(/\D/g, ''))
        : Number(card.level.replace(/\D/g, '')) >= Number(selectedLevel.replace(/\D/g, ''))));
    }
    const harderLevel = language === 'zh' ? 'HSK 1' : 'N5';
    const withHarder = selectDailyCards(pool, { date: '2026-10-21', language, level: harderLevel, includeHarder: true });
    assert.equal(withHarder.length, 9);
    assert.ok(withHarder.some(card => language === 'zh'
      ? Number(card.level.replace(/\D/g, '')) > 1
      : Number(card.level.replace(/\D/g, '')) < 5));
    const heard = new Set();
    const fullPoolLevel = language === 'zh' ? 'HSK 3' : 'N4';
    for (let day = 1; day <= 15; day += 1) {
      const date = `2026-11-${String(day).padStart(2, '0')}`;
      for (const card of selectDailyCards(pool, { date, language, level: fullPoolLevel }).filter(card => card.group === 'listen')) {
        assert.equal(heard.has(card.id), false);
        heard.add(card.id);
      }
    }
    assert.equal(heard.size, 45);
  }
});
