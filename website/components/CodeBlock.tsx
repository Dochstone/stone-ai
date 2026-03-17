"use client";

import { useState } from "react";

export default function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden my-4">
      <div className="flex items-center justify-between bg-[#1C1C1E] px-4 py-2 border-b border-white/[0.06]">
        <span className="text-[10px] text-white/30 font-mono">{lang || "shell"}</span>
        <button
          onClick={copy}
          className="text-[10px] text-white/30 hover:text-white/60 transition-colors font-medium"
        >
          {copied ? "Скопировано!" : "Копировать"}
        </button>
      </div>
      <pre className="bg-[#1C1C1E] px-4 py-4 overflow-x-auto text-[13px] leading-relaxed">
        <code className="text-white/80 font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}
