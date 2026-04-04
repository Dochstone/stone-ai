"use client";

import { useEffect } from "react";
import { logError } from "@/lib/error-logger";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("Dashboard Error Boundary", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
      <span className="text-4xl">😕</span>
      <h2 className="text-lg font-bold text-text">Что-то пошло не так</h2>
      <p className="text-sm text-text/40 text-center max-w-md">
        Попробуйте обновить страницу. Если ошибка повторяется — очистите кэш браузера.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-accent text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors"
        >
          Попробовать снова
        </button>
        <a
          href="/dashboard"
          className="border border-text/10 text-text/60 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-text/[0.04] transition-colors"
        >
          На главную панели
        </a>
      </div>
    </div>
  );
}
