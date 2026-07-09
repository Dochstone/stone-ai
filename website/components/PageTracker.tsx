"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

interface RefUtm {
  ref_code?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

function readRefUtm(): RefUtm {
  try {
    const params = new URLSearchParams(window.location.search);
    const out: RefUtm = {};
    const ref = params.get("ref");
    if (ref) out.ref_code = ref.trim().toUpperCase().slice(0, 32);
    const src = params.get("utm_source");
    if (src) out.utm_source = src.slice(0, 64);
    const med = params.get("utm_medium");
    if (med) out.utm_medium = med.slice(0, 64);
    const cmp = params.get("utm_campaign");
    if (cmp) out.utm_campaign = cmp.slice(0, 128);
    const content = params.get("utm_content");
    if (content) out.utm_content = content.slice(0, 128);
    const term = params.get("utm_term");
    if (term) out.utm_term = term.slice(0, 128);
    return out;
  } catch {
    return {};
  }
}

export default function PageTracker() {
  const pathname = usePathname();
  const startRef = useRef(Date.now());
  const lastPathRef = useRef("");

  // Capture UTM params + ref code on first visit
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);

      // Always capture ref if present (overwrite previous — latest link wins)
      const ref = params.get("ref");
      if (ref) {
        localStorage.setItem("stone_ref", ref.trim().toUpperCase());
      }

      if (localStorage.getItem("stone_utm")) return;
      const utm: Record<string, string> = {};
      for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
        const v = params.get(key);
        if (v) utm[key] = v;
      }
      if (document.referrer && !document.referrer.includes("stoneai.ru")) {
        utm.first_referrer = document.referrer;
        if (!utm.utm_source) {
          const refHost = new URL(document.referrer).hostname.replace(/^www\./, "");
          if (refHost) {
            utm.utm_source = refHost.slice(0, 64);
            utm.utm_medium = utm.utm_medium || "referral";
          }
        }
      }
      utm.first_landing_path = window.location.pathname;
      utm.first_landing_url = window.location.href.slice(0, 700);
      localStorage.setItem("stone_utm", JSON.stringify(utm));
    } catch {}
  }, []);

  useEffect(() => {
    const refUtm = readRefUtm();

    // Send previous page duration
    if (lastPathRef.current && lastPathRef.current !== pathname) {
      const duration = (Date.now() - startRef.current) / 1000;
      if (duration > 1 && duration < 1800) {
        const auth = (() => { try { return JSON.parse(localStorage.getItem("stone_auth") || "{}"); } catch { return {}; } })();
        const durationPayload = JSON.stringify({
          path: lastPathRef.current,
          referrer: document.referrer || null,
          duration_sec: Math.round(duration),
          screen_width: window.innerWidth,
        });
        navigator.sendBeacon?.(
          `${API_URL}/api/analytics/track`,
          new Blob([durationPayload], { type: "application/json" })
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
      body: JSON.stringify({ path: pathname, referrer: document.referrer || null, screen_width: window.innerWidth, ...refUtm }),
    }).catch(() => {});

    // Send duration on page unload
    const onUnload = () => {
      const duration = (Date.now() - startRef.current) / 1000;
      if (duration > 1 && duration < 1800) {
        navigator.sendBeacon?.(
          `${API_URL}/api/analytics/track`,
          new Blob([JSON.stringify({ path: pathname, duration_sec: Math.round(duration), screen_width: window.innerWidth })], { type: "application/json" })
        );
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [pathname]);

  return null;
}
