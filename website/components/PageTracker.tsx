"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

export default function PageTracker() {
  const pathname = usePathname();
  const startRef = useRef(Date.now());
  const lastPathRef = useRef("");

  useEffect(() => {
    // Send previous page duration
    if (lastPathRef.current && lastPathRef.current !== pathname) {
      const duration = (Date.now() - startRef.current) / 1000;
      if (duration > 1 && duration < 1800) {
        const auth = (() => { try { return JSON.parse(localStorage.getItem("stone_auth") || "{}"); } catch { return {}; } })();
        navigator.sendBeacon?.(
          `${API_URL}/api/analytics/track`,
          JSON.stringify({
            path: lastPathRef.current,
            referrer: document.referrer || null,
            duration_sec: Math.round(duration),
            screen_width: window.innerWidth,
          })
        ) || fetch(`${API_URL}/api/analytics/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}) },
          body: JSON.stringify({ path: lastPathRef.current, duration_sec: Math.round(duration), screen_width: window.innerWidth }),
          keepalive: true,
        }).catch(() => {});
      }
    }

    // Track new page view
    startRef.current = Date.now();
    lastPathRef.current = pathname;

    const auth = (() => { try { return JSON.parse(localStorage.getItem("stone_auth") || "{}"); } catch { return {}; } })();
    fetch(`${API_URL}/api/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}) },
      body: JSON.stringify({ path: pathname, referrer: document.referrer || null, screen_width: window.innerWidth }),
    }).catch(() => {});

    // Send duration on page unload
    const onUnload = () => {
      const duration = (Date.now() - startRef.current) / 1000;
      if (duration > 1 && duration < 1800) {
        navigator.sendBeacon?.(
          `${API_URL}/api/analytics/track`,
          JSON.stringify({ path: pathname, duration_sec: Math.round(duration), screen_width: window.innerWidth })
        );
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [pathname]);

  return null;
}
