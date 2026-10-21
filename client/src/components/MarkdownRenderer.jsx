import React from 'react';

/**
 * Pure React safe Markdown renderer.
 * Formats headings, bullet lists, ordered lists, bold text, inline code,
 * paragraphs, and key metrics without raw HTML injection or external dependencies.
 */

// Helper to format inline markdown spans (bold, inline code, italic)
function renderInlineSpans(text) {
  if (!text) return null;

  // Tokenize by inline patterns: **bold**, `code`, *italic*
  const tokens = [];
  const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      tokens.push({ type: 'bold', content: matchedStr.slice(2, -2) });
    } else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      tokens.push({ type: 'code', content: matchedStr.slice(1, -1) });
    } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      tokens.push({ type: 'italic', content: matchedStr.slice(1, -1) });
    } else {
      tokens.push({ type: 'text', content: matchedStr });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return tokens.map((token, i) => {
    switch (token.type) {
      case 'bold':
        return (
          <strong key={i} className="font-semibold text-white tracking-wide">
            {token.content}
          </strong>
        );
      case 'code':
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 font-mono text-purple-300 text-[11px]"
          >
            {token.content}
          </code>
        );
      case 'italic':
        return (
          <em key={i} className="italic text-gray-300">
            {token.content}
          </em>
        );
      default:
        return <React.Fragment key={i}>{token.content}</React.Fragment>;
    }
  });
}

export default function MarkdownRenderer({ content = '', className = '' }) {
  if (!content || typeof content !== 'string') return null;

  const lines = content.split('\n');
  const blocks = [];
  let currentList = null; // { type: 'ul' | 'ol', items: [] }

  const flushList = () => {
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Blank line
    if (!trimmed) {
      flushList();
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      flushList();
      blocks.push({
        type: 'h3',
        content: trimmed.slice(4).trim()
      });
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push({
        type: 'h2',
        content: trimmed.slice(3).trim()
      });
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      blocks.push({
        type: 'h1',
        content: trimmed.slice(2).trim()
      });
      continue;
    }

    // Unordered List item (- or *)
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // Ordered List item (1., 2., etc.)
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    // Default: paragraph
    flushList();
    blocks.push({
      type: 'p',
      content: trimmed
    });
  }

  flushList();

  return (
    <div className={`space-y-2 text-xs leading-relaxed ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return (
              <h1
                key={idx}
                className="text-base font-extrabold text-white pt-2 pb-1 border-b border-gray-800"
              >
                {renderInlineSpans(block.content)}
              </h1>
            );
          case 'h2':
            return (
              <h2
                key={idx}
                className="text-sm font-bold text-white pt-2 pb-0.5 text-purple-300"
              >
                {renderInlineSpans(block.content)}
              </h2>
            );
          case 'h3':
            return (
              <h3
                key={idx}
                className="text-xs font-bold text-white pt-1 pb-0.5 flex items-center gap-1.5"
              >
                {renderInlineSpans(block.content)}
              </h3>
            );
          case 'ul':
            return (
              <ul
                key={idx}
                className="list-disc list-outside pl-4 space-y-1 my-1 text-gray-300"
              >
                {block.items.map((item, liIdx) => (
                  <li key={liIdx} className="leading-snug">
                    {renderInlineSpans(item)}
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol
                key={idx}
                className="list-decimal list-outside pl-4 space-y-1.5 my-1 text-gray-300"
              >
                {block.items.map((item, liIdx) => (
                  <li key={liIdx} className="leading-snug">
                    {renderInlineSpans(item)}
                  </li>
                ))}
              </ol>
            );
          case 'p':
          default:
            return (
              <p key={idx} className="my-1 text-gray-200 leading-relaxed">
                {renderInlineSpans(block.content)}
              </p>
            );
        }
      })}
    </div>
  );
}
