"use client";

import { useEffect } from "react";

export default function ModelViewerScript() {
  useEffect(() => {
    if (document.querySelector('script[src*="model-viewer"]')) return;
    const s = document.createElement("script");
    s.type = "module";
    s.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);
  return null;
}
