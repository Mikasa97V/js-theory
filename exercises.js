const exercises = [
  ['code-this', 'this', 'Что выведут два вызова?', '7\n3\n\nМетод получает this из объекта слева от точки. call явно задаёт другой объект для второго вызова.',
    'const item = { value: 7, read() { return this.value; } };\nconsole.log(item.read());\nconsole.log(item.read.call({ value: 3 }));'],
  ['code-closure', 'Замыкания', 'Что выведут три вызова счётчиков?', '1\n2\n1\n\nКаждый вызов counter создаёт своё окружение с отдельной переменной n. Функция a меняет одну переменную, а b — другую.',
    'function counter() {\n  let n = 0;\n  return () => ++n;\n}\nconst a = counter();\nconst b = counter();\nconsole.log(a());\nconsole.log(a());\nconsole.log(b());'],
  ['code-loop', 'Event loop', 'В каком порядке появятся буквы?', 'A\nD\nC\nB\n\nСначала выполняется синхронный код. Затем обработчик Promise запускается как микрозадача. Колбэк таймера выполняется в следующей задаче.',
    "console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));\nconsole.log('D');"],
  ['code-scope', 'Область видимости', 'Какие значения выведутся после цикла?', '0\n1\n2\n\nПри использовании let в заголовке цикла каждая итерация создаёт отдельную привязку i. Каждая функция замыкается на свою привязку.',
    'const callbacks = [];\nfor (let i = 0; i < 3; i++) {\n  callbacks.push(() => i);\n}\nfor (const callback of callbacks) console.log(callback());'],
  ['code-prototype', 'Прототипы', 'Что выведет код после удаления свойства?', '5\n2\n\nСначала читается собственное свойство объекта. После его удаления поиск находит одноимённое свойство в прототипе.',
    'const item = Object.create({ value: 2 });\nitem.value = 5;\nconsole.log(item.value);\ndelete item.value;\nconsole.log(item.value);'],
  ['code-promise', 'Promise', 'Что выведется после обработки ошибки?', '3\n4\n\ncatch возвращает новый промис, исполненный значением 3. Следующий then получает 3 и возвращает 4.',
    "Promise.reject(new Error('Ошибка'))\n  .catch(() => 3)\n  .then(value => {\n    console.log(value);\n    return value + 1;\n  })\n  .then(value => console.log(value));"]
];
