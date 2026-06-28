import type { ReactElement } from 'react';
import type { HeadingLevel } from '@ksojecki/platform-ui';
import { Heading } from '@ksojecki/platform-ui';

type MarkdownBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

export function renderMarkdown(contentMd: string): ReactElement[] {
  const lines = contentMd.split('\n');
  const blocks: MarkdownBlock[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push({
      type: 'paragraph',
      text: paragraphLines.join(' '),
    });
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    blocks.push({
      type: 'list',
      items: listItems,
    });
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmed.startsWith('# ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', level: 1, text: trimmed.slice(2).trim() });
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', level: 2, text: trimmed.slice(3).trim() });
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', level: 3, text: trimmed.slice(4).trim() });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
      continue;
    }

    flushList();
    paragraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();

  return blocks.map((block, index) => {
    if (block.type === 'heading') {
      return (
        <Heading
          key={`heading-${String(index)}`}
          level={(block.level + 1) as HeadingLevel}
        >
          {block.text}
        </Heading>
      );
    }

    if (block.type === 'list') {
      return (
        <ol className="list-decimal pl-5" key={`list-${String(index)}`}>
          {block.items.map((item, itemIndex) => (
            <li key={`list-item-${String(index)}-${String(itemIndex)}`}>
              {item}
            </li>
          ))}
        </ol>
      );
    }

    return (
      <p className="leading-relaxed" key={`paragraph-${String(index)}`}>
        {block.text}
      </p>
    );
  });
}
