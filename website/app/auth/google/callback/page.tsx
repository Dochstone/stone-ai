"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

export default function GoogleCallback() {
  const [error, setError] = useState("");
  const [returnHref, setReturnHref] = useState("/dashboard/chat");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const isLinkFlow = params.get("link") === "true" || params.get("state") === "link";
    setReturnHref(isLinkFlow ? "/profile" : "/dashboard/chat");

    if (!code) {
      setError("No authorization code");
      return;
    }

    const utm = (() => { try { return JSON.parse(localStorage.getItem("stone_utm") || "{}"); } catch { return {}; } })();
    const ref_code = (() => { try { return localStorage.getItem("stone_ref") || undefined; } catch { return undefined; } })();

    fetch(`${API_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        redirect_uri: window.location.origin + "/auth/google/callback",
        ref_code,
        ...utm,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem(
            "stone_auth",
            JSON.stringify({
              token: data.token,
              email: data.user.email,
              balanceUsd: data.user.balance_usd || 0,
            })
          );
          window.location.href = isLinkFlow ? "/profile" : "/dashboard/chat";
        } else {
          setError(data.detail || "Auth failed");
        }
      })
      .catch(() => setError("Network error"));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <a href="/dashboard/chat" className="text-accent text-sm hover:underline">Вернуться</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center" data-return-href={returnHref}>
      <p className="text-text/50 text-sm">Авторизация через Google...</p>
    </div>
  );
}
