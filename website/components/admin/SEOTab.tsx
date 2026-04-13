"use client";

import React, { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

interface Overview {
  site: string;
  period: { start: string; end: string; days: number };
  totals: { clicks: number; impressions: number; ctr: number; position: number };
}

interface QueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface PageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

type RangeKey = "7" | "28" | "90";

interface Props {
  token: string;
}

const RANGES: { id: RangeKey; label: string }[] = [
  { id: "7", label: "7 дней" },
  { id: "28", label: "28 дней" },
  { id: "90", label: "90 дней" },
];

export default function SEOTab({ token }: Props) {
  const [days, setDays] = useState<RangeKey>("28");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [indexNowText, setIndexNowText] = useState("");
  const [indexNowResult, setIndexNowResult] = useState<string>("");
  const [indexNowBusy, setIndexNowBusy] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [ovRes, qRes, pRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/seo/overview?days=${days}`, { headers }),
        fetch(`${API_URL}/api/admin/seo/queries?days=${days}&limit=25`, { headers }),
        fetch(`${API_URL}/api/admin/seo/pages?days=${days}&limit=25`, { headers }),
      ]);
      if (ovRes.status === 503) {
        const data = await ovRes.json().catch(() => ({}));
        throw new Error(data.detail || "GSC сервис не настроен");
      }
      if (!ovRes.ok) {
        const data = await ovRes.json().catch(() => ({}));
        throw new Error(data.detail || `GSC overview ${ovRes.status}`);
      }
      const [ov, q, p] = await Promise.all([ovRes.json(), qRes.json(), pRes.json()]);
      setOverview(ov);
      setQueries(q);
      setPages(p);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [days, token]);

  useEffect(() => {
    load();
  }, [load]);

  const submitIndexNow = useCallback(async () => {
    const urls = indexNowText
      .split(/\s+/)
      .map((s) => s.trim())
      .filter((s) => s.startsWith("http"));
    if (urls.length === 0) {
      setIndexNowResult("Введите хотя бы один URL");
      return;
    }
    setIndexNowBusy(true);
    setIndexNowResult("");
    try {
      const res = await fetch(`${API_URL}/api/admin/seo/indexnow`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `HTTP ${res.status}`);
      }
      setIndexNowResult(
        data.ok
          ? `✅ Отправлено ${data.count} URL (HTTP ${data.status})`
          : `⚠️ ${data.message} (HTTP ${data.status}, count=${data.count})`,
      );
    } catch (e: unknown) {
      setIndexNowResult(`❌ ${e instanceof Error ? e.message : "Ошибка"}`);
    } finally {
      setIndexNowBusy(false);
    }
  }, [indexNowText, token]);

  const fmtNum = (n: number) => n.toLocaleString("ru-RU");
  const fmtPct = (n: number) => `${n.toFixed(2)}%`;
  const shortPath = (url: string) => {
    try {
      const u = new URL(url);
      return u.pathname || "/";
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold mb-1">SEO · Google Search Console</h2>
          <p className="text-sm text-text/50">
            Данные с задержкой ~2-3 дня. Кеш обновляется раз в час.
          </p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setDays(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                days === r.id
                  ? "bg-accent text-white"
                  : "bg-text/[0.04] text-text/60 hover:text-text"
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-text/[0.04] text-text/60 hover:text-text disabled:opacity-40"
          >
            {loading ? "..." : "↻"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {overview && !error && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPI label="Клики" value={fmtNum(overview.totals.clicks)} />
            <KPI label="Показы" value={fmtNum(overview.totals.impressions)} />
            <KPI label="CTR" value={fmtPct(overview.totals.ctr)} />
            <KPI label="Средняя позиция" value={overview.totals.position.toFixed(1)} />
          </div>
          <div className="text-xs text-text/40">
            Период: {overview.period.start} → {overview.period.end} (Google data lag ~3 дня)
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title={`Топ запросов · ${days} дней`}>
          {queries.length === 0 ? (
            <Empty />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text/40 text-xs uppercase">
                  <th className="text-left font-semibold py-2">Запрос</th>
                  <th className="text-right font-semibold py-2">Клики</th>
                  <th className="text-right font-semibold py-2">Показы</th>
                  <th className="text-right font-semibold py-2">Поз.</th>
                </tr>
              </thead>
              <tbody>
                {queries.map((q) => (
                  <tr key={q.query} className="border-t border-text/[0.04]">
                    <td className="py-2 pr-3 truncate max-w-[280px]">{q.query}</td>
                    <td className="py-2 text-right font-mono">{q.clicks}</td>
                    <td className="py-2 text-right font-mono text-text/60">{q.impressions}</td>
                    <td className="py-2 text-right font-mono text-text/60">{q.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title={`Топ страниц · ${days} дней`}>
          {pages.length === 0 ? (
            <Empty />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text/40 text-xs uppercase">
                  <th className="text-left font-semibold py-2">URL</th>
                  <th className="text-right font-semibold py-2">Клики</th>
                  <th className="text-right font-semibold py-2">Показы</th>
                  <th className="text-right font-semibold py-2">CTR</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.page} className="border-t border-text/[0.04]">
                    <td className="py-2 pr-3 truncate max-w-[280px]">
                      <a href={p.page} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                        {shortPath(p.page)}
                      </a>
                    </td>
                    <td className="py-2 text-right font-mono">{p.clicks}</td>
                    <td className="py-2 text-right font-mono text-text/60">{p.impressions}</td>
                    <td className="py-2 text-right font-mono text-text/60">{p.ctr.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>

      <Section title="IndexNow · мгновенная индексация в Yandex/Bing">
        <p className="text-sm text-text/50 mb-3">
          Вставь URLs (по одному в строке или через пробел). Google игнорирует IndexNow — для Google
          используй URL Inspection в GSC вручную (~10 в день).
        </p>
        <textarea
          value={indexNowText}
          onChange={(e) => setIndexNowText(e.target.value)}
          rows={5}
          placeholder={"https://stoneai.ru/models/gpt-5.4\nhttps://stoneai.ru/blog/..."}
          className="w-full bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        />
        <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
          <div className="text-xs text-text/40">{indexNowResult}</div>
          <button
            onClick={submitIndexNow}
            disabled={indexNowBusy}
            className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 disabled:opacity-50"
          >
            {indexNowBusy ? "Отправка..." : "Push в IndexNow"}
          </button>
        </div>
      </Section>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-2xl border border-text/5 p-4">
      <div className="text-xs text-text/40 mb-1">{label}</div>
      <div className="text-2xl font-extrabold tabular-nums">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl border border-text/5 p-5">
      <div className="text-sm font-bold mb-3 text-text/70">{title}</div>
      {children}
    </div>
  );
}

function Empty() {
  return <div className="text-sm text-text/30 py-6 text-center">Нет данных за период</div>;
}
