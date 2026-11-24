import React from 'react';

export const isYonote = card => card[0].startsWith('yonote-');

function inline(text) {
  const tokens = /`([^`\n]+)`|\*\*([^*\n]+)\*\*|!?\[([^\]\n]*)\]\((https?:\/\/[^\s)]+|yonote-images\/[\w-]+\.png)(?: "[^"]*")?\)/g;
  const nodes = [];
  let end = 0;
  for (const match of text.matchAll(tokens)) {
    const [token, code, strong, label, url] = match;
    const key = match.index;
    nodes.push(text.slice(end, key));
    if (code) nodes.push(<code key={key}>{code}</code>);
    else if (strong) nodes.push(<strong key={key}>{strong}</strong>);
    else if (url.startsWith('yonote-images/')) {
      nodes.push(<img key={key} src={import.meta.env.BASE_URL + url} alt={label || 'Иллюстрация из конспекта Yonote'} loading="lazy" />);
    } else nodes.push(<a key={key} href={url}>{label || 'Открыть иллюстрацию'}</a>);
    end = key + token.length;
  }
  nodes.push(text.slice(end));
  return nodes;
}

export function Answer({ card }) {
  if (!isYonote(card)) return card[3];
  return card[3].split(/^[ \t]*```[^\n]*$/m).map((block, index) =>
    index % 2
      ? <pre key={index}><code>{block.replace(/^\n|\n$/g, '')}</code></pre>
      : <React.Fragment key={index}>{block.trim().split(/\n[ \t]*\n/).filter(Boolean).map((paragraph, number) =>
          <p key={number}>{inline(paragraph)}</p>
        )}</React.Fragment>
  );
}
