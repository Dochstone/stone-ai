"use client";

import { useEffect } from "react";

const ACCENT = "#C4623D";
const COPY_LABEL = "Скопировать";
const COPIED_LABEL = "✓ Скопировано";

/**
 * Client-only enhancer: finds <code> elements 30+ chars in article body
 * (likely full prompts) and wraps them in a polished code-block frame
 * with header, monospace font, and a copy button. Short inline <code>
 * (model names, variable names) is left alone.
 */
export default function BlogCopyButtons() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const codes = document.querySelectorAll<HTMLElement>("article code");
    codes.forEach((code) => {
      const text = code.textContent ?? "";
      if (text.length < 30) return;
      if (code.dataset.copyable === "true") return;
      code.dataset.copyable = "true";

      // Reset code styles — strip any inherited p-context classes
      code.removeAttribute("class");
      Object.assign(code.style, {
        display: "block",
        padding: "16px 18px",
        margin: "0",
        background: "transparent",
        color: "#e6e8ec",
        fontSize: "13.5px",
        lineHeight: "1.65",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Cascadia Code', 'Roboto Mono', monospace",
        borderRadius: "0",
      });

      // Frame container
      const frame = document.createElement("div");
      Object.assign(frame.style, {
        position: "relative",
        margin: "16px 0",
        borderRadius: "14px",
        overflow: "hidden",
        background: "linear-gradient(180deg, #1a1d24 0%, #14161c 100%)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.18)",
      });

      // Header bar
      const header = document.createElement("div");
      Object.assign(header.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 14px",
        background: "rgba(255, 255, 255, 0.025)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
      });

      const label = document.createElement("div");
      Object.assign(label.style, {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "11px",
        fontWeight: "700",
        color: "rgba(230, 232, 236, 0.45)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      });
      label.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        <span>Промпт</span>
      `;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "Скопировать промпт");
      Object.assign(btn.style, {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 11px",
        fontSize: "11px",
        fontWeight: "700",
        border: "none",
        borderRadius: "7px",
        background: "rgba(196, 98, 61, 0.12)",
        color: ACCENT,
        cursor: "pointer",
        transition: "all 0.15s ease",
        fontFamily: "inherit",
      });
      btn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        <span>${COPY_LABEL}</span>
      `;
      btn.onmouseenter = () => {
        btn.style.background = ACCENT;
        btn.style.color = "white";
      };
      btn.onmouseleave = () => {
        btn.style.background = "rgba(196, 98, 61, 0.12)";
        btn.style.color = ACCENT;
      };
      btn.onclick = async (e) => {
        e.preventDefault();
        const span = btn.querySelector("span");
        try {
          await navigator.clipboard.writeText(text);
          if (span) span.textContent = COPIED_LABEL;
          btn.style.background = "rgba(34, 197, 94, 0.15)";
          btn.style.color = "#22c55e";
          setTimeout(() => {
            if (span) span.textContent = COPY_LABEL;
            btn.style.background = "rgba(196, 98, 61, 0.12)";
            btn.style.color = ACCENT;
          }, 1800);
        } catch {
          if (span) span.textContent = "Ошибка";
          setTimeout(() => {
            if (span) span.textContent = COPY_LABEL;
          }, 1800);
        }
      };

      header.appendChild(label);
      header.appendChild(btn);

      // Code body wrapper (with subtle scroll if long)
      const body = document.createElement("div");
      Object.assign(body.style, {
        maxHeight: "320px",
        overflowY: "auto",
      });

      // Compose
      code.parentNode?.insertBefore(frame, code);
      body.appendChild(code);
      frame.appendChild(header);
      frame.appendChild(body);
    });
  }, []);

  return null;
}
