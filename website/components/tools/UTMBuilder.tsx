"use client";

import { useState, useMemo, useCallback } from "react";

/* ─── Presets ─── */
const PRESETS = [
  { label: "Google Ads", source: "google", medium: "cpc", icon: "G" },
  { label: "Яндекс Директ", source: "yandex", medium: "cpc", icon: "Я" },
  { label: "ВКонтакте", source: "vk", medium: "social", icon: "V" },
  { label: "Telegram", source: "telegram", medium: "social", icon: "T" },
  { label: "MyTarget", source: "mytarget", medium: "cpc", icon: "M" },
  { label: "Email", source: "email", medium: "email", icon: "@" },
];

const PRESET_COLORS: Record<string, string> = {
  "Google Ads": "border-blue-500/30 hover:border-blue-500/60 text-blue-500",
  "Яндекс Директ": "border-yellow-500/30 hover:border-yellow-500/60 text-yellow-600",
  "ВКонтакте": "border-sky-500/30 hover:border-sky-500/60 text-sky-500",
  "Telegram": "border-cyan-500/30 hover:border-cyan-500/60 text-cyan-500",
  "MyTarget": "border-red-500/30 hover:border-red-500/60 text-red-500",
  "Email": "border-purple-500/30 hover:border-purple-500/60 text-purple-500",
};

/* ─── Dynamic variables reference ─── */
const VARIABLES: Record<string, { name: string; desc: string }[]> = {
  "Google Ads": [
    { name: "{campaignid}", desc: "ID кампании" },
    { name: "{adgroupid}", desc: "ID группы объявлений" },
    { name: "{keyword}", desc: "Ключевое слово" },
    { name: "{matchtype}", desc: "Тип соответствия (e/p/b)" },
    { name: "{device}", desc: "Устройство (m/t/c)" },
    { name: "{network}", desc: "Сеть (g/s/d)" },
    { name: "{creative}", desc: "ID объявления" },
    { name: "{gclid}", desc: "Google Click ID" },
  ],
  "Яндекс Директ": [
    { name: "{campaign_id}", desc: "ID кампании" },
    { name: "{campaign_name}", desc: "Название кампании" },
    { name: "{ad_id}", desc: "ID объявления" },
    { name: "{keyword}", desc: "Ключевая фраза" },
    { name: "{phrase_id}", desc: "ID фразы" },
    { name: "{region_name}", desc: "Регион показа" },
    { name: "{source_type}", desc: "Тип площадки (search/context)" },
    { name: "{position_type}", desc: "Позиция (premium/other)" },
  ],
  "ВКонтакте": [
    { name: "{campaign_id}", desc: "ID кампании" },
    { name: "{ad_id}", desc: "ID объявления" },
    { name: "{platform}", desc: "Платформа (0=VK, 1=сеть)" },
    { name: "{age}", desc: "Возраст пользователя" },
    { name: "{gender}", desc: "Пол (1=ж, 2=м)" },
    { name: "{random}", desc: "Случайное число" },
  ],
  "MyTarget": [
    { name: "{{campaign_id}}", desc: "ID кампании" },
    { name: "{{banner_id}}", desc: "ID баннера" },
    { name: "{{geo}}", desc: "Регион" },
    { name: "{{gender}}", desc: "Пол" },
    { name: "{{age}}", desc: "Возраст" },
    { name: "{{random}}", desc: "Случайное число" },
  ],
};

/* ─── Transliteration ─── */
const TRANSLIT_MAP: Record<string, string> = {
  а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"y",к:"k",
  л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",
  ч:"ch",ш:"sh",щ:"shch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya"," ":"_",
};
const translit = (s: string) => s.toLowerCase().split("").map(c => TRANSLIT_MAP[c] ?? c).join("");

export default function UTMBuilder() {
  const [url, setUrl] = useState("");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [term, setTerm] = useState("");
  const [doTranslit, setDoTranslit] = useState(false);
  const [shortenType, setShortenType] = useState<"none" | "isgd">("none");
  const [shortened, setShortened] = useState("");
  const [shortening, setShortening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState("");
  const [varTab, setVarTab] = useState("Google Ads");
  const [showVars, setShowVars] = useState(false);

  // History from localStorage
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("utm_history") || "[]"); } catch { return []; }
  });

  const t = useCallback((s: string) => doTranslit ? translit(s) : s, [doTranslit]);

  const result = useMemo(() => {
    if (!url) return "";
    const params = new URLSearchParams();
    if (source) params.set("utm_source", t(source));
    if (medium) params.set("utm_medium", t(medium));
    if (campaign) params.set("utm_campaign", t(campaign));
    if (content) params.set("utm_content", t(content));
    if (term) params.set("utm_term", t(term));
    const sep = url.includes("?") ? "&" : "?";
    return params.toString() ? `${url}${sep}${params.toString()}` : url;
  }, [url, source, medium, campaign, content, term, t]);

  const applyPreset = (p: typeof PRESETS[0]) => {
    setSource(p.source);
    setMedium(p.medium);
    setActivePreset(p.label);
    setShortened("");
  };

  const copyToClipboard = async () => {
    const text = shortened || result;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    // Save to history
    const next = [text, ...history.filter(h => h !== text)].slice(0, 20);
    setHistory(next);
    localStorage.setItem("utm_history", JSON.stringify(next));
  };

  const shortenUrl = async () => {
    if (!result || shortenType === "none") return;
    setShortening(true);
    try {
      const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(result)}`);
      const data = await res.json();
      if (data.shorturl) setShortened(data.shorturl);
    } catch { /* ignore */ }
    setShortening(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("utm_history");
  };

  const isValid = url && source && medium && campaign;

  return (
    <div className="space-y-6">

      {/* URL */}
      <div>
        <label className="text-sm font-semibold text-text/70 mb-1.5 block">URL страницы *</label>
        <input
          type="url"
          value={url}
          onChange={e => { setUrl(e.target.value); setShortened(""); }}
          placeholder="https://example.com/page"
          className="w-full bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20"
        />
      </div>

      {/* Presets */}
      <div>
        <label className="text-sm font-semibold text-text/70 mb-2 block">Рекламная система</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all text-xs font-semibold ${
                activePreset === p.label
                  ? "border-accent bg-accent/5 text-accent"
                  : PRESET_COLORS[p.label] || "border-text/10 text-text/50"
              }`}
            >
              <span className="text-lg font-bold">{p.icon}</span>
              <span className="truncate w-full text-center text-[10px]">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* UTM params */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-text/60 mb-1 block">utm_source *</label>
          <input value={source} onChange={e => { setSource(e.target.value); setShortened(""); }} placeholder="google, yandex, vk"
            className="w-full bg-bg border border-text/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20" />
        </div>
        <div>
          <label className="text-xs font-semibold text-text/60 mb-1 block">utm_medium *</label>
          <input value={medium} onChange={e => { setMedium(e.target.value); setShortened(""); }} placeholder="cpc, cpm, email, social"
            className="w-full bg-bg border border-text/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-text/60 mb-1 block">utm_campaign *</label>
          <input value={campaign} onChange={e => { setCampaign(e.target.value); setShortened(""); }} placeholder="summer_sale_2026"
            className="w-full bg-bg border border-text/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20" />
        </div>
        <div>
          <label className="text-xs font-semibold text-text/60 mb-1 block">utm_content</label>
          <input value={content} onChange={e => { setContent(e.target.value); setShortened(""); }} placeholder="banner_1, video_ad"
            className="w-full bg-bg border border-text/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20" />
        </div>
        <div>
          <label className="text-xs font-semibold text-text/60 mb-1 block">utm_term</label>
          <input value={term} onChange={e => { setTerm(e.target.value); setShortened(""); }} placeholder="{keyword}"
            className="w-full bg-bg border border-text/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20" />
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={doTranslit} onChange={e => { setDoTranslit(e.target.checked); setShortened(""); }}
            className="w-4 h-4 rounded border-text/20 text-accent focus:ring-accent/30" />
          <span className="text-sm text-text/60">Транслитерация кириллицы</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text/60">Сократить:</span>
          <select value={shortenType} onChange={e => { setShortenType(e.target.value as any); setShortened(""); }}
            className="bg-bg border border-text/10 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text focus:outline-none">
            <option value="none">Нет</option>
            <option value="isgd">is.gd</option>
          </select>
          {shortenType !== "none" && (
            <button onClick={shortenUrl} disabled={!result || shortening}
              className="text-xs font-bold text-accent hover:text-accent/80 disabled:opacity-40 transition-colors">
              {shortening ? "..." : "Сократить"}
            </button>
          )}
        </div>
      </div>

      {/* Result */}
      <div className="bg-text/[0.03] border border-text/10 rounded-2xl p-4">
        <label className="text-xs font-semibold text-text/50 mb-2 block">Готовая ссылка</label>
        <textarea
          readOnly
          value={shortened || result}
          rows={3}
          className="w-full bg-transparent text-sm text-text font-mono resize-none focus:outline-none break-all"
          placeholder="Заполните поля выше..."
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={copyToClipboard}
            disabled={!result}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              copied
                ? "bg-teal/10 text-teal border border-teal/20"
                : "bg-accent text-white hover:bg-accent/90 shadow-md shadow-accent/20"
            } disabled:opacity-30`}
          >
            {copied ? "Скопировано!" : "Копировать"}
          </button>
          <button
            onClick={() => result && window.open(result, "_blank")}
            disabled={!isValid}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-text/10 text-text/50 hover:text-text/70 hover:border-text/20 transition-all disabled:opacity-30"
          >
            Открыть
          </button>
        </div>
      </div>

      {/* Dynamic variables reference */}
      <div className="border border-text/10 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowVars(!showVars)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-text/60 hover:text-text/80 transition-colors"
        >
          <span>Динамические переменные</span>
          <svg className={`w-4 h-4 transition-transform ${showVars ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showVars && (
          <div className="px-4 pb-4">
            <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar">
              {Object.keys(VARIABLES).map(tab => (
                <button key={tab} onClick={() => setVarTab(tab)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    varTab === tab ? "bg-accent text-white" : "bg-text/[0.04] text-text/50 hover:text-text/70"
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text/40">
                  <th className="text-left py-1.5 font-semibold">Переменная</th>
                  <th className="text-left py-1.5 font-semibold">Описание</th>
                </tr>
              </thead>
              <tbody>
                {VARIABLES[varTab]?.map(v => (
                  <tr key={v.name} className="border-t border-text/5">
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => {
                          // Insert into the focused UTM field (campaign/content/term)
                          navigator.clipboard.writeText(v.name);
                        }}
                        className="font-mono text-accent hover:underline cursor-pointer"
                        title="Скопировать"
                      >
                        {v.name}
                      </button>
                    </td>
                    <td className="py-2 text-text/50">{v.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text/40">История ({history.length})</span>
            <button onClick={clearHistory} className="text-xs text-text/30 hover:text-text/50 transition-colors">Очистить</button>
          </div>
          <div className="space-y-1.5">
            {history.slice(0, 5).map((h, i) => (
              <div key={i} className="flex items-center gap-2 bg-text/[0.02] rounded-lg px-3 py-2">
                <span className="flex-1 text-xs text-text/50 font-mono truncate">{h}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(h); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  className="shrink-0 text-xs text-accent hover:text-accent/70 font-semibold transition-colors"
                >
                  Копировать
                </button>
              </div>
            ))}
            {history.length > 5 && (
              <p className="text-[10px] text-text/20 text-center">и ещё {history.length - 5}...</p>
            )}
          </div>
        </div>
      )}

      {/* CTA banner */}
      <div className="bg-gradient-to-br from-accent/5 to-teal/5 border border-accent/10 rounded-2xl p-6 text-center">
        <p className="text-base font-bold text-text mb-1">Нужны AI-объявления для этой кампании?</p>
        <p className="text-sm text-text/50 mb-4">Создайте заголовки, тексты и офферы с помощью 65+ нейросетей</p>
        <a href="/webchat" className="inline-block bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-all shadow-md shadow-accent/20">
          Создать с помощью AI
        </a>
      </div>
    </div>
  );
}
