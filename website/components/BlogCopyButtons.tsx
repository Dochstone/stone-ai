"use client";

import { useEffect } from "react";

const ACCENT = "#C4623D";
const ACCENT_BG = "rgba(196, 98, 61, 0.1)";
const CODE_BG = "rgba(0, 0, 0, 0.04)";
const COPY_LABEL = "Копировать";
const COPIED_LABEL = "✓ Скопировано";

/**
 * Client-only enhancer: finds <code> elements inside the article that look like
 * prompts (>30 chars or contain spaces/newlines) and adds a "Copy" button.
 * Doesn't touch short inline <code> like variable names.
 */
export default function BlogCopyButtons() {
  useEffect(() => {
    const codes = document.querySelectorAll<HTMLElement>("article code");
    codes.forEach((code) => {
      const text = code.textContent ?? "";
      if (text.length < 30) return;
      if (code.dataset.copyable === "true") return;
      code.dataset.copyable = "true";

      // Style code as a block with room for the button
      Object.assign(code.style, {
        display: "block",
        padding: "16px 100px 16px 16px",
        background: CODE_BG,
        borderRadius: "12px",
        fontSize: "13px",
        lineHeight: "1.6",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      });

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = COPY_LABEL;
      btn.setAttribute("aria-label", "Скопировать промпт");
      Object.assign(btn.style, {
        position: "absolute",
        top: "8px",
        right: "8px",
        padding: "6px 12px",
        fontSize: "11px",
        fontWeight: "700",
        border: "none",
        borderRadius: "8px",
        background: ACCENT_BG,
        color: ACCENT,
        cursor: "pointer",
        transition: "all 0.15s ease",
      });
      btn.onmouseenter = () => {
        btn.style.background = ACCENT;
        btn.style.color = "white";
      };
      btn.onmouseleave = () => {
        btn.style.background = ACCENT_BG;
        btn.style.color = ACCENT;
      };
      btn.onclick = async (e) => {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = COPIED_LABEL;
          setTimeout(() => {
            btn.textContent = COPY_LABEL;
          }, 1800);
        } catch {
          btn.textContent = "Ошибка";
          setTimeout(() => {
            btn.textContent = COPY_LABEL;
          }, 1800);
        }
      };

      const wrapper = document.createElement("div");
      Object.assign(wrapper.style, {
        position: "relative",
        margin: "12px 0",
      });
      code.parentNode?.insertBefore(wrapper, code);
      wrapper.appendChild(code);
      wrapper.appendChild(btn);
    });
  }, []);

  return null;
}
