"use client";

import { useState, useEffect, useRef } from "react";
import { getAuth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";
const STEPS = ["Анализ ниши", "Ключевые слова", "Группировка", "Минус-слова", "Объявления", "Оптимизация", "Готово"];

interface CampaignItem { id: number; name: string; status: string; step: number; total_keywords: number; total_ads: number; cost_rub: number; created_at: string | null; }

interface CampaignKeyword {
  keyword: string;
  wordstat_frequency?: number | null;
  estimated_cpc?: string | number | null;
  competition?: "high" | "medium" | "low" | string | null;
}

interface CampaignKeywordGroup {
  group_name: string;
  keywords?: string[];
}

interface CampaignAd {
  group?: string;
  title1?: string;
  title2?: string;
  text?: string;
}

interface CampaignRecommendation {
  priority?: "high" | "medium" | "low" | string;
  title: string;
  description: string;
}

interface CampaignResult {
  summary?: {
    total_keywords?: number;
    total_groups?: number;
    total_negative?: number;
    total_ads?: number;
  };
  keywords?: CampaignKeyword[];
  keyword_groups?: CampaignKeywordGroup[];
  ads?: CampaignAd[];
  recommendations?: CampaignRecommendation[];
}

interface ActiveCampaign {
  id: number;
  name?: string;
  niche?: string;
  status: string;
  step: number;
  result?: CampaignResult | null;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [active, setActive] = useState<ActiveCampaign | null>(null);
  const [niche, setNiche] = useState("");
  const [url, setUrl] = useState("");
  const [budget, setBudget] = useState(30000);
  const [region, setRegion] = useState("Россия");
  const [running, setRunning] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const auth = getAuth();

  const fetchList = async () => {
    if (!auth) return;
    const res = await fetch(`${API_URL}/api/campaigns/list`, { headers: { Authorization: `Bearer ${auth.token}` } });
    if (res.ok) { const d = await res.json(); setCampaigns(d.campaigns); }
  };

  useEffect(() => { fetchList(); return () => { if (pollRef.current) clearTimeout(pollRef.current); }; }, []);

  const poll = (id: number) => {
    if (pollRef.current) clearTimeout(pollRef.current);
    let delay = 3000;
    const check = async () => {
      if (!auth) return;
      const res = await fetch(`${API_URL}/api/campaigns/${id}`, { headers: { Authorization: `Bearer ${auth.token}` } });
      if (res.ok) {
        const d = await res.json();
        setActive(d);
        if (d.status === "running") {
          delay = Math.min(delay * 1.2, 10000);
          pollRef.current = setTimeout(check, delay);
        } else {
          setRunning(false);
          fetchList();
        }
      }
    };
    pollRef.current = setTimeout(check, delay);
  };

  const create = async () => {
    if (!auth || !niche.trim() || running) return;
    setRunning(true);
    try {
      const res = await fetch(`${API_URL}/api/campaigns/create`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ niche, url: url || null, budget_rub: budget, region }),
      });
      if (res.ok) {
        const d = await res.json();
        setActive({ id: d.id, status: "running", step: 0, result: null });
        setNiche("");
        setUrl("");
        poll(d.id);
      } else {
        const err = await res.json().catch(() => ({ detail: "Ошибка" }));
        alert(typeof err.detail === "string" ? err.detail : "Ошибка");
        setRunning(false);
      }
    } catch { setRunning(false); }
  };

  const loadCampaign = async (id: number) => {
    if (!auth) return;
    const res = await fetch(`${API_URL}/api/campaigns/${id}`, { headers: { Authorization: `Bearer ${auth.token}` } });
    if (res.ok) {
      const d = await res.json();
      setActive(d);
      if (d.status === "running") poll(id);
    }
  };

  const downloadXlsx = async (id: number) => {
    if (!auth) return;
    const res = await fetch(`${API_URL}/api/campaigns/${id}/export`, { headers: { Authorization: `Bearer ${auth.token}` } });
    if (res.ok) {
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `campaign-${id}.xlsx`;
      a.click();
    }
  };

  const activeKeywords = active?.result?.keywords ?? [];
  const activeKeywordGroups = active?.result?.keyword_groups ?? [];
  const activeAds = active?.result?.ads ?? [];
  const activeRecommendations = active?.result?.recommendations ?? [];

  if (!auth) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-text/40">Войдите чтобы создавать кампании</p>
      <a href="/profile" className="text-accent font-bold hover:underline mt-2 inline-block">Войти</a>
    </div>
  );

  return (
    <div className="pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-text">Генератор рекламных кампаний</h1>
          <p className="text-sm text-text/40 mt-1">Яндекс Директ — ключи, объявления, минус-слова за 2 минуты</p>
        </div>

        {/* First time hint */}
        {campaigns.length === 0 && !running && (
          <div className="bg-gradient-to-r from-accent/5 to-teal/5 border border-accent/10 rounded-2xl p-5 mb-6 flex items-start gap-4">
            <img src="/mascots/stone-mascot-idle.webp?v=2" alt="" width="56" height="56" className="shrink-0 mt-1 hidden sm:block" />
            <div>
              <h3 className="font-bold text-text text-sm mb-1">Как это работает</h3>
              <p className="text-xs text-text/50 leading-relaxed">
                Введите нишу → AI за 2 минуты создаст: 50+ ключевых слов с частотностью, объявления,
                минус-слова и рекомендации. Экспорт в XLSX для загрузки в Яндекс Коммандер. Стоимость — 29₽.
              </p>
            </div>
          </div>
        )}

        {/* Create form */}
        <div className="bg-bg rounded-2xl border border-text/5 p-5 mb-6">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-bold text-text/30 uppercase tracking-wider">Ниша / продукт</label>
              <input value={niche} onChange={e => setNiche(e.target.value)}
                placeholder="Доставка цветов в Москве"
                className="w-full mt-1 bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text/30 uppercase tracking-wider">URL сайта (необязательно)</label>
              <input value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full mt-1 bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text/30 uppercase tracking-wider">Бюджет ₽/мес</label>
              <select value={budget} onChange={e => setBudget(Number(e.target.value))}
                className="w-full mt-1 bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-sm">
                {[5000, 10000, 20000, 30000, 50000, 100000, 300000, 500000].map(b => (
                  <option key={b} value={b}>{b.toLocaleString()}₽</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text/30 uppercase tracking-wider">Регион</label>
              <input value={region} onChange={e => setRegion(e.target.value)}
                className="w-full mt-1 bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30" />
            </div>
          </div>
          <button onClick={create} disabled={running || !niche.trim()}
            className="bg-accent text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-accent/90 disabled:opacity-40 transition-colors flex items-center gap-2">
            {running ? <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Генерация...</> : "Создать кампанию (~29₽)"}
          </button>
        </div>

        <div className="flex gap-6">
          {/* Active campaign */}
          <div className="flex-1 min-w-0">
            {active ? (
              <div className="bg-bg rounded-2xl border border-text/5 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-text truncate">{active.name || active.niche}</h3>
                  <div className="flex items-center gap-2">
                    {active.status === "completed" && (
                      <button onClick={() => downloadXlsx(active.id)} className="text-xs font-bold text-accent bg-accent/10 hover:bg-accent/20 px-3 py-1.5 rounded-lg transition-colors">
                        Скачать XLSX
                      </button>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      active.status === "completed" ? "bg-teal/10 text-teal"
                      : active.status === "running" ? "bg-amber-500/10 text-amber-500"
                      : "bg-red-500/10 text-red-500"
                    }`}>
                      {active.status === "completed" ? "Готово" : active.status === "running" ? `Шаг ${active.step}/7` : "Ошибка"}
                    </span>
                  </div>
                </div>

                {/* Progress steps */}
                <div className="flex items-center gap-1 mb-5">
                  {STEPS.map((s, i) => (
                    <div key={i} className="flex-1">
                      <div className={`h-1.5 rounded-full ${i < active.step ? "bg-teal" : i === active.step && active.status === "running" ? "bg-amber-400 animate-pulse" : "bg-text/10"}`} />
                      <p className={`text-[8px] mt-1 truncate ${i < active.step ? "text-teal" : "text-text/20"}`}>{s}</p>
                    </div>
                  ))}
                </div>

                {/* Results */}
                {active.result && active.status === "completed" && (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: "Ключей", value: active.result.summary?.total_keywords || 0 },
                        { label: "Групп", value: active.result.summary?.total_groups || 0 },
                        { label: "Минус-слов", value: active.result.summary?.total_negative || 0 },
                        { label: "Объявлений", value: active.result.summary?.total_ads || 0 },
                      ].map((s, i) => (
                        <div key={i} className="bg-text/[0.03] rounded-xl p-3 text-center">
                          <div className="text-lg font-extrabold text-text">{s.value}</div>
                          <div className="text-[9px] text-text/30 uppercase">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Keywords with Wordstat data */}
                    {activeKeywords.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-text/50 uppercase mb-2">Ключевые слова (Wordstat)</h4>
                        <div className="max-h-[300px] overflow-y-auto rounded-xl border border-text/5">
                          <table className="w-full text-[11px]">
                            <thead className="bg-text/[0.03] sticky top-0">
                              <tr className="text-left text-text/30">
                                <th className="px-3 py-2">Ключ</th>
                                <th className="px-2 py-2 text-right">Частотность</th>
                                <th className="px-2 py-2 text-right">CPC ₽</th>
                                <th className="px-2 py-2">Конкуренция</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeKeywords.slice(0, 50).map((k: CampaignKeyword, i: number) => (
                                <tr key={i} className="border-t border-text/[0.03] hover:bg-text/[0.02]">
                                  <td className="px-3 py-1.5 text-text/70">{k.keyword}</td>
                                  <td className="px-2 py-1.5 text-right font-mono text-text/50">{k.wordstat_frequency?.toLocaleString() || "—"}</td>
                                  <td className="px-2 py-1.5 text-right font-mono text-text/50">{k.estimated_cpc || "—"}</td>
                                  <td className="px-2 py-1.5">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${k.competition === "high" ? "bg-red-500/10 text-red-500" : k.competition === "medium" ? "bg-amber-500/10 text-amber-500" : "bg-teal/10 text-teal"}`}>{k.competition || "—"}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Keyword groups */}
                    <div>
                      <h4 className="text-xs font-bold text-text/50 uppercase mb-2">Группы ключевых слов</h4>
                      <div className="space-y-2">
                        {activeKeywordGroups.slice(0, 8).map((g: CampaignKeywordGroup, i: number) => {
                          const groupKeywords = g.keywords ?? [];
                          return (
                            <div key={i} className="bg-text/[0.02] rounded-xl p-3">
                              <p className="text-xs font-bold text-text mb-1">{g.group_name}</p>
                              <p className="text-[11px] text-text/40">{groupKeywords.slice(0, 8).join(", ")}{groupKeywords.length > 8 ? ` +${groupKeywords.length - 8}` : ""}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Ads preview */}
                    <div>
                      <h4 className="text-xs font-bold text-text/50 uppercase mb-2">Объявления</h4>
                      <div className="space-y-2">
                        {activeAds.map((ad: CampaignAd, i: number) => (
                          <div key={i} className="bg-text/[0.02] rounded-xl p-3">
                            <p className="text-[10px] text-accent font-semibold mb-1">{ad.group}</p>
                            <p className="text-sm font-bold text-accent">{ad.title1}</p>
                            <p className="text-xs text-accent/70">{ad.title2}</p>
                            <p className="text-xs text-text/60 mt-1">{ad.text}</p>
                            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-text/[0.04]">
                              {[
                                { id: "ctr", icon: "📈" },
                                { id: "cta", icon: "🎯" },
                                { id: "offer", icon: "💪" },
                                { id: "numbers", icon: "🔢" },
                                { id: "emotional", icon: "❤️" },
                                { id: "formal", icon: "👔" },
                                { id: "keywords", icon: "🔑" },
                                { id: "shorten", icon: "✂️" },
                              ].map(p => (
                                <button key={p.id} onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!auth) return;
                                  const btn = e.currentTarget;
                                  btn.disabled = true;
                                  btn.textContent = "...";
                                  try {
                                    const res = await fetch(`${API_URL}/api/campaigns/improve-ad`, {
                                      method: "POST",
                                      headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
                                      body: JSON.stringify({ campaign_id: active.id, ad_index: i, preset: p.id }),
                                    });
                                    if (res.ok) {
                                      const d = await res.json();
                                      if (d.improved) {
                                        setActive((prev) => {
                                          if (!prev?.result?.ads) return prev;
                                          const ads = [...prev.result.ads];
                                          ads[i] = { ...ads[i], ...d.improved };
                                          return { ...prev, result: { ...prev.result, ads } };
                                        });
                                      } else {
                                        loadCampaign(active.id);
                                      }
                                    } else {
                                      const err = await res.json().catch(() => ({ detail: "Ошибка" }));
                                      alert(typeof err.detail === "string" ? err.detail : "Ошибка");
                                    }
                                  } catch {}
                                  btn.disabled = false;
                                  btn.textContent = p.icon;
                                }}
                                className="w-7 h-7 rounded-lg bg-text/[0.04] hover:bg-accent/10 text-[12px] flex items-center justify-center transition-colors"
                                title={`Улучшить: ${p.id} (3₽)`}
                                >{p.icon}</button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    {activeRecommendations.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-text/50 uppercase mb-2">Рекомендации</h4>
                        <div className="space-y-1.5">
                          {activeRecommendations.map((r: CampaignRecommendation, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold ${r.priority === "high" ? "bg-red-500/10 text-red-500" : r.priority === "medium" ? "bg-amber-500/10 text-amber-500" : "bg-text/5 text-text/30"}`}>{r.priority}</span>
                              <div>
                                <p className="font-semibold text-text/70">{r.title}</p>
                                <p className="text-text/40">{r.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {active.status === "running" && (
                  <div className="text-center py-8 text-text/30">
                    <svg className="w-8 h-8 animate-spin mx-auto mb-3 text-accent" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    <p className="text-sm font-semibold">{STEPS[active.step - 1] || "Запуск"}...</p>
                    <p className="text-xs text-text/20 mt-1">Обычно занимает 1-2 минуты</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <img src="/mascots/stone-mascot-idle.webp?v=2" alt="Stone" width="90" height="90" className="mx-auto mb-3" />
                <p className="text-text/25 text-sm">Введите нишу и создайте первую кампанию</p>
              </div>
            )}
          </div>

          {/* History */}
          {campaigns.length > 0 && (
            <div className="hidden lg:block w-56 shrink-0">
              <h4 className="text-[10px] font-bold text-text/30 uppercase tracking-wider mb-3">История</h4>
              <div className="space-y-1.5">
                {campaigns.map(c => (
                  <button key={c.id} onClick={() => loadCampaign(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${active?.id === c.id ? "bg-accent/10 text-accent" : "text-text/50 hover:bg-text/[0.04]"}`}>
                    <p className="font-medium truncate">{c.name}</p>
                    <span className="text-text/25">{c.total_keywords} ключей · {c.cost_rub}₽</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
