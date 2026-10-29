// Tiny, dependency-free Markdown renderer (shared by the public site and the admin preview).
// All input is HTML-escaped before any markup is added.
export const escapeHtml = value => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const renderInlineMarkdown = text => escapeHtml(text)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\*([^*]+)\*/g, '<em>$1</em>')
  .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

export const renderMarkdown = markdown => {
  const lines = markdown.split(/\r?\n/);
  const output = [];
  let listType = '';
  let codeLines = null;

  const closeList = () => {
    if (listType) output.push(`</${listType}>`);
    listType = '';
  };

  for (let index = 0; index < lines.length;) {
    const line = lines[index];

    if (line.trim().startsWith('```')) {
      closeList();
      if (codeLines) {
        output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        codeLines = null;
      } else {
        codeLines = [];
      }
      index += 1;
      continue;
    }

    if (codeLines) {
      codeLines.push(line);
      index += 1;
      continue;
    }

    if (!line.trim()) {
      closeList();
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      output.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    const unorderedItem = line.match(/^\s*[-*]\s+(.+)$/);
    const orderedItem = line.match(/^\s*\d+\.\s+(.+)$/);
    if (listType && /^\s{2,}\S/.test(line) && !unorderedItem && !orderedItem) {
      const lastItem = output[output.length - 1];
      if (lastItem && lastItem.endsWith('</li>')) {
        output[output.length - 1] = lastItem.replace(/<\/li>$/, ` ${renderInlineMarkdown(line.trim())}</li>`);
        index += 1;
        continue;
      }
    }

    if (unorderedItem || orderedItem) {
      const type = unorderedItem ? 'ul' : 'ol';
      if (listType !== type) {
        closeList();
        listType = type;
        output.push(`<${type}>`);
      }
      output.push(`<li>${renderInlineMarkdown((unorderedItem || orderedItem)[1])}</li>`);
      index += 1;
      continue;
    }

    closeList();
    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() &&
      !/^#{1,6}\s+/.test(lines[index]) &&
      !/^\s*[-*]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index]) &&
      !lines[index].trim().startsWith('```')) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    output.push(`<p>${renderInlineMarkdown(paragraph.join(' '))}</p>`);
  }

  closeList();
  if (codeLines) output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  return output.join('\n');
};
/* ============================================================
   FILE: markdown.js
   ROLE: Shared Markdown-to-HTML renderer; used by admin.js and project-details.js.
   ============================================================ */
