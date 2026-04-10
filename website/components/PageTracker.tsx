"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

export default function PageTracker() {
  const pathname = usePathname();
  const startRef = useRef(Date.now());
  const lastPathRef = useRef("");

  // Capture UTM params on first visit
  useEffect(() => {
    try {
      if (localStorage.getItem("stone_utm")) return;
      const params = new URLSearchParams(window.location.search);
      const utm: Record<string, string> = {};
      for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
        const v = params.get(key);
        if (v) utm[key] = v;
      }
      if (document.referrer && !document.referrer.includes("stoneai.ru")) {
        utm.first_referrer = document.referrer;
      }
      if (Object.keys(utm).length > 0) {
        localStorage.setItem("stone_utm", JSON.stringify(utm));
      }
    } catch {}
  }, []);

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
