export function formatNoteDate(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) return '';
  try {
    const date = new Date(timestamp);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return 'Yesterday';
    }

    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 6) {
      return date.toLocaleDateString([], { weekday: 'long' });
    }

    return date.toLocaleDateString([], {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
    });
  } catch {
    return '';
  }
}

export function formatEditorHeaderDate(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) return '';
  try {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${dateStr} at ${timeStr}`;
  } catch {
    return '';
  }
}

export function extractNoteMetadata(html: string): {
  title: string;
  snippet: string;
  tags: string[];
  thumbnail: string | null;
} {
  if (!html || !html.trim()) {
    return {
      title: 'New Note',
      snippet: 'No additional text',
      tags: [],
      thumbnail: null,
    };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Find thumbnail from first img
  const firstImg = doc.querySelector('img');
  const thumbnail = firstImg ? firstImg.getAttribute('src') : null;

  // Extract blocks to preserve natural newlines
  const blocks = doc.querySelectorAll('h1, h2, h3, p, li, blockquote');
  const textLines: string[] = [];

  if (blocks.length > 0) {
    blocks.forEach((b) => {
      const line = (b.textContent || '').trim();
      if (line) textLines.push(line);
    });
  } else {
    const raw = doc.body.textContent || '';
    raw.split('\n').forEach((l) => {
      const line = l.trim();
      if (line) textLines.push(line);
    });
  }

  const title = textLines[0] || 'New Note';
  const snippet = textLines.length > 1 ? textLines.slice(1).join(' ') : 'No additional text';

  // Extract tags: #tagname (ignoring # on its own)
  const fullText = doc.body.textContent || '';
  const tagRegex = /(?:^|\s)#([a-zA-Z0-9_\-\u00C0-\u024F]+)/g;
  const tagsSet = new Set<string>();
  let match;
  while ((match = tagRegex.exec(fullText)) !== null) {
    if (match[1] && match[1].length > 0) {
      tagsSet.add(match[1].toLowerCase());
    }
  }

  return {
    title,
    snippet: snippet.slice(0, 140),
    tags: Array.from(tagsSet),
    thumbnail,
  };
}

export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function traverse(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const childrenText = Array.from(el.childNodes).map(traverse).join('');

    switch (tag) {
      case 'h1':
        return `# ${childrenText}\n\n`;
      case 'h2':
        return `## ${childrenText}\n\n`;
      case 'h3':
        return `### ${childrenText}\n\n`;
      case 'p':
        return `${childrenText}\n\n`;
      case 'strong':
      case 'b':
        return `**${childrenText}**`;
      case 'em':
      case 'i':
        return `*${childrenText}*`;
      case 'u':
        return `<u>${childrenText}</u>`;
      case 's':
      case 'strike':
      case 'del':
        return `~~${childrenText}~~`;
      case 'code':
        return `\`${childrenText}\``;
      case 'pre':
        return `\`\`\`\n${childrenText}\n\`\`\`\n\n`;
      case 'ul':
        return `${childrenText}\n`;
      case 'ol':
        return `${childrenText}\n`;
      case 'li': {
        const isTask = el.getAttribute('data-type') === 'taskItem';
        if (isTask) {
          const checked = el.getAttribute('data-checked') === 'true';
          return `- [${checked ? 'x' : ' '}] ${childrenText.trim()}\n`;
        }
        return `- ${childrenText.trim()}\n`;
      }
      case 'a': {
        const href = el.getAttribute('href') || '';
        return `[${childrenText}](${href})`;
      }
      case 'img': {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || 'image';
        return `![${alt}](${src})\n\n`;
      }
      case 'hr':
        return `---\n\n`;
      case 'br':
        return `\n`;
      case 'table':
        return `${childrenText}\n`;
      case 'tr':
        return `| ${childrenText} |\n`;
      case 'th':
      case 'td':
        return ` ${childrenText.trim()} |`;
      default:
        return childrenText;
    }
  }

  return traverse(doc.body).trim();
}
