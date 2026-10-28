export const GROUP_SIZE = 3;
export const DAILY_CARD_COUNT = GROUP_SIZE * 4;

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateOrdinal(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function hashSeed(value) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(cards, seed) {
  const shuffled = [...cards];
  const random = seededRandom(seed);
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function levelCards(cards, language, level, includeHarder) {
  if (includeHarder) return cards;
  const rank = language === 'zh'
    ? value => Number(String(value).replace(/\D/g, '')) || 1
    : value => Number(String(value).replace(/\D/g, '')) || 5;
  const selectedRank = rank(level);
  return cards.filter(card => language === 'zh'
    ? rank(card.level) <= selectedRank
    : rank(card.level) >= selectedRank);
}

function chooseCycle(cards, dateKey, language, poolName, dailyCount, slot) {
  if (!cards.length) return [];
  const day = dateOrdinal(dateKey);
  const sequenceIndex = day * dailyCount + slot;
  const indexInCycle = sequenceIndex % cards.length;
  const order = seededShuffle(cards, hashSeed(`${language}:${poolName}`));
  return [order[indexInCycle]];
}

function chooseDailyVideos(cards, dateKey, language) {
  if (cards.length < GROUP_SIZE) return [];
  const date = dateOrdinal(dateKey);
  const cycleLength = Math.ceil(cards.length / GROUP_SIZE);
  const dayInCycle = date % cycleLength;
  const all = seededShuffle(cards, hashSeed(`${language}:videos`));
  const remaining = new Set(cards.map(card => card.id));
  const days = [];

  while (remaining.size) {
    const selected = [];
    const take = predicate => {
      const card = all.find(candidate => remaining.has(candidate.id) && predicate(candidate));
      if (!card) return false;
      selected.push(card);
      remaining.delete(card.id);
      return true;
    };
    take(card => card.kind === 'life-video');
    take(card => card.kind === 'screen-video');
    while (selected.length < GROUP_SIZE) {
      const hasLife = selected.some(card => card.kind === 'life-video');
      const hasScreen = selected.some(card => card.kind === 'screen-video');
      const category = !hasLife
        ? card => card.kind === 'life-video'
        : !hasScreen
          ? card => card.kind === 'screen-video'
          : () => true;
      if (!take(category) && !take(() => true)) {
        const fallback = all.find(card => !selected.some(item => item.id === card.id));
        if (!fallback) break;
        selected.push(fallback);
      }
    }
    days.push(selected);
  }
  return days[dayInCycle] || [];
}

export function selectDailyCards(pool, { date = new Date(), language, level, includeHarder = false }) {
  const dateKey = typeof date === 'string' ? date : localDateKey(date);
  const filtered = Object.fromEntries(
    Object.entries(pool)
      .filter(([, cards]) => Array.isArray(cards))
      .map(([key, cards]) => [key, levelCards(cards, language, level, includeHarder)])
  );
  const available = filtered;
  const videos = available.videos || [];
  const dailyVideos = chooseDailyVideos(videos, dateKey, language);
  return [
    ...chooseCycle(available.characters || [], dateKey, language, 'characters', 1, 0),
    ...chooseCycle(available.idioms || [], dateKey, language, 'idioms', 1, 0),
    ...chooseCycle(available.phrases || [], dateKey, language, 'phrases', 1, 0),
    ...Array.from({ length: GROUP_SIZE }, (_, slot) =>
      chooseCycle(available.listen || [], dateKey, language, 'listen', GROUP_SIZE, slot)[0]
    ),
    ...dailyVideos
  ].filter(Boolean);
}

function weightedTarget(cards, wrongAnswers, random) {
  const weights = cards.map(card => 1 + Math.min(3, Number(wrongAnswers[card.id]) || 0));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let pick = random() * total;
  for (let index = 0; index < cards.length; index += 1) {
    pick -= weights[index];
    if (pick < 0) return cards[index];
  }
  return cards[cards.length - 1];
}

export function generateQuizCards(history, dailyCards, wrongAnswers = {}, random = Math.random) {
  const uniqueHistory = [...new Map(history.map(entry => [entry.card.id, entry.card])).values()];
  const targets = [];
  if (uniqueHistory.length >= GROUP_SIZE) {
    const remaining = [...uniqueHistory];
    while (targets.length < GROUP_SIZE && remaining.length) {
      const target = weightedTarget(remaining, wrongAnswers, random);
      targets.push(target);
      remaining.splice(remaining.findIndex(card => card.id === target.id), 1);
    }
  } else {
    const candidates = [...new Map(dailyCards.map(card => [card.id, card])).values()];
    while (targets.length < GROUP_SIZE && candidates.length) {
      const target = candidates[Math.floor(random() * candidates.length)];
      if (!targets.some(card => card.id === target.id)) targets.push(target);
      candidates.splice(candidates.findIndex(card => card.id === target.id), 1);
    }
  }

  const modes = ['meaning', 'reading', 'character', 'listen'];
  for (let index = modes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [modes[index], modes[swapIndex]] = [modes[swapIndex], modes[index]];
  }
  return targets.map((target, index) => {
    const mode = modes[index];
    const answers = [...uniqueHistory, ...dailyCards].filter(card => card.id !== target.id);
    const answerFor = card => mode === 'meaning' ? card.meaning : mode === 'reading' ? card.reading : card.text;
    const distractors = seededShuffle(answers, hashSeed(`${target.id}:${index}`)).slice(0, 3);
    const options = [...new Set([target, ...distractors].map(answerFor))];
    for (let option = options.length - 1; option > 0; option -= 1) {
      const swap = Math.floor(random() * (option + 1));
      [options[option], options[swap]] = [options[swap], options[option]];
    }
    return {
      id: `quiz:${target.id}:${index}`,
      group: 'quiz',
      kind: 'quiz',
      language: target.language,
      level: target.level,
      targetId: target.id,
      target,
      mode,
      options,
      question: mode === 'meaning'
        ? `What does ${target.text} mean?`
        : mode === 'reading'
          ? `How do you read ${target.text}?`
          : mode === 'character'
            ? `Which card is “${target.meaning}”?`
            : `Listen, then choose the phrase that you hear.`,
      answer: answerFor(target)
    };
  });
}

export function shuffleFeed(cards, previouslySeenIds = [], random = Math.random) {
  const seen = new Set(previouslySeenIds);
  const ids = new Set();
  const uniqueCards = cards.filter(card => {
    if (!card || ids.has(card.id)) return false;
    ids.add(card.id);
    return true;
  });
  const shuffle = items => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  };
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const order = shuffle(uniqueCards);
    const positions = new Map(order.map((card, index) => [card.id, index]));
    const validQuizzes = order.every((card, index) => card.group !== 'quiz'
      || seen.has(card.targetId)
      || (positions.has(card.targetId) && positions.get(card.targetId) < index));
    if (validQuizzes && order.every((card, index) => index === 0 || order[index - 1].group !== card.group)) return order;
  }
  const nonQuiz = uniqueCards.filter(card => card.group !== 'quiz');
  const quizzes = uniqueCards.filter(card => card.group === 'quiz');
  return [...seededShuffle(nonQuiz, Math.floor(random() * 4294967296)), ...quizzes];
}
