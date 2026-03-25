"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  // Hide on webchat page
  const isWebchat = pathname === "/studio";

  useEffect(() => {
    if (isWebchat) return;

    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isWebchat]);

  if (isWebchat) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Наверх"
      className={`fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-white shadow-lg border border-text/10 flex items-center justify-center text-text/50 hover:text-accent hover:border-accent/30 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}
