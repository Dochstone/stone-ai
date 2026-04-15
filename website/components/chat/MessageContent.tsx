"use client";

import { useState, useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

const IMAGE_MODEL_IDS = new Set([
  "nano-banana", "nano-banana-pro", "gpt-image-1", "gpt-5-image", "gpt-5-image-mini", "kolors-v2", "kolors-v3",
]);

// ─── Helpers ───

function extractImageUrl(text: string): string | null {
  const b64Match = text.match(/(data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+)/);
  if (b64Match) return b64Match[1];
  const mdMatch = text.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
  if (mdMatch) return mdMatch[1];
  const urlMatch = text.match(/(https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s"'<>]*)?)/i);
  if (urlMatch) return urlMatch[1];
  const jsonUrlMatch = text.match(/"url"\s*:\s*"(https?:\/\/[^"]+)"/);
  if (jsonUrlMatch) return jsonUrlMatch[1];
  // OpenAI DALL-E URLs (oaidalleapi blob storage, no file extension)
  const oaiMatch = text.match(/(https?:\/\/oaidalleapi[^\s"'<>]+)/i);
  if (oaiMatch) return oaiMatch[1];
  // fal.media URLs
  const falMatch = text.match(/(https?:\/\/[^\s"'<>]*fal\.media[^\s"'<>]+)/i);
  if (falMatch) return falMatch[1];
  // If content is just a URL on its own line
  const pureUrl = text.trim();
  if (pureUrl.match(/^https?:\/\/\S+$/) && (pureUrl.includes("image") || pureUrl.includes("dalle") || pureUrl.includes("fal.media"))) return pureUrl;
  return null;
}

function downloadImage(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

function stripImageFromText(content: string): string {
  return content
    .replace(/(data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+)/, "")
    .replace(/!\[.*?\]\(https?:\/\/[^\s)]+\)/g, "")
    .replace(/(https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s"'<>]*)?)/gi, "")
    .replace(/"url"\s*:\s*"https?:\/\/[^"]+"/g, "")
    .trim();
}

// ─── HTML Sanitizer ───

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');
}

// ─── Syntax Highlighting ───

function highlightCode(code: string, _lang: string): string {
  const keywords =
    "\\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|import|export|from|default|async|await|try|catch|finally|throw|new|this|typeof|instanceof|in|of|true|false|null|undefined|void|yield|static|get|set|extends|implements|interface|type|enum|public|private|protected|abstract|readonly|declare|module|namespace|require|def|self|lambda|print|elif|pass|raise|with|as|is|not|and|or|None|True|False)\\b";

  // Escape HTML first
  let highlighted = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Tokenize to avoid highlighting inside strings/comments
  // Use placeholder approach: extract strings & comments, highlight keywords/numbers, then restore
  const tokens: string[] = [];
  const placeholder = (val: string, style: string) => {
    const idx = tokens.length;
    tokens.push(`<span style="color:${style}">${val}</span>`);
    return `\x00T${idx}T\x00`;
  };

  // Strings (double, single, backtick)
  highlighted = highlighted.replace(/(["'`])(?:(?!\1|\\).|\\.)*\1/g, (m) =>
    placeholder(m, "#a5d6ff")
  );

  // Comments (// and #)
  highlighted = highlighted.replace(/(\/\/.*$|#.*$)/gm, (m) =>
    placeholder(m, "#8b949e")
  );

  // Multi-line comments /* */
  highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, (m) =>
    placeholder(m, "#8b949e")
  );

  // Keywords
  highlighted = highlighted.replace(
    new RegExp(keywords, "g"),
    (m) => `<span style="color:#ff7b72">${m}</span>`
  );

  // Numbers
  highlighted = highlighted.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span style="color:#79c0ff">$1</span>'
  );

  // Restore tokens
  highlighted = highlighted.replace(/\x00T(\d+)T\x00/g, (_, idx) => tokens[+idx]);

  return highlighted;
}

// ─── Table Renderer ───

function renderTable(tableText: string): string {
  const lines = tableText.trim().split("\n");
  if (lines.length < 2) return tableText;

  const parseRow = (line: string) =>
    line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c !== "");

  const headers = parseRow(lines[0]);
  // Skip separator line (lines[1] which is like |---|---|)
  const rows = lines.slice(2).map(parseRow);

  let html =
    '<div class="overflow-x-auto my-3"><table class="w-full text-sm border-collapse">';
  html += "<thead><tr>";
  headers.forEach((h) => {
    html += `<th class="px-3 py-2 text-left text-xs font-semibold text-text/50 border-b border-text/10 bg-text/[0.03]">${h}</th>`;
  });
  html += "</tr></thead><tbody>";
  rows.forEach((row) => {
    html += '<tr class="border-b border-text/[0.04]">';
    row.forEach((cell) => {
      html += `<td class="px-3 py-2 text-text/70">${cell}</td>`;
    });
    html += "</tr>";
  });
  html += "</tbody></table></div>";
  return html;
}

// ─── Markdown Renderer ───

function renderMarkdown(text: string): string {
  // Process tables before other formatting (match consecutive lines starting with |)
  let html = text.replace(
    /((?:^\|.+\|$\n?){2,})/gm,
    (match) => renderTable(match)
  );

  html = html
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
      const highlighted = highlightCode(code.trimEnd(), lang || "");
      return `<div class="code-block-wrapper"><div class="code-block-header"><span class="code-lang">${lang || "code"}</span><button type="button" class="code-copy-btn">Копировать</button></div><pre class="code-block"><code>${highlighted}</code></pre></div>`;
    })
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    .replace(/^[*-] (.+)$/gm, '<li class="md-li">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="md-li md-oli">$1</li>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="md-link">$1</a>')
    .replace(/(?<!href=["'])https?:\/\/[^\s<>"'`]+[^\s<>"'`.,;:!?)\]]/g, (url) => `<a href="${url}" target="_blank" rel="noopener" class="md-link">${url}</a>`)
    .replace(/\n/g, "<br/>");

  html = html.replace(/(?:<li class="md-li md-oli">.*?<\/li>(?:<br\/?>)*)+/g, (match) => {
    const cleaned = match.replace(/<br\/?>/g, "");
    return `<ol class="md-ol">${cleaned}</ol>`;
  });
  html = html.replace(/(?:<li class="md-li">.*?<\/li>(?:<br\/?>)*)+/g, (match) => {
    const cleaned = match.replace(/<br\/?>/g, "");
    return `<ul class="md-ul">${cleaned}</ul>`;
  });

  return html;
}

// ─── Sub-components ───

function getVideoUrl(url: string, directUrl?: string, taskId?: string, token?: string): string {
  // Prefer local media URL (permanent, on our server)
  if (directUrl && directUrl.includes("stoneai.ru/media/")) return directUrl;
  if (url.includes("stoneai.ru/media/")) return url;
  // Fallback to proxy or direct
  if (taskId && token) return `${API_URL}/api/video/stream/${taskId}?token=${token}`;
  return directUrl || url;
}

function VideoPlayer({ url, directUrl, taskId, token, thumbnailUrl, isFree }: { url: string; directUrl?: string; taskId?: string; token?: string; thumbnailUrl?: string; isFree?: boolean }) {
  const videoUrl = getVideoUrl(url, directUrl, taskId, token);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const timeout = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(timeout);
  }, [videoUrl]);

  if (error) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ maxWidth: 400 }}>
        <div className="bg-text/[0.04] rounded-2xl flex flex-col items-center justify-center gap-3 p-8" style={{ minHeight: 200 }}>
          <span className="text-[11px] text-text/30">Не удалось загрузить видео</span>
          <a href={videoUrl} download="stone-ai-video.mp4" className="text-[11px] font-bold text-accent hover:underline">Скачать файл</a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden relative" style={{ maxWidth: 400 }}>
      {loading && (
        <div className="absolute inset-0 z-10 bg-text/[0.04] rounded-2xl flex flex-col items-center justify-center gap-2" style={{ minHeight: 200 }}>
          <div className="w-10 h-10 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
          <span className="text-[11px] text-text/30 font-medium">Загрузка видео...</span>
        </div>
      )}
      {/* Watermark overlay for free users */}
      {isFree && !loading && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-end justify-end p-3">
          <span className="text-white/40 text-sm font-bold drop-shadow-lg select-none">stoneai.ru</span>
        </div>
      )}
      <video
        src={videoUrl}
        controls
        playsInline
        preload="auto"
        controlsList="nodownload"
        className={`w-full rounded-t-2xl bg-black ${loading ? "opacity-0" : "opacity-100"} transition-opacity`}
        style={{ maxHeight: 300 }}
        onLoadedData={() => setLoading(false)}
        onCanPlay={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
      />
      <div className="bg-text/[0.06] px-4 py-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-text/40">{loading ? "Загружается..." : isFree ? "С водяным знаком" : "Видео готово"}</span>
        <div className="flex items-center gap-2">
          <a href={videoUrl} download={`stone-ai-video.mp4`} className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" /></svg>
            Скачать
          </a>
          {isFree && (
            <a href="/pricing" className="text-[10px] font-bold text-text/25 hover:text-accent flex items-center gap-1">
              Без знака →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageWithDownload({ url, caption, genId }: { url: string; caption?: string; genId?: number }) {
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const shareText = caption
    ? `${caption.slice(0, 100)} — создано в Stone AI`
    : "Создано нейросетью в Stone AI";
  // If genId available, link to public image; otherwise link to site
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";
  const imagePublicUrl = genId ? `${API_URL}/api/generations/share/${genId}` : null;
  const shareUrl = imagePublicUrl || "https://stoneai.ru/dashboard/chat";

  const shareVK = () => {
    window.open(`https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}&image=${encodeURIComponent(shareUrl)}`, "_blank", "width=600,height=400");
  };
  const shareTG = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank", "width=600,height=400");
  };
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl + "\n" + shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <img
        src={url}
        alt="Generated image"
        className="max-w-full rounded-xl mb-2 cursor-zoom-in"
        style={{ maxHeight: 400 }}
        onClick={() => setPreviewOpen(true)}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      {caption && <div className="whitespace-pre-wrap text-sm mb-2">{caption}</div>}
      <div className="flex items-center gap-1.5 mt-2">
        <button
          onClick={() => downloadImage(url, `stone-ai-${Date.now()}.png`)}
          className="flex items-center gap-1 text-[11px] font-semibold text-accent bg-accent/8 hover:bg-accent/15 px-2.5 py-1.5 rounded-full transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
          </svg>
          <span className="hidden sm:inline">Скачать</span>
        </button>
        <button onClick={shareTG} className="flex items-center gap-1 text-[11px] font-semibold text-[#2AABEE] bg-[#2AABEE]/8 hover:bg-[#2AABEE]/15 px-2.5 py-1.5 rounded-full transition-colors" title="Telegram">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          <span className="hidden sm:inline">TG</span>
        </button>
        <button onClick={shareVK} className="flex items-center gap-1 text-[11px] font-semibold text-[#4680C2] bg-[#4680C2]/8 hover:bg-[#4680C2]/15 px-2.5 py-1.5 rounded-full transition-colors" title="VK">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M21.547 7H18.89c-.408 0-.55.184-.55.4 0 .252.144.472.55.472h.68c.36 0 .474.157.398.498-.144.65-.506 1.3-.92 1.952-.253.397-.523.65-.83.65-.254 0-.367-.137-.367-.457V7.74c0-.47-.163-.74-.647-.74H15.58c-.327 0-.52.228-.52.44 0 .46.68.565.75 1.86v2.81c0 .616-.11.728-.352.728-.643 0-2.208-2.36-3.136-5.062C12.14 7.3 11.93 7 11.437 7H8.78c-.484 0-.58.184-.58.4 0 .505.68 3.012 3.17 6.326C13.02 15.917 15.144 17 17.08 17c1.167 0 1.31-.262 1.31-.713v-1.86c0-.486.102-.582.444-.582.252 0 .684.127 1.694 1.083C21.56 15.928 21.69 17 22.58 17h2.67c.484 0 .728-.262.588-.78-.306-1.016-3.29-3.866-3.42-4.048-.252-.324-.18-.47 0-.758.003 0 2.473-3.48 2.73-4.664.126-.396-.072-.75-.598-.75z"/></svg>
          <span className="hidden sm:inline">VK</span>
        </button>
        <button onClick={copyLink} className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-full transition-colors ${copied ? "text-teal bg-teal/10" : "text-text/40 bg-text/5 hover:bg-text/10"}`} title="Копировать ссылку">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L5.25 8.81" />
          </svg>
          <span className="hidden sm:inline">{copied ? "Скопировано!" : "Ссылка"}</span>
        </button>
      </div>

      {previewOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 p-4 flex items-center justify-center"
          onClick={() => setPreviewOpen(false)}
        >
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/15 transition-colors"
            aria-label="Close image preview"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="max-w-6xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img src={url} alt="Generated image preview" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}

function ThinkingBlock({ content }: { content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[11px] text-text/30 hover:text-text/50 transition-colors py-1"
      >
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-semibold">Ход мыслей</span>
        <span className="text-text/15">({content.length} симв.)</span>
      </button>
      {open && (
        <div className="mt-1 pl-3 border-l-2 border-text/10 text-[12px] text-text/40 leading-relaxed max-h-[300px] overflow-y-auto">
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───

export default function MessageContent({ content, role, selectedModel }: { content: string; role: string; selectedModel: string }) {
  const mdRef = useRef<HTMLDivElement>(null);

  // Extract <think>...</think> block (computed before hooks-after-early-return; safe when content is empty)
  const thinkMatch = content ? content.match(/<think>([\s\S]*?)<\/think>/) : null;
  const thinkContent = thinkMatch ? thinkMatch[1].trim() : null;
  const displayContent = thinkMatch ? content.replace(/<think>[\s\S]*?<\/think>/, "").trim() : content;

  useEffect(() => {
    const el = mdRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest<HTMLButtonElement>(".code-copy-btn");
      if (!btn || !el.contains(btn)) return;
      const code = btn.closest(".code-block-wrapper")?.querySelector("code")?.textContent ?? "";
      navigator.clipboard.writeText(code).then(() => {
        const prev = btn.textContent;
        btn.textContent = "Скопировано!";
        window.setTimeout(() => {
          if (btn.textContent === "Скопировано!") btn.textContent = prev ?? "Копировать";
        }, 2000);
      });
    };
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [displayContent]);

  if (role !== "assistant" || !content) {
    return <div className="whitespace-pre-wrap break-words">{content}</div>;
  }

  // Detect still-thinking (open <think> without close)
  const isStillThinking = !thinkMatch && content.includes("<think>") && !content.includes("</think>");
  const partialThink = isStillThinking ? content.replace("<think>", "").trim() : null;

  const imageUrl = extractImageUrl(displayContent);
  const isImageModel = IMAGE_MODEL_IDS.has(selectedModel);

  return (
    <div>
      {/* Still thinking indicator */}
      {isStillThinking && (
        <div className="flex items-center gap-2 mb-2 text-[11px] text-text/30">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="font-semibold">Размышляет...</span>
        </div>
      )}

      {/* Completed thinking block */}
      {thinkContent && <ThinkingBlock content={thinkContent} />}

      {/* Main content */}
      {imageUrl ? (
        <>
          <ImageWithDownload url={imageUrl} caption={stripImageFromText(displayContent) || undefined} />
        </>
      ) : displayContent.match(/^https?:\/\/\S+$/) ? (
        <ImageWithDownload url={displayContent.trim()} />
      ) : displayContent ? (
        <div ref={mdRef} className="md-content break-words" dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderMarkdown(displayContent)) }} />
      ) : null}
    </div>
  );
}

// Re-export sub-components that WebChat.tsx might still use directly
export { VideoPlayer, getVideoUrl, ImageWithDownload, renderMarkdown, extractImageUrl, downloadImage, stripImageFromText, ThinkingBlock };
