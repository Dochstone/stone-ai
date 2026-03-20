"use client";

import { useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Force light mode in webchat
  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");
    html.classList.remove("dark");
    return () => { if (wasDark) html.classList.add("dark"); };
  }, []);

  return (
    <>
      <style>{`nav, footer, .scroll-to-top { display: none !important; } main { padding: 0 !important; }`}</style>
      {children}
    </>
  );
}
