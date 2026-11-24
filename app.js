const cards = [
  ...yonoteCards,
  ['js-types', 'JavaScript', 'Какие типы данных есть в JavaScript?', 'Семь примитивных типов: undefined, null, boolean, number, bigint, string и symbol. Остальные значения относятся к объектам. Функции — вызываемые объекты. typeof null возвращает "object" по историческим причинам.'],
  ['js-loop', 'JavaScript', 'Как работает event loop в браузере?', 'JavaScript выполняет текущую задачу до завершения. После этого браузер опустошает очередь микрозадач, куда попадают обработчики Promise и queueMicrotask. Затем браузер может обновить экран и перейти к следующей задаче, например к колбэку setTimeout.'],
  ['js-closure', 'JavaScript', 'Что такое замыкание?', 'Функция вместе с доступом к её лексическому окружению. Внутренняя функция может обращаться к переменным внешней функции даже после того, как та вернула результат. Пример: function counter() { let n = 0; return () => ++n; }.'],
  ['js-this', 'JavaScript', 'Как определяется this?', 'Для обычной функции значение определяется способом вызова. В obj.method() это obj. call, apply и bind позволяют задать контекст. Стрелочная функция наследует this из окружающей области видимости. При обычном вызове функции в строгом режиме this равен undefined.'],
  ['js-prototype', 'JavaScript', 'Что такое прототип объекта?', 'Это объект, у которого JavaScript ищет свойство, если его нет у самого объекта. Поиск проходит по цепочке прототипов до null. Прототип экземпляра, созданного через new, обычно берётся из Constructor.prototype.'],
  ['js-bind', 'JavaScript', 'Чем отличаются call, apply и bind?', 'call вызывает функцию с заданным this и перечисленными аргументами. apply делает то же, принимая аргументы массивом или массивоподобным объектом. bind возвращает новую функцию с закреплённым this и, при необходимости, начальными аргументами.'],
  ['js-promise', 'JavaScript', 'Что такое Promise?', 'Объект, представляющий результат асинхронной операции. Состояния: pending, fulfilled и rejected. then и catch возвращают новые промисы, поэтому операции можно выстраивать в цепочку. Обработчики запускаются как микрозадачи.'],
  ['js-vars', 'JavaScript', 'Чем отличаются var, let и const?', 'var имеет область видимости функции и инициализируется undefined до объявления. let и const ограничены блоком и недоступны до инициализации. const запрещает переназначать переменную, но объект по этой ссылке можно изменить.'],
  ['web-event', 'Браузер и веб', 'Какие фазы проходит DOM-событие?', 'Захват от предков к цели, фаза цели и, если событие всплывает, всплытие от цели к предкам. event.target указывает на цель, а event.currentTarget — на элемент, чей обработчик сейчас работает.'],
  ['web-cors', 'Браузер и веб', 'Что такое CORS?', 'Механизм, через который сервер сообщает браузеру, может ли страница с другого origin читать ответ. Для некоторых запросов браузер сначала отправляет OPTIONS preflight. Origin определяется схемой, хостом и портом.'],
  ['web-socket', 'Браузер и веб', 'Зачем используют WebSocket?', 'Для двустороннего обмена сообщениями по постоянному соединению. После установления соединения сервер и клиент могут независимо отправлять сообщения. Это удобно для чатов и обновлений в реальном времени.'],
  ['react-key', 'React', 'Для чего нужен key в списках?', 'Ключ позволяет React сопоставлять элементы между рендерами, сохраняя их состояние при перестановке. Ключ должен быть стабильным и уникальным среди соседей. Индекс массива опасен, если список меняет порядок или состав.'],
  ['react-context', 'React', 'Для чего нужен Context?', 'Контекст передаёт значение компонентам в поддереве без передачи пропсов на каждом уровне. Компонент читает значение ближайшего подходящего провайдера через useContext. Примеры: тема и язык интерфейса.'],
  ['react-input', 'React', 'Чем отличается контролируемый input?', 'Контролируемый input получает value или checked из состояния React и обновляет его через onChange. Неконтролируемый input хранит текущее значение в DOM. Начальное значение можно задать через defaultValue или defaultChecked.'],
  ['react-hooks', 'React', 'Что такое хуки?', 'Функции, которые дают функциональным компонентам доступ к возможностям React. Например, useState хранит состояние, useEffect синхронизирует компонент с внешней системой, а useRef сохраняет изменяемую ссылку между рендерами. Обычные хуки вызывают на верхнем уровне компонента или пользовательского хука.']
];
const find = selector => document.querySelector(selector);
const topic = find('#topic');
const storageKey = 'js-theory-progress';
let records = {};
try { records = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch {}
let canSave = true;
let mode = 'study';
let queue = [];
let index = 0;

const referenceTopic = find('#reference-topic');
const referenceSearch = find('#reference-search');
const topics = [...new Set(cards.map(card => card[1]))];
for (const name of topics) {
  topic.add(new Option(name, name));
  referenceTopic.add(new Option(name, name));
}

referenceTopic.onchange = renderReference;
referenceSearch.oninput = renderReference;

function start() {
  const reference = mode === 'reference';
  find('#training').hidden = reference;
  find('#reference').hidden = !reference;
  for (const button of document.querySelectorAll('[data-mode]')) {
    button.setAttribute('aria-pressed', button.dataset.mode === mode);
  }
  if (reference) {
    renderReference();
    return;
  }
  topic.disabled = mode === 'code';
  queue = (mode === 'code' ? exercises : cards).filter(([id, category]) => (mode === 'code' || !topic.value || topic.value === category)
    && (mode !== 'review' || (records[id] && records[id].due <= Date.now())));
  if (mode === 'mock') {
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    queue = queue.slice(0, 5);
  }
  index = 0;
  render();
}

function render() {
  const card = queue[index];
  renderCoverage();
  const reviewed = cards.filter(([id]) => records[id]).length;
  find('#progress').textContent = [
    card ? `${mode === 'code' ? 'Задание' : 'Вопрос'} ${index + 1} из ${queue.length}` : 'Раунд завершён',
    mode === 'code' ? `Решено: ${exercises.filter(([id]) => records[id]).length} из ${exercises.length}` : `Отмечено карточек: ${reviewed} из ${cards.length}`,
    canSave ? '' : 'Прогресс доступен до закрытия страницы'
  ].filter(Boolean).join(' · ');
  find('#category').textContent = card ? [card[1], card[0].startsWith('yonote-') ? 'Yonote' : ''].filter(Boolean).join(' · ') : '';
  find('#question').textContent = card?.[2] || (mode === 'review' && !queue.length
    ? 'Пока нет карточек к повторению' : 'Все вопросы раунда пройдены');
  find('#snippet').hidden = !card || mode !== 'code';
  find('#snippet code').textContent = card?.[4] || '';
  find('#code-rating').hidden = true;
  find('#reveal').textContent = mode === 'code' ? 'Показать вывод и разбор' : 'Показать ответ';
  find('#answer').replaceChildren();
  find('#answer').hidden = true;
  find('#rating').hidden = true;
  find('#reveal').hidden = !card;
  find('#skip').hidden = !card;
  find('#restart').hidden = Boolean(card);
  find('#draft-label').hidden = !card || !['mock', 'code'].includes(mode);
  find('#draft').value = '';
}

function next() {
  index++;
  render();
  find('#question').focus();
}

for (const button of document.querySelectorAll('[data-mode]')) {
  button.onclick = () => { mode = button.dataset.mode; start(); };
}
topic.onchange = start;
find('#skip').onclick = next;
find('#restart').onclick = start;
find('#reveal').onclick = () => {
  renderAnswer(find('#answer'), queue[index]);
  find('#answer').hidden = false;
  find('#rating').hidden = mode === 'code';
  find('#code-rating').hidden = mode !== 'code';
  find('#reveal').hidden = true;
  find(mode === 'code' ? '#solved' : '[data-days]').focus();
};
for (const button of document.querySelectorAll('[data-days]')) {
  button.onclick = () => {
    const days = Number(button.dataset.days);
    records[queue[index][0]] = { due: Date.now() + (days ? days * 86400000 : 600000) };
    save();
    next();
  };
}
function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(records)); } catch { canSave = false; }
}

function renderCoverage() {
  const groups = new Map();
  for (const [id, category] of cards) {
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(id);
  }
  groups.set('Задания с кодом', exercises.map(([id]) => id));
  const rows = Array.from(groups, ([category, ids]) => {
    const done = ids.filter(id => records[id]).length;
    const row = document.createElement('div');
    const label = document.createElement('button');
    const meter = document.createElement('progress');
    label.textContent = `${category} · ${done} из ${ids.length}`;
    label.onclick = () => {
      mode = category === 'Задания с кодом' ? 'code' : 'study';
      if (mode === 'study') topic.value = category;
      start();
      find('#question').focus();
    };
    meter.max = ids.length;
    meter.value = done;
    meter.setAttribute('aria-label', label.textContent);
    row.append(label, meter);
    return row;
  });
  find('#coverage').replaceChildren(...rows);
}

find('#solved').onclick = () => {
  records[queue[index][0]] = { solved: true };
  save();
  next();
};
find('#retry').onclick = next;
start();

function renderAnswer(target, [id, , , answer]) {
  target.replaceChildren();
  if (id.startsWith('yonote-')) renderMarkdown(target, answer);
  else target.textContent = answer;
}

function renderMarkdown(answer, markdown) {
  const blocks = markdown.split(/^[ \t]*```[^\n]*$/m);
  for (const [index, block] of blocks.entries()) {
    if (index % 2) {
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = block.replace(/^\n|\n$/g, '');
      pre.append(code);
      answer.append(pre);
      continue;
    }
    for (const paragraph of block.trim().split(/\n[ \t]*\n/)) {
      if (!paragraph) continue;
      const element = document.createElement('p');
      const images = /!\[([^\]]*)\]\((yonote-images\/[\w-]+\.png|https:\/\/[^\s)]+)(?: "[^"]*")?\)/g;
      let end = 0;
      for (const match of paragraph.matchAll(images)) {
        appendMarkdownText(element, paragraph.slice(end, match.index));
        if (match[2].startsWith('yonote-images/')) {
          const image = document.createElement('img');
          image.src = match[2];
          image.alt = match[1] || 'Иллюстрация из конспекта Yonote';
          image.loading = 'lazy';
          element.append(image);
        } else {
          const link = document.createElement('a');
          link.href = match[2];
          link.textContent = match[1] || 'Открыть иллюстрацию';
          element.append(link);
        }
        end = match.index + match[0].length;
      }
      appendMarkdownText(element, paragraph.slice(end));
      answer.append(element);
    }
  }
}

function appendMarkdownText(element, text) {
  const tokens = /`([^`\n]+)`|\*\*([^*\n]+)\*\*|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let end = 0;
  for (const match of text.matchAll(tokens)) {
    element.append(text.slice(end, match.index));
    const node = document.createElement(match[1] ? 'code' : match[2] ? 'strong' : 'a');
    node.textContent = match[1] || match[2] || match[3];
    if (match[4]) node.href = match[4];
    element.append(node);
    end = match.index + match[0].length;
  }
  element.append(text.slice(end));
}

function renderReference() {
  const query = referenceSearch.value.trim().toLocaleLowerCase('ru');
  const results = cards.filter(([, category, question, answer]) =>
    (!referenceTopic.value || category === referenceTopic.value) &&
    (!query || `${question} ${answer}`.toLocaleLowerCase('ru').includes(query))
  );
  find('#reference-count').textContent = results.length
    ? `Вопросов: ${results.length} из ${cards.length}`
    : 'По этому запросу ничего не найдено';

  const groups = [];
  for (const category of topics) {
    const matches = results.filter(card => card[1] === category);
    if (!matches.length) continue;
    const group = document.createElement('div');
    group.className = 'reference-group';
    const heading = document.createElement('h3');
    heading.textContent = `${category} · ${matches.length}`;
    group.append(heading);

    for (const card of matches) {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = card[2];
      if (card[0].startsWith('yonote-')) {
        const source = document.createElement('small');
        source.textContent = ' · Yonote';
        summary.append(source);
      }
      const answer = document.createElement('div');
      answer.className = 'reference-answer';
      details.append(summary, answer);
      details.addEventListener('toggle', function showAnswer() {
        if (!details.open) return;
        renderAnswer(answer, card);
        details.removeEventListener('toggle', showAnswer);
      });
      group.append(details);
    }
    groups.push(group);
  }
  find('#reference-list').replaceChildren(...groups);
}
