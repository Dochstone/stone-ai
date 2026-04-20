"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const url = typeof window !== "undefined" ? window.location.href : "";
  return (
    <html lang="ru">
      <body style={{ margin: 0, padding: 16, fontFamily: "system-ui, sans-serif", background: "#fff", color: "#000" }}>
        <h1 style={{ fontSize: 18, margin: "0 0 12px" }}>Ошибка на клиенте</h1>
        <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
          <div><b>Message:</b> {error.message || "(нет message)"}</div>
          {error.digest && <div><b>Digest:</b> {error.digest}</div>}
          <div><b>URL:</b> {url}</div>
          <div><b>UA:</b> {ua}</div>
        </div>
        {error.stack && (
          <pre style={{ fontSize: 11, background: "#f5f5f5", padding: 10, overflow: "auto", borderRadius: 6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {error.stack}
          </pre>
        )}
        <button
          onClick={reset}
          style={{ marginTop: 12, padding: "10px 16px", background: "#C4623D", color: "#fff", border: 0, borderRadius: 8, fontSize: 14, fontWeight: 700 }}
        >
          Попробовать снова
        </button>
      </body>
    </html>
  );
}
