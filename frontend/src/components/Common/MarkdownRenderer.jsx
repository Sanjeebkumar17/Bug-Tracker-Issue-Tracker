import React from 'react';

export const MarkdownRenderer = ({ content, className = '' }) => {
  if (!content) return null;

  // Process markdown into structured blocks
  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2 border border-slate-800">
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1">{parseInline(line.slice(4))}</h4>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4 mb-1.5 border-b border-slate-200 dark:border-slate-800 pb-1">{parseInline(line.slice(3))}</h3>);
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<h2 key={i} className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-4 mb-2">{parseInline(line.slice(2))}</h2>);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-indigo-500 pl-3 py-1 my-1.5 text-slate-600 dark:text-slate-300 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-r text-xs italic">
          {parseInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Checkbox lists
    if (line.trim().startsWith('- [ ] ')) {
      elements.push(
        <div key={i} className="flex items-center gap-2 my-1 text-slate-700 dark:text-slate-300 text-xs">
          <input type="checkbox" disabled checked={false} className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0" />
          <span>{parseInline(line.trim().slice(6))}</span>
        </div>
      );
      continue;
    }
    if (line.trim().startsWith('- [x] ') || line.trim().startsWith('- [X] ')) {
      elements.push(
        <div key={i} className="flex items-center gap-2 my-1 text-slate-400 dark:text-slate-500 text-xs line-through">
          <input type="checkbox" disabled checked={true} className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0" />
          <span>{parseInline(line.trim().slice(6))}</span>
        </div>
      );
      continue;
    }

    // Bullet list
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <li key={i} className="ml-4 list-disc text-slate-700 dark:text-slate-300 text-xs my-0.5">
          {parseInline(line.trim().slice(2))}
        </li>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^\d+\.\s(.*)/);
    if (numMatch) {
      elements.push(
        <li key={i} className="ml-4 list-decimal text-slate-700 dark:text-slate-300 text-xs my-0.5">
          {parseInline(numMatch[1])}
        </li>
      );
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={i} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed my-1">
        {parseInline(line)}
      </p>
    );
  }

  return <div className={`markdown-content ${className}`}>{elements}</div>;
};

// Parse bold, italic, code, mentions, and links
function parseInline(text) {
  if (!text) return '';

  const parts = [];
  // Tokenize regex
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|@([a-zA-Z0-9_]+)|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded font-mono text-[11px] border border-slate-200 dark:border-slate-700">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index} className="font-semibold text-slate-900 dark:text-white">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={match.index} className="italic text-slate-800 dark:text-slate-200">{token.slice(1, -1)}</em>);
    } else if (token.startsWith('@')) {
      parts.push(
        <span key={match.index} className="inline-flex items-center px-1.5 py-0.2 rounded font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px]">
          {token}
        </span>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkText = match[3];
      const linkUrl = match[4];
      parts.push(
        <a key={match.index} href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          {linkText}
        </a>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}
