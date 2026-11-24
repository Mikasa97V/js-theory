import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { cards } from './cards.js';
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
const topics = [...new Set(cards.map(card => card[1]))];
const storageKey = 'js-theory-progress';

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(storageKey)) || {}; }
  catch { return {}; }
}

function TopicSelect({ value, onChange, disabled }) {
  return <label>Тема
    <select value={value} onChange={event => onChange(event.target.value)} disabled={disabled}>
      <option value="">Все темы</option>
      {topics.map(topic => <option key={topic}>{topic}</option>)}
    </select>
  </label>;
}

function Navigation({ mode, onNavigate }) {
  const menu = useRef(null);
  const trigger = useRef(null);

  return <details ref={menu} className="section-menu" onKeyDown={event => {
    if (event.key === 'Escape' && menu.current.open) {
      event.preventDefault();
      menu.current.open = false;
      trigger.current.focus();
    }
  }}>
    <summary ref={trigger}>☰ Меню <span>· {sections[mode]}</span></summary>
    <nav aria-label="Разделы">
      {Object.entries(sections).map(([id, name]) => <button key={id}
        aria-current={mode === id ? 'page' : undefined}
        onClick={() => {
          menu.current.open = false;
          trigger.current.focus();
          onNavigate(id);
        }}>{name}</button>)}
    </nav>
  </details>;
}

function makeQueue(mode, topic, records) {
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

function Coverage({ records, onNavigate }) {
  const groups = topics.map(topic => [topic, cards.filter(card => card[1] === topic)]);
  return <details open>
    <summary>Карта прогресса</summary>
    <div id="coverage">{[...groups, ['Задания с кодом', exercises]].map(([name, items]) => {
      const done = items.filter(([id]) => records[id]).length;
      const label = `${name} · ${done} из ${items.length}`;
      return <div key={name}>
        <button onClick={() => items === exercises ? onNavigate('code') : onNavigate('study', name)}>{label}</button>
        <progress aria-label={label} max={items.length} value={done} />
      </div>;
    })}</div>
  </details>;
}

function Training({ session, records, canSave, onNavigate, onSave }) {
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
    <Coverage records={records} onNavigate={onNavigate} />
    <TopicSelect value={topic} onChange={value => onNavigate(mode, value)} disabled={code} />
    <p id="progress" role="status">
      {card ? `${code ? 'Задание' : 'Вопрос'} ${index + 1} из ${queue.length}` : 'Раунд завершён'}
      {' · '}{code ? 'Решено' : 'Отмечено карточек'}: {done} из {items.length}
      {!canSave && ' · Прогресс доступен до закрытия страницы'}
    </p>
    <section id="card" aria-labelledby="question">
      {card && <small>{card[1]}{isYonote(card) && ' · Yonote'}</small>}
      <h2 id="question" ref={heading} tabIndex={-1}>{card?.[2] ??
        (mode === 'review' && !queue.length ? 'Пока нет карточек к повторению' : 'Все вопросы раунда пройдены')}</h2>
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

function Reference({ filters, setFilters }) {
  const { query, topic, reading } = filters;
  const [selected, setSelected] = useState(null);
  const title = useRef(null);
  const list = useRef(null);
  const returnFocus = useRef(null);
  const search = query.trim().toLocaleLowerCase('ru');
  const results = cards.filter(([, category, question, answer]) =>
    (!topic || category === topic) && (!search || `${question} ${answer}`.toLocaleLowerCase('ru').includes(search)));
  const groups = topics.map(name => [name, results.filter(card => card[1] === name)]);
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
    <div className="reference-filters">
      <label>Поиск по вопросам и ответам
        <input type="search" placeholder="Например, замыкание" value={query} onChange={event => update({ query: event.target.value })} />
      </label>
      <TopicSelect value={topic} onChange={value => update({ topic: value })} />
    </div>
    <label className="reference-view">
      <input type="checkbox" checked={reading} onChange={event => update({ reading: event.target.checked })} /> Режим чтения
    </label>
    <p role="status">{results.length ? `Вопросов: ${results.length} из ${cards.length}` : 'По этому запросу ничего не найдено'}</p>
    {card ? <article aria-labelledby="reader-title">
      <button onClick={() => { returnFocus.current = selected; setSelected(null); }}>← К списку вопросов</button>
      <p id="reader-position">{card[1]}{isYonote(card) && ' · Yonote'} · Вопрос {index + 1} из {ordered.length}</p>
      <h3 id="reader-title" ref={title} tabIndex={-1}>{card[2]}</h3>
      <div className="reference-answer"><Answer card={card} /></div>
      <div className="reader-navigation">
        <button disabled={index === 0} onClick={() => setSelected(ordered[index - 1][0])}>← Предыдущий вопрос</button>
        <button disabled={index === ordered.length - 1} onClick={() => setSelected(ordered[index + 1][0])}>Следующий вопрос →</button>
      </div>
    </article> : <div ref={list}>
      {groups.filter(([, items]) => items.length).map(([name, items]) => <div className="reference-group" key={name}>
        <h3>{name} · {items.length}</h3>
        {items.map(item => reading
          ? <button className="reference-question" data-question={item[0]} key={item[0]} onClick={() => setSelected(item[0])}>
              {item[2]}{isYonote(item) && <small> · Yonote</small>}
            </button>
          : <ReferenceQuestion key={item[0]} card={item} />)}
      </div>)}
    </div>}
  </section>;
}

function App() {
  const [records, setRecords] = useState(loadProgress);
  const [canSave, setCanSave] = useState(true);
  const [session, setSession] = useState(() => ({ mode: 'study', topic: '', queue: cards, round: 0 }));
  const [filters, setFilters] = useState({ query: '', topic: '', reading: false });

  function navigate(mode, topic = session.topic) {
    const queue = mode === 'reference' ? [] : makeQueue(mode, topic, records);
    setSession(previous => ({ mode, topic, queue, round: previous.round + 1 }));
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
    <h1>Подготовка к собеседованию</h1>
    <p>Вспомни ответ, сверься с карточкой и отметь, когда вернуться к вопросу.</p>
    <Navigation mode={session.mode} onNavigate={navigate} />
    {session.mode === 'reference' ? <Reference filters={filters} setFilters={setFilters} />
      : <Training key={session.round} session={session} records={records} canSave={canSave} onNavigate={navigate} onSave={save} />}
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
