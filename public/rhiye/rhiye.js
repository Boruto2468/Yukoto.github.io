import { DAILY_CARD_COUNT, GROUP_SIZE, generateQuizCards, localDateKey, selectDailyCards, shuffleFeed } from './selection.js';
const text = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const storageKey = (language, name) => `yukoto-rhiye-${language}-${name}`;

function readStorage(language, name, fallback) {
  try {
    const value = localStorage.getItem(storageKey(language, name));
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    console.error(`Rhiye could not read ${name} from local storage:`, error);
    return fallback;
  }
}

function writeStorage(language, name, value) {
  try {
    localStorage.setItem(storageKey(language, name), JSON.stringify(value));
  } catch (error) {
    console.error(`Rhiye could not save ${name} to local storage:`, error);
  }
}

function cardTitle(card) {
  if (card.group === 'learn') return card.kind === 'character' ? 'Learn · Character' : card.kind === 'idiom' ? 'Learn · Idiom' : 'Learn · Phrase';
  if (card.group === 'listen') return 'Listen';
  if (card.group === 'watch') return 'Watch';
  return 'Quiz';
}

function cardMeaning(card) {
  if (card.kind === 'idiom' && card.literalMeaning) {
    return `<p class="rhiye-literal"><span>Literally</span>${text(card.literalMeaning)}</p><p><span>In use</span>${text(card.meaning)}</p>`;
  }
  return `<p>${text(card.meaning)}</p>`;
}

function renderLearn(card, saved) {
  return `<div class="rhiye-learning-card">
    <p class="rhiye-card-kicker">${text(cardTitle(card))}</p>
    <p class="rhiye-reading" lang="${card.language}">${text(card.reading)}</p>
    <h2 class="rhiye-large-text" lang="${card.language}">${text(card.text)}</h2>
    <div class="rhiye-meaning">${cardMeaning(card)}</div>
    ${card.components ? `<p class="rhiye-detail"><span>${card.language === 'zh' ? 'Built from' : 'Shape'}</span>${text(card.components)}</p>` : ''}
    ${card.kind === 'idiom' && card.whenToUse ? `<p class="rhiye-detail"><span>When people say it</span>${text(card.whenToUse)}</p>` : ''}
    ${card.kind === 'phrase' && card.whenToUse ? `<p class="rhiye-detail"><span>When to use it</span>${text(card.whenToUse)}</p>` : ''}
    ${card.example ? `<p class="rhiye-example"><span>Everyday example</span><strong lang="${card.language}">${text(card.example.split(' — ')[0])}</strong><small>${text(card.example.includes(' — ') ? card.example.split(' — ').slice(1).join(' — ') : '')}</small></p>` : ''}
    <div class="rhiye-actions">
      <button class="rhiye-button rhiye-button--quiet" type="button" data-action="play-card" data-id="${text(card.id)}" aria-label="Play ${text(card.text)}">Hear it</button>
      <button class="rhiye-button" type="button" data-action="save-card" data-id="${text(card.id)}" aria-pressed="${saved}">${saved ? 'Saved' : 'Save'}</button>
    </div>
  </div>`;
}

function renderQuiz(card, index, saved) {
  const prompt = card.mode === 'listen'
    ? `<button class="rhiye-play" type="button" data-action="play-target" data-index="${index}" aria-label="Play the question audio"><span aria-hidden="true">▶</span><span>Listen</span></button>`
    : '';
  return `<div class="rhiye-quiz-card">
    <p class="rhiye-card-kicker">Quiz</p>
    ${prompt}
    <h2>${text(card.question)}</h2>
    <div class="rhiye-options" role="group" aria-label="Answer choices">
      ${card.options.map(option => `<button class="rhiye-option" type="button" data-action="answer" data-index="${index}" data-value="${text(option)}">${text(option)}</button>`).join('')}
    </div>
    <p class="rhiye-feedback" data-feedback="${index}" role="status" aria-live="polite"></p>
    <p class="rhiye-correct-answer" data-correct="${index}" hidden>Answer: <strong>${text(card.answer)}</strong>${card.mode === 'reading' ? ` · ${text(card.target.meaning)}` : card.target.reading ? ` · ${text(card.target.reading)}` : ''}</p>
    <div class="rhiye-actions">
      <button class="rhiye-button rhiye-button--quiet" type="button" data-action="play-target" data-index="${index}" aria-label="Replay the answer audio">Replay</button>
      <button class="rhiye-button" type="button" data-action="save-card" data-id="${text(card.target.id)}" aria-pressed="${saved}">${saved ? 'Saved' : 'Save'}</button>
    </div>
  </div>`;
}

function renderListen(card, index, saved) {
  return `<div class="rhiye-listen-card">
    <button class="rhiye-play rhiye-play--large" type="button" data-action="play-card" data-id="${text(card.id)}" aria-label="Play audio card">${text('▶')}</button>
    <details class="rhiye-reveal"><summary>Show words</summary>
      <p class="rhiye-large-text" lang="${card.language}">${text(card.text)}</p>
      <p class="rhiye-reading" lang="${card.language}">${text(card.reading)}</p>
      <p class="rhiye-meaning">${text(card.meaning)}</p>
    </details>
    <div class="rhiye-actions rhiye-listen-actions">
      <button class="rhiye-button rhiye-button--quiet" type="button" data-action="play-slow" data-id="${text(card.id)}">Slow replay</button>
      <button class="rhiye-button" type="button" data-action="listen-answer" data-id="${text(card.id)}" data-answer="got">Got it</button>
      <button class="rhiye-button rhiye-button--quiet" type="button" data-action="listen-answer" data-id="${text(card.id)}" data-answer="again">Not yet</button>
    </div>
    <p class="rhiye-feedback" data-listen-feedback="${text(card.id)}" role="status" aria-live="polite"></p>
  </div>`;
}

function renderWatch(card, index, saved) {
  const videoId = /^[\w-]{11}$/.test(card.videoId || '') ? card.videoId : '';
  const start = Math.max(0, Number(card.startSeconds) || 0);
  const end = Math.max(start + 1, Number(card.endSeconds) || start + 25);
  const embed = videoId && card.embedVerified === true
    ? `<div class="rhiye-video-wrap"><iframe title="${text(card.text)}" src="https://www.youtube-nocookie.com/embed/${text(videoId)}?controls=1&playsinline=1&rel=0" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><a class="rhiye-watch-link" href="https://www.youtube.com/shorts/${text(videoId)}" target="_blank" rel="noopener noreferrer">If playback is unavailable, watch on YouTube</a>`
    : videoId
      ? `<p class="rhiye-placeholder" role="note">Link supplied; embed is not enabled.</p><a class="rhiye-watch-link" href="https://www.youtube.com/shorts/${text(videoId)}" target="_blank" rel="noopener noreferrer">Watch on YouTube</a>`
      : `<p class="rhiye-placeholder" role="note">Video placeholder — add a verified YouTube ID and segment.</p>`;
  return `<div class="rhiye-watch-card">
    <p class="rhiye-card-kicker">Watch · ${text(card.kind === 'life-video' ? 'Daily life' : 'Series or film')}</p>
    <h2>${text(card.text)}</h2>
    ${embed}
    <p class="rhiye-detail"><span>Listen for</span><strong lang="${card.language}">${text(card.listenFor?.text)}</strong> · ${text(card.listenFor?.reading)} · ${text(card.listenFor?.meaning)}</p>
    <p class="rhiye-detail rhiye-video-times">${card.embedVerified === true ? 'Full Short' : `Proposed segment ${start}s–${end}s`}</p>
    <div class="rhiye-actions">
      <button class="rhiye-button rhiye-button--quiet" type="button" data-action="replay-video" data-index="${index}">${card.embedVerified === true ? 'Replay Short' : 'Replay segment'}</button>
      <button class="rhiye-button" type="button" data-action="save-card" data-id="${text(card.id)}" aria-pressed="${saved}">${saved ? 'Saved' : 'Save'}</button>
    </div>
  </div>`;
}

function renderSaved(savedCards) {
  if (!savedCards.length) return '<p class="rhiye-empty">No saved cards yet.</p>';
  return `<div class="rhiye-saved-list">${savedCards.map(card => `<article class="rhiye-saved-item">
    <div><strong lang="${card.language}">${text(card.text)}</strong><p>${text(card.reading)} · ${text(card.meaning)}</p></div>
    <button class="rhiye-button rhiye-button--quiet" type="button" data-action="play-card" data-id="${text(card.id)}" aria-label="Play ${text(card.text)}">Play</button>
    <button class="rhiye-remove" type="button" data-action="remove-saved" data-id="${text(card.id)}" aria-label="Remove ${text(card.text)} from saved cards">Remove</button>
  </article>`).join('')}</div>`;
}

function addStylesheet() {
  if (document.querySelector('link[data-rhiye-styles]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./rhiye.css', import.meta.url).href;
  link.dataset.rhiyeStyles = '';
  document.head.append(link);
}

export function openRhiye(language, trigger) {
  if (language !== 'zh' && language !== 'ja') throw new Error(`Unsupported Rhiye language: ${language}`);
  addStylesheet();
  const savedScroll = window.scrollY;
  const previousBodyStyles = {
    overflow: document.body.style.overflow
  };
  const previousRootOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  const root = document.createElement('div');
  root.className = 'rhiye-root';
  root.setAttribute('data-theme', document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  root.innerHTML = `<section class="rhiye-overlay" role="dialog" aria-modal="true" aria-labelledby="rhiye-title">
    <header class="rhiye-header">
      <div class="rhiye-brand"><h1 id="rhiye-title">Rhiye</h1><span>Rhythm Swipe</span></div>
      <div class="rhiye-settings">
        <label><span class="rhiye-visually-hidden">Learning level</span><select data-action="level"></select></label>
        <label class="rhiye-harder"><input type="checkbox" data-action="harder"> Harder</label>
      </div>
      <button class="rhiye-close" type="button" data-action="close" aria-label="Close Rhiye"><span aria-hidden="true">×</span></button>
      <div class="rhiye-progress" aria-live="polite"></div>
    </header>
    <main class="rhiye-track" tabindex="0" aria-label="Rhiye daily cards"></main>
    <p class="rhiye-audio-status" data-audio-status role="status" aria-live="polite"></p>
  </section>`;
  document.body.append(root);

  const overlay = root.querySelector('.rhiye-overlay');
  const track = root.querySelector('.rhiye-track');
  const select = root.querySelector('[data-action="level"]');
  const harder = root.querySelector('[data-action="harder"]');
  const progress = root.querySelector('.rhiye-progress');
  let pool;
  let cards = [];
  let savedCards = readStorage(language, 'saved', []);
  let history = readStorage(language, 'seen', []);
  let wrongAnswers = readStorage(language, 'wrong', {});
  let activeIndex = 0;
  let reviewMode = false;
  let closed = false;
  let midnightTimer;

  function close() {
    if (closed) return;
    closed = true;
    window.removeEventListener('keydown', onKeyDown);
    window.speechSynthesis?.cancel();
    window.clearTimeout(midnightTimer);
    root.remove();
    Object.assign(document.body.style, previousBodyStyles);
    document.documentElement.style.overflow = previousRootOverflow;
    window.scrollTo({ top: savedScroll, behavior: 'instant' });
    trigger?.focus({ preventScroll: true });
  }

  function savedIds() {
    return new Set(savedCards.map(card => card.id));
  }

  function addSeen(card) {
    if (card.group === 'quiz') return;
    const dateSeen = localDateKey();
    if (history.some(entry => entry.card?.id === card.id && entry.dateSeen === dateSeen)) return;
    history = [...history, { card, dateSeen }];
    writeStorage(language, 'seen', history);
  }

  function completeSet() {
    const today = localDateKey();
    const last = readStorage(language, 'last-completed', '');
    let streak = Number(readStorage(language, 'streak', 0)) || 0;
    if (last !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      streak = last === localDateKey(yesterday) ? streak + 1 : 1;
      writeStorage(language, 'streak', streak);
      writeStorage(language, 'last-completed', today);
    }
  }

  function buildFeed(resetScroll = true) {
    if (!pool) return;
    const level = select.value;
    const includeHarder = harder.checked;
    writeStorage(language, 'level', level);
    writeStorage(language, 'harder', includeHarder);
    const dailyCards = selectDailyCards(pool, { language, level, includeHarder });
    if (dailyCards.length !== DAILY_CARD_COUNT - GROUP_SIZE) {
      throw new Error(`Rhiye expected 9 daily cards but received ${dailyCards.length}.`);
    }
    const rank = value => Number(String(value).replace(/\D/g, '')) || (language === 'zh' ? 1 : 5);
    const currentRank = rank(level);
    const levelHistory = includeHarder ? history : history.filter(entry => language === 'zh'
      ? rank(entry.card.level) <= currentRank
      : rank(entry.card.level) >= currentRank);
    const quizzes = generateQuizCards(levelHistory, dailyCards, wrongAnswers);
    if (quizzes.length !== GROUP_SIZE) throw new Error(`Rhiye expected 3 quiz cards but received ${quizzes.length}.`);
    cards = shuffleFeed([...dailyCards, ...quizzes], history.map(entry => entry.card?.id).filter(Boolean));
    reviewMode = false;
    activeIndex = 0;
    renderFeed();
    if (resetScroll) track.scrollTop = 0;
    addSeen(cards[0]);
  }

  function scheduleMidnightRefresh() {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    midnightTimer = window.setTimeout(() => {
      if (closed) return;
      history = readStorage(language, 'seen', []);
      buildFeed();
      scheduleMidnightRefresh();
    }, Math.max(1000, nextMidnight - Date.now() + 100));
  }

  function renderCard(card, index, saved) {
    if (card.group === 'learn') return renderLearn(card, saved);
    if (card.group === 'quiz') return renderQuiz(card, index, saved);
    if (card.group === 'listen') return renderListen(card, index, saved);
    return renderWatch(card, index, saved);
  }

  function renderFeed() {
    const retainedScroll = track.scrollTop;
    const count = cards.length;
    progress.textContent = reviewMode ? 'Saved cards' : activeIndex >= count ? 'Today’s set is done' : `${count - activeIndex} left`;
    root.querySelector('.rhiye-header').classList.toggle('rhiye-header--review', reviewMode);
    if (reviewMode) {
      track.innerHTML = `<section class="rhiye-screen rhiye-screen--review"><div class="rhiye-review-screen"><p class="rhiye-card-kicker">Review</p><h2>Saved cards</h2>${renderSaved(savedCards)}<button class="rhiye-button" type="button" data-action="review-back">Back to today</button></div></section>`;
      track.scrollTop = retainedScroll;
      return;
    }
    track.innerHTML = cards.map((card, index) => `<section class="rhiye-screen" data-card-index="${index}" aria-label="${text(cardTitle(card))}, card ${index + 1} of ${count}">
      <div class="rhiye-card">
        ${renderCard(card, index, savedIds().has(card.id) || savedIds().has(card.targetId))}
      </div>
    </section>`).join('') + `<section class="rhiye-screen rhiye-screen--done" aria-label="Today’s set is done">
      <div class="rhiye-done-card"><p class="rhiye-card-kicker">That’s today</p><h2>Today's set is done.</h2><p>Your streak: <strong data-streak>${Number(readStorage(language, 'streak', 0)) || 0}</strong> ${Number(readStorage(language, 'streak', 0)) === 1 ? 'day' : 'days'}</p><button class="rhiye-button" type="button" data-action="review-saved">Review saved cards (${savedCards.length})</button></div>
    </section>`;
    track.scrollTop = retainedScroll;
  }

  function speak(card, rate = 0.9) {
    const status = root.querySelector('[data-audio-status]');
    status.textContent = '';
    const playSpeech = () => {
      if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
        status.textContent = 'Audio is unavailable in this browser.';
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(card.text);
      utterance.lang = language === 'zh' ? 'zh-CN' : 'ja-JP';
      utterance.rate = rate;
      utterance.onerror = event => {
        status.textContent = `Audio could not be played: ${event.error || 'speech synthesis failed'}.`;
      };
      window.speechSynthesis.speak(utterance);
    };
    if (card.audioUrl) {
      const audio = new Audio(card.audioUrl);
      audio.playbackRate = rate;
      audio.onerror = () => {
        console.error(`Rhiye audio file could not be played: ${card.audioUrl}`);
        playSpeech();
      };
      audio.play().catch(error => {
        console.error('Rhiye audio playback failed:', error);
        playSpeech();
      });
    } else {
      playSpeech();
    }
  }

  function showAudioStatus(message) {
    root.querySelector('[data-audio-status]').textContent = message;
  }

  function selectCardById(id) {
    return cards.find(card => card.id === id) || savedCards.find(card => card.id === id)
      || history.find(entry => entry.card?.id === id)?.card;
  }

  function saveCard(card) {
    if (!card) return;
    if (savedCards.some(item => item.id === card.id)) {
      savedCards = savedCards.filter(item => item.id !== card.id);
    } else {
      savedCards = [...savedCards, card];
    }
    writeStorage(language, 'saved', savedCards);
    renderFeed();
  }

  function scrollToIndex(index) {
    const target = Math.max(0, Math.min(index, track.children.length - 1));
    track.children[target]?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }

  function onClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button || !root.contains(button)) return;
    const action = button.dataset.action;
    const index = Number(button.dataset.index);
    const card = cards[index];
    if (action === 'close') close();
    if (action === 'play-card') {
      const selected = selectCardById(button.dataset.id);
      if (selected) speak(selected);
    }
    if (action === 'play-slow') {
      const selected = selectCardById(button.dataset.id);
      if (selected) speak(selected, 0.65);
    }
    if (action === 'play-target' && card?.target) speak(card.target);
    if (action === 'save-card') saveCard(selectCardById(button.dataset.id));
    if (action === 'answer' && card?.group === 'quiz') {
      const correct = button.dataset.value === card.answer;
      const feedback = root.querySelector(`[data-feedback="${index}"]`);
      const answer = root.querySelector(`[data-correct="${index}"]`);
      root.querySelectorAll(`[data-action="answer"][data-index="${index}"]`).forEach(option => {
        option.disabled = true;
        if (option.dataset.value === card.answer) option.classList.add('rhiye-option--correct');
        else if (option === button && !correct) option.classList.add('rhiye-option--wrong');
      });
      feedback.textContent = correct ? 'That’s right.' : 'Not quite.';
      answer.hidden = false;
      if (!correct) {
        wrongAnswers[card.targetId] = (Number(wrongAnswers[card.targetId]) || 0) + 1;
        writeStorage(language, 'wrong', wrongAnswers);
      }
    }
    if (action === 'listen-answer') {
      const feedback = root.querySelector(`[data-listen-feedback="${CSS.escape(button.dataset.id)}"]`);
      feedback.textContent = button.dataset.answer === 'got' ? 'Marked as known.' : 'We’ll bring it back in a future quiz.';
      if (button.dataset.answer === 'again') {
        wrongAnswers[button.dataset.id] = (Number(wrongAnswers[button.dataset.id]) || 0) + 1;
        writeStorage(language, 'wrong', wrongAnswers);
      } else {
        wrongAnswers[button.dataset.id] = Math.max(0, (Number(wrongAnswers[button.dataset.id]) || 0) - 1);
        writeStorage(language, 'wrong', wrongAnswers);
      }
    }
    if (action === 'replay-video' && card?.group === 'watch') {
      const frame = root.querySelector(`[data-card-index="${index}"] iframe`);
      if (frame) frame.src = frame.src;
      else showAudioStatus(card?.videoId ? 'Verify the uploader and segment before enabling embedded playback.' : 'Add a verified video ID and segment to play this placeholder.');
    }
    if (action === 'review-saved') {
      reviewMode = true;
      renderFeed();
      track.scrollTop = 0;
    }
    if (action === 'review-back') buildFeed();
    if (action === 'remove-saved') {
      savedCards = savedCards.filter(item => item.id !== button.dataset.id);
      writeStorage(language, 'saved', savedCards);
      renderFeed();
    }
  }

  function updateActiveCard() {
    if (reviewMode) return;
    const index = Math.min(cards.length, Math.max(0, Math.round(track.scrollTop / track.clientHeight)));
    if (index === activeIndex) return;
    activeIndex = index;
    if (activeIndex < cards.length) addSeen(cards[activeIndex]);
    else {
      completeSet();
      const streak = Number(readStorage(language, 'streak', 0)) || 0;
      const streakValue = root.querySelector('[data-streak]');
      if (streakValue) streakValue.textContent = String(streak);
      const streakLabel = streak === 1 ? 'day' : 'days';
      const streakParagraph = streakValue?.parentElement;
      if (streakParagraph) streakParagraph.lastChild.textContent = ` ${streakLabel}`;
    }
    progress.textContent = activeIndex >= cards.length ? 'Today’s set is done' : `${cards.length - activeIndex} left`;
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'Tab') {
      const focusable = [...root.querySelectorAll('button:not(:disabled), select, input, summary, a[href]')]
        .filter(element => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (reviewMode || document.activeElement?.closest('button, a, summary, select, input, textarea, [contenteditable="true"]')) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === ' ') {
      event.preventDefault();
      scrollToIndex(activeIndex + 1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollToIndex(activeIndex - 1);
    }
  }

  function onChange(event) {
    if (event.target === select || event.target === harder) buildFeed();
  }

  root.addEventListener('click', onClick);
  root.addEventListener('change', onChange);
  track.addEventListener('scroll', () => requestAnimationFrame(updateActiveCard), { passive: true });
  window.addEventListener('keydown', onKeyDown);
  root.querySelector('[data-action="close"]').focus({ preventScroll: true });

  const savedLevel = readStorage(language, 'level', language === 'zh' ? 'HSK 1' : 'N5');
  const levels = language === 'zh' ? ['HSK 1', 'HSK 2', 'HSK 3'] : ['N5', 'N4'];
  select.innerHTML = levels.map(level => `<option value="${level}" ${savedLevel === level ? 'selected' : ''}>${level}</option>`).join('');
  harder.checked = readStorage(language, 'harder', false) === true;
  progress.textContent = 'Loading today’s set';
  track.innerHTML = '<section class="rhiye-screen"><p class="rhiye-loading" role="status">Loading today’s cards…</p></section>';
  fetch(new URL(`./data/${language}.json`, import.meta.url))
    .then(response => {
      if (!response.ok) throw new Error(`Could not load the ${language} Rhiye pool (HTTP ${response.status}).`);
      return response.json();
    })
    .then(data => {
      pool = data;
      history = Array.isArray(history) ? history.filter(entry => entry?.card?.id && entry.card.language === language) : [];
      savedCards = Array.isArray(savedCards) ? savedCards.filter(card => card?.id && card.language === language) : [];
      wrongAnswers = wrongAnswers && typeof wrongAnswers === 'object' ? wrongAnswers : {};
      buildFeed();
      scheduleMidnightRefresh();
    })
    .catch(error => {
      console.error('Rhiye could not load its card pool:', error);
      progress.textContent = 'Cards unavailable';
      track.innerHTML = `<section class="rhiye-screen"><div class="rhiye-error"><h2>Today’s cards could not load.</h2><p>${text(error.message)}</p><button class="rhiye-button" type="button" data-action="close">Close</button></div></section>`;
    });

  return close;
}
