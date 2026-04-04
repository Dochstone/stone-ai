/**
 * Lightweight error logger for StoneAI.
 * Replace with Sentry/LogRocket in production.
 */

const IS_DEV = process.env.NODE_ENV === "development";

export function logError(context: string, error: unknown, extra?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  // Always log to console
  console.error(`[StoneAI Error] ${context}:`, message, extra || "");
  if (stack && IS_DEV) console.error(stack);

  // In production, could send to analytics or error tracking service
  if (!IS_DEV && typeof window !== "undefined") {
    try {
      // Send to Google Analytics as exception event
      const gtag = (window as any).gtag;
      if (gtag) {
        gtag("event", "exception", {
          description: `${context}: ${message}`,
          fatal: false,
        });
      }
    } catch {}
  }
}

export function logApiError(endpoint: string, status: number, body?: string) {
  logError(`API ${endpoint}`, new Error(`HTTP ${status}`), {
    endpoint,
    status,
    body: body?.slice(0, 200),
  });
}
