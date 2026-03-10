/**
 * Lightweight markdown renderer — converts basic markdown to HTML.
 * No external dependencies. Handles: bold, italic, code, code blocks, links, lists.
 */

export function renderMarkdown(text: string): string {
  if (!text) return ''

  let html = text

  // Escape HTML entities (prevent XSS)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks: ```lang\n...\n```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre class="md-code-block"><code>${code.trim()}</code></pre>`
  })

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // Italic: *text* or _text_
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')

  // Strikethrough: ~~text~~
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>')

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="md-link">$1</a>')

  // Headers: ### text (only h3 and below to keep chat clean)
  html = html.replace(/^### (.+)$/gm, '<div class="md-h3">$1</div>')
  html = html.replace(/^## (.+)$/gm, '<div class="md-h2">$1</div>')
  html = html.replace(/^# (.+)$/gm, '<div class="md-h1">$1</div>')

  // Unordered lists: - item or * item
  html = html.replace(/^[*-] (.+)$/gm, '<div class="md-li">• $1</div>')

  // Ordered lists: 1. item
  html = html.replace(/^\d+\. (.+)$/gm, '<div class="md-li">$1</div>')

  // Horizontal rule: --- or ***
  html = html.replace(/^(-{3,}|\*{3,})$/gm, '<hr class="md-hr" />')

  // Line breaks (double newline = paragraph, single = <br>)
  html = html.replace(/\n\n/g, '<br/><br/>')
  html = html.replace(/\n/g, '<br/>')

  return html
}
