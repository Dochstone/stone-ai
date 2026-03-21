"use client";

import { useReportWebVitals } from "next/web-vitals";

export default function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to Google Analytics if available
    if (typeof window.gtag === "function") {
      window.gtag("event", metric.name, {
        event_category: "Web Vitals",
        event_label: metric.id,
        value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
        non_interaction: true,
      });
    }

    // Send to Yandex.Metrika if available
    if (typeof window.ym === "function") {
      const ymId = (window as any).__ymId;
      if (ymId) {
        window.ym(ymId, "params", {
          webVitals: { [metric.name]: Math.round(metric.value) },
        });
      }
    }
  });

  return null;
}
