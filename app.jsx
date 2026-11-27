import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { cards as builtInCards } from './cards.js';
import { nodejsCards } from './nodejs-cards.js';
import { pythonCards } from './python-cards.js';
import { mobileCards, mobileTopic } from './mobile-cards.js';
import { exercises } from './exercises.js';
import { Answer, isYonote } from './Answer.jsx';
import './style.css';

const sections = {
  study: 'Карточки',
  review: 'Повторение',
  mock: 'Собеседование',
  code: 'Что выведет код?',
  reference: 'Справочник'
};
const areas = {
  frontend: 'Фронтенд',
  backend: 'Бэкенд',
  mobile: 'Мобильная разработка'
};
const emptyTheory = { topics: [], cards: [] };
const builtInCardsByArea = {
  frontend: builtInCards,
  backend: [...nodejsCards, ...pythonCards],
  mobile: mobileCards
};
const builtInTopics = {
  frontend: [...new Set(builtInCards.map(card => card[1]))],
  backend: ['Node.js', 'Python'],
  mobile: [mobileTopic]
};
const theoryKey = 'js-theory-custom-content';
const storageKey = 'js-theory-progress';

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(storageKey)) || {}; }
  catch { return {}; }
}

function TopicSelect({ topics, value, onChange, disabled }) {
  return <label>Тема
    <select value={value} onChange={event => onChange(event.target.value)} disabled={disabled}>
      <option value="">Все темы</option>
      {topics.map(topic => <option key={topic}>{topic}</option>)}
    </select>
  </label>;
}

function Navigation({ mode, onNavigate, hasCode }) {
  const menu = useRef(null);
  const trigger = useRef(null);

  return <details ref={menu} className="section-menu" onKeyDown={event => {
    if (event.key === 'Escape' && menu.current.open) {
      event.preventDefault();
      menu.current.open = false;
      trigger.current.focus();
    }
  }}>
    <summary ref={trigger}>Меню <span>· {sections[mode]}</span></summary>
    <nav aria-label="Разделы">
      {Object.entries(sections).filter(([id]) => id !== 'code' || hasCode).map(([id, name]) => <button key={id}
        aria-current={mode === id ? 'page' : undefined}
        onClick={() => {
          menu.current.open = false;
          trigger.current.focus();
          onNavigate(id);
        }}>{name}</button>)}
    </nav>
  </details>;
}

function makeQueue(mode, topic, records, cards) {
  if (mode === 'code') return exercises;
  const now = Date.now();
  const queue = cards.filter(([id, category]) => (!topic || category === topic)
    && (mode !== 'review' || records[id]?.due <= now));
  if (mode !== 'mock') return queue;
  for (let index = queue.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [queue[index], queue[other]] = [queue[other], queue[index]];
  }
  return queue.slice(0, 5);
}

function Coverage({ cards, topics, records, onNavigate, hasCode }) {
  const groups = topics.map(topic => [topic, cards.filter(card => card[1] === topic)]);
  if (hasCode) groups.push(['Задания с кодом', exercises]);
  if (!groups.length) return null;
  return <details open>
    <summary>Карта прогресса</summary>
    <div id="coverage">{groups.map(([name, items]) => {
      const done = items.filter(([id]) => records[id]).length;
      const label = `${name} · ${done} из ${items.length}`;
      return <div key={items === exercises ? 'code' : `topic-${name}`}>
        <button onClick={() => items === exercises ? onNavigate('code') : onNavigate('study', name)}>{label}</button>
        <progress aria-label={label} max={items.length || 1} value={done} />
      </div>;
    })}</div>
  </details>;
}

function Training({ cards, topics, hasCode, session, records, canSave, onNavigate, onSave }) {
  const { mode, topic, queue } = session;
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const heading = useRef(null);
  const firstRating = useRef(null);
  const card = queue[index];
  const code = mode === 'code';
  const items = code ? exercises : cards;
  const done = items.filter(([id]) => records[id]).length;

  useEffect(() => { if (index > 0) heading.current.focus(); }, [index]);
  useEffect(() => { if (revealed) firstRating.current?.focus(); }, [revealed]);

  function next() {
    setRevealed(false);
    setIndex(index + 1);
  }

  function rate(minutes) {
    onSave(card[0], code ? { solved: true } : { due: Date.now() + minutes * 60000 });
    next();
  }

  return <>
    <Coverage hasCode={hasCode} cards={cards} topics={topics} records={records} onNavigate={onNavigate} />
    <TopicSelect topics={topics} value={topic} onChange={value => onNavigate(mode, value)} disabled={code} />
    <p id="progress" role="status">
      {card ? `${code ? 'Задание' : 'Вопрос'} ${index + 1} из ${queue.length}` : 'Раунд завершён'}
      {' · '}{code ? 'Решено' : 'Отмечено карточек'}: {done} из {items.length}
      {!canSave && ' · Прогресс доступен до закрытия страницы'}
    </p>
    <section id="card" aria-labelledby="question">
      {card && <small>{card[1]}{card[4]?.level && ` · ${card[4].level}`}{isYonote(card) && ' · Yonote'}</small>}
      <h2 id="question" ref={heading} tabIndex={-1}>{card?.[2] ??
        (!queue.length ? (mode === 'review' ? 'Пока нет карточек к повторению' : 'В этой теме пока нет вопросов') : 'Все вопросы раунда пройдены')}</h2>
      {card && <>
        {code && <pre><code>{card[4]}</code></pre>}
        {(mode === 'mock' || code) && <label key={card[0]}>Твой ответ
          <textarea rows={4} placeholder={code ? 'Запиши предполагаемый вывод' : 'Сформулируй ответ своими словами'} />
        </label>}
        {revealed ? <>
          <div id="answer"><Answer card={card} /></div>
          {code ? <div id="code-rating">
            <button ref={firstRating} onClick={() => rate(0)}>Решено верно</button>
            <button onClick={next}>Продолжить без отметки</button>
          </div> : <div id="rating">
            <button ref={firstRating} onClick={() => rate(10)}>Сложно · через 10 мин</button>
            <button onClick={() => rate(1440)}>Почти · завтра</button>
            <button onClick={() => rate(5760)}>Знаю · через 4 дня</button>
          </div>}
        </> : <button id="reveal" onClick={() => setRevealed(true)}>{code ? 'Показать вывод и разбор' : 'Показать ответ'}</button>}
      </>}
    </section>
    <footer>{card ? <button onClick={next}>Пропустить →</button>
      : <button onClick={() => onNavigate(mode)}>Начать заново</button>}</footer>
  </>;
}

function ReferenceQuestion({ card }) {
  const [opened, setOpened] = useState(false);
  return <details onToggle={event => { if (event.currentTarget.open) setOpened(true); }}>
    <summary>{card[2]}{isYonote(card) && <small> · Yonote</small>}</summary>
    {opened && <div className="reference-answer"><Answer card={card} /></div>}
  </details>;
}

function Reference({ cards, topics, filters, setFilters, editor }) {
  const { query, topic, reading } = filters;
  const [selected, setSelected] = useState(null);
  const title = useRef(null);
  const list = useRef(null);
  const returnFocus = useRef(null);
  const search = query.trim().toLocaleLowerCase('ru');
  const results = cards.filter(([, category, question, answer]) =>
    (!topic || category === topic) && (!search || `${question} ${answer}`.toLocaleLowerCase('ru').includes(search)));
  const groups = topics.map(name => [name, results.filter(card => card[1] === name)]);
  const visibleGroups = groups.filter(([name, items]) =>
    items.length || (!search && (!topic || topic === name)));
  const ordered = groups.flatMap(([, items]) => items);
  const index = ordered.findIndex(([id]) => id === selected);
  const card = reading ? ordered[index] : undefined;

  useEffect(() => {
    if (card) {
      title.current.focus();
      title.current.scrollIntoView({ block: 'start' });
    } else if (returnFocus.current) {
      list.current.querySelector(`[data-question="${returnFocus.current}"]`)?.focus();
      returnFocus.current = null;
    }
  }, [card]);

  function update(patch) {
    setSelected(null);
    setFilters({ ...filters, ...patch });
  }

  return <section id="reference" aria-labelledby="reference-title">
    <h2 id="reference-title">Все вопросы и ответы</h2>
    {editor}
    <div className="reference-filters">
      <label>Поиск по вопросам и ответам
        <input type="search" placeholder="Например, замыкание" value={query} onChange={event => update({ query: event.target.value })} />
      </label>
      <TopicSelect topics={topics} value={topic} onChange={value => update({ topic: value })} />
    </div>
    <label className="reference-view">
      <input type="checkbox" checked={reading} onChange={event => update({ reading: event.target.checked })} /> Режим чтения
    </label>
    <p role="status">{visibleGroups.length ? `Вопросов: ${results.length} из ${cards.length}` : (topics.length ? 'По этому запросу ничего не найдено' : 'В этой области пока нет тем. Добавь тему и вопрос выше.')}</p>
    {card ? <article aria-labelledby="reader-title">
      <button onClick={() => { returnFocus.current = selected; setSelected(null); }}>← К списку вопросов</button>
      <p id="reader-position">{card[1]}{card[4]?.level && ` · ${card[4].level}`}{isYonote(card) && ' · Yonote'} · Вопрос {index + 1} из {ordered.length}</p>
      <h3 id="reader-title" ref={title} tabIndex={-1}>{card[2]}</h3>
      <div className="reference-answer"><Answer card={card} /></div>
      <div className="reader-navigation">
        <button disabled={index === 0} onClick={() => setSelected(ordered[index - 1][0])}>← Предыдущий вопрос</button>
        <button disabled={index === ordered.length - 1} onClick={() => setSelected(ordered[index + 1][0])}>Следующий вопрос →</button>
      </div>
    </article> : <div ref={list}>
      {visibleGroups.map(([name, items]) => <div className="reference-group" key={name}>
        <h3>{name} · {items.length}</h3>
        {!items.length && <p>В этой теме пока нет вопросов.</p>}
        {(items.some(item => item[4]?.level) ? ['Junior', 'Middle', null] : [null]).map(level => {
          const matches = items.filter(item => (item[4]?.level ?? null) === level);
          if (!matches.length) return null;
          return <React.Fragment key={level ?? 'ungraded'}>
            {level && <h4>{level} · {matches.length}</h4>}
            {matches.map(item => reading
              ? <button className="reference-question" data-question={item[0]} key={item[0]} onClick={() => setSelected(item[0])}>
                  {item[2]}{isYonote(item) && <small> · Yonote</small>}
                </button>
              : <ReferenceQuestion key={item[0]} card={item} />)}
          </React.Fragment>;
        })}
      </div>)}
    </div>}
  </section>;
}

function loadTheory() {
  try {
    const saved = JSON.parse(localStorage.getItem(theoryKey));
    if (Array.isArray(saved?.topics) && Array.isArray(saved?.cards)) return { frontend: saved };
    return Object.fromEntries(Object.keys(areas).flatMap(area => {
      const content = saved?.[area];
      return Array.isArray(content?.topics) && Array.isArray(content?.cards) ? [[area, content]] : [];
    }));
  } catch {}
  return {};
}

function TheoryEditor({ topics, saveTopic, saveCard }) {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');

  return <details className="theory-editor">
    <summary>Добавить тему или теорию</summary>
    <form onSubmit={event => {
      event.preventDefault();
      const title = name.trim();
      if (!title) return setMessage('Введи название темы.');
      if (topics.some(item => item.toLocaleLowerCase('ru') === title.toLocaleLowerCase('ru'))) {
        return setMessage('Тема с таким названием уже есть.');
      }
      if (!saveTopic(title)) return setMessage('Не удалось сохранить тему в браузере.');
      setName('');
      setTopic(title);
      setMessage('Тема сохранена. Теперь можно добавить в неё вопрос.');
    }}>
      <label>Название новой темы<input required value={name} onChange={event => setName(event.target.value)} /></label>
      <button>Создать тему</button>
    </form>
    <form onSubmit={event => {
      event.preventDefault();
      if (!topic || !question.trim() || !answer.trim()) return setMessage('Выбери тему и заполни вопрос и ответ.');
      if (!saveCard(topic, question.trim(), answer.trim())) return setMessage('Не удалось сохранить вопрос в браузере.');
      setQuestion('');
      setAnswer('');
      setMessage('Вопрос и ответ сохранены.');
    }}>
      <label>Тема вопроса<select required value={topic} onChange={event => setTopic(event.target.value)}>
        <option value="">Выбери тему</option>
        {topics.map(item => <option key={item}>{item}</option>)}
      </select></label>
      <label>Вопрос<input required value={question} onChange={event => setQuestion(event.target.value)} /></label>
      <label>Ответ<textarea required rows={6} value={answer} onChange={event => setAnswer(event.target.value)} /></label>
      <button>Добавить вопрос</button>
    </form>
    {message && <p role="status">{message}</p>}
  </details>;
}

function App() {
  const [theory, setTheory] = useState(loadTheory);
  const [area, setArea] = useState('frontend');
  const content = theory[area] ?? emptyTheory;
  const hasCode = area === 'frontend';
  const cards = [...(builtInCardsByArea[area] ?? []), ...content.cards];
  const topics = [...new Set([...(builtInTopics[area] ?? []), ...content.topics])];

  function saveTheory(updated) {
    const next = { ...theory, [area]: updated };
    try { localStorage.setItem(theoryKey, JSON.stringify(next)); }
    catch { return false; }
    setTheory(next);
    return true;
  }

  const editor = <TheoryEditor topics={topics}
    saveTopic={topic => saveTheory({ ...content, topics: [...content.topics, topic] })}
    saveCard={(topic, question, answer) => saveTheory({
      ...content, cards: [...content.cards, [`custom-${crypto.randomUUID()}`, topic, question, answer]]
    })} />;
  const [records, setRecords] = useState(loadProgress);
  const [canSave, setCanSave] = useState(true);
  const [session, setSession] = useState(() => ({ mode: 'study', topic: '', queue: cards, round: 0 }));
  const [filters, setFilters] = useState({ query: '', topic: '', reading: false });

  function navigate(mode, topic = session.topic) {
    const queue = mode === 'reference' ? [] : makeQueue(mode, topic, records, cards);
    setSession(previous => ({ mode, topic, queue, round: previous.round + 1 }));
  }

  function changeArea(nextArea) {
    const mode = session.mode === 'code' ? 'study' : session.mode;
    const customCards = theory[nextArea]?.cards ?? emptyTheory.cards;
    const nextCards = [...(builtInCardsByArea[nextArea] ?? []), ...customCards];
    setArea(nextArea);
    setFilters(previous => ({ ...previous, query: '', topic: '' }));
    setSession(previous => ({
      mode,
      topic: '',
      queue: mode === 'reference' ? [] : makeQueue(mode, '', records, nextCards),
      round: previous.round + 1
    }));
  }

  function save(id, record) {
    const updated = { ...records, [id]: record };
    setRecords(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); setCanSave(true); }
    catch { setCanSave(false); }
  }

  return <main>
    <header>
      <strong>JS<span> THEORY</span></strong>
      <a href="https://motley-plum-94a.notion.site/60e6905d16a54524974e461319f7ec6f">Конспект в Notion ↗</a>
    </header>
    <div className="navigation-bar">
      <Navigation hasCode={hasCode} mode={session.mode} onNavigate={navigate} />
      <label className="area-select">
        <select value={area} onChange={event => changeArea(event.target.value)}>
          {Object.entries(areas).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </label>
    </div>
    {session.mode === 'reference' ? <Reference key={area} cards={cards} topics={topics} editor={editor} filters={filters} setFilters={setFilters} />
      : <Training hasCode={hasCode} cards={cards} topics={topics} key={session.round} session={session} records={records} canSave={canSave} onNavigate={navigate} onSave={save} />}
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
