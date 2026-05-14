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

interface IndexNowHistoryItem {
  ts: string;
  source: string;
  ok: boolean;
  status: number;
  count: number;
  message: string;
  sample_urls: string[];
}

interface IndexNowStats {
  site_host: string;
  endpoint: string;
  key_configured: boolean;
  key_location: string;
  sitemap: { url: string; status: number; url_count: number; error?: string };
  checks: {
    indexnow_key?: { url: string; status: number; ok: boolean; error?: string };
    bing_auth?: { url: string; status: number; ok: boolean; error?: string };
  };
  history: {
    submissions: number;
    accepted: number;
    failed: number;
    total_urls: number;
    last_submission: IndexNowHistoryItem | null;
    recent: IndexNowHistoryItem[];
  };
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
  const [indexNowStats, setIndexNowStats] = useState<IndexNowStats | null>(null);
  const [indexNowStatsError, setIndexNowStatsError] = useState("");
  const [indexNowText, setIndexNowText] = useState("");
  const [indexNowResult, setIndexNowResult] = useState<string>("");
  const [indexNowBusy, setIndexNowBusy] = useState(false);
  const [indexNowSitemapBusy, setIndexNowSitemapBusy] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const loadIndexNowStats = useCallback(async () => {
    if (!token) return;
    setIndexNowStatsError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/seo/indexnow/stats`, { headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `IndexNow stats ${res.status}`);
      setIndexNowStats(data);
    } catch (e: unknown) {
      setIndexNowStatsError(e instanceof Error ? e.message : "РћС€РёР±РєР° IndexNow stats");
    }
  }, [token]);

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

  useEffect(() => {
    loadIndexNowStats();
  }, [loadIndexNowStats]);

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

  const submitSitemapIndexNow = useCallback(async () => {
    setIndexNowSitemapBusy(true);
    setIndexNowResult("");
    try {
      const res = await fetch(`${API_URL}/api/admin/seo/indexnow/sitemap`, {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `HTTP ${res.status}`);
      }
      setIndexNowResult(
        data.ok
          ? `вњ… Sitemap РѕС‚РїСЂР°РІР»РµРЅ: ${data.count} URL (HTTP ${data.status})`
          : `вљ пёЏ ${data.message} (HTTP ${data.status}, count=${data.count})`,
      );
      loadIndexNowStats();
    } catch (e: unknown) {
      setIndexNowResult(`вќЊ ${e instanceof Error ? e.message : "РћС€РёР±РєР°"}`);
    } finally {
      setIndexNowSitemapBusy(false);
    }
  }, [token, loadIndexNowStats]);

  const fmtNum = (n: number) => n.toLocaleString("ru-RU");
  const fmtPct = (n: number) => `${n.toFixed(2)}%`;
  const fmtDate = (value?: string | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
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
        {indexNowStatsError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            {indexNowStatsError}
          </div>
        )}
        {indexNowStats && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <KPI label="URL в sitemap" value={fmtNum(indexNowStats.sitemap.url_count)} />
              <KPI label="Отправлено URL" value={fmtNum(indexNowStats.history.total_urls)} />
              <KPI label="Успешных push" value={fmtNum(indexNowStats.history.accepted)} />
              <KPI label="Последний push" value={fmtDate(indexNowStats.history.last_submission?.ts)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4 text-xs">
              <StatusPill label="Sitemap" ok={indexNowStats.sitemap.status === 200} detail={`${indexNowStats.sitemap.status || "ERR"} · ${indexNowStats.sitemap.url}`} />
              <StatusPill label="IndexNow key" ok={!!indexNowStats.checks.indexnow_key?.ok} detail={`${indexNowStats.checks.indexnow_key?.status || "ERR"} · ${indexNowStats.key_location}`} />
              <StatusPill label="Bing verify" ok={!!indexNowStats.checks.bing_auth?.ok} detail={`${indexNowStats.checks.bing_auth?.status || "ERR"} · /BingSiteAuth.xml`} />
            </div>
            {indexNowStats.history.recent.length > 0 && (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-text/40 uppercase">
                      <th className="text-left font-semibold py-2">Когда</th>
                      <th className="text-left font-semibold py-2">Источник</th>
                      <th className="text-right font-semibold py-2">URL</th>
                      <th className="text-right font-semibold py-2">HTTP</th>
                      <th className="text-left font-semibold py-2 pl-3">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indexNowStats.history.recent.map((item) => (
                      <tr key={`${item.ts}-${item.source}-${item.count}`} className="border-t border-text/[0.04]">
                        <td className="py-2 whitespace-nowrap">{fmtDate(item.ts)}</td>
                        <td className="py-2 text-text/60">{item.source}</td>
                        <td className="py-2 text-right font-mono">{item.count}</td>
                        <td className="py-2 text-right font-mono">{item.status}</td>
                        <td className={`py-2 pl-3 ${item.ok ? "text-emerald-600" : "text-red-600"}`}>
                          {item.ok ? "accepted" : item.message || "failed"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
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
            onClick={submitSitemapIndexNow}
            disabled={indexNowSitemapBusy}
            className="px-4 py-2 rounded-xl bg-text/[0.06] text-text/70 text-sm font-bold hover:bg-text/[0.1] disabled:opacity-50"
          >
            {indexNowSitemapBusy ? "РћС‚РїСЂР°РІРєР°..." : "Push sitemap"}
          </button>
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

function StatusPill({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${ok ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
      <div className={`font-bold ${ok ? "text-emerald-600" : "text-red-600"}`}>
        {label}: {ok ? "OK" : "ERR"}
      </div>
      <div className="text-text/40 truncate mt-0.5">{detail}</div>
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
