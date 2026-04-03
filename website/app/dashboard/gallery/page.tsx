"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SkeletonGrid } from "@/components/Skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

interface Gen {
  id: string; type: string; model: string; prompt: string;
  result_url: string | null; result_text: string | null;
  metadata: any; is_favorite: boolean; cost: number | null;
  project_id: string | null; created_at: string | null;
}

const TYPES = [
  { id: "", label: "Все" },
  { id: "image", label: "Картинки" },
  { id: "video", label: "Видео" },
  { id: "audio", label: "Аудио" },
  { id: "3d", label: "3D" },
  { id: "text", label: "Текст" },
];

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} ч назад`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} д назад`;
  return new Date(dateStr).toLocaleDateString("ru");
}

export default function GalleryPage() {
  const [gens, setGens] = useState<Gen[]>([]);
  const [type, setType] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Gen | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const getAuth = () => {
    try { const s = localStorage.getItem("stone_auth"); return s ? JSON.parse(s) : null; } catch { return null; }
  };

  const fetchGens = useCallback(async (p: number, append: boolean = false) => {
    const auth = getAuth();
    if (!auth?.token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (type) params.set("type", type);
      if (favOnly) params.set("is_favorite", "true");
      const res = await fetch(`${API_URL}/api/generations/?${params}`, { headers: { Authorization: `Bearer ${auth.token}` } });
      const data = await res.json();
      setGens(prev => append ? [...prev, ...(data.generations || [])] : (data.generations || []));
      setTotalPages(data.pages || 1);
    } catch {}
    setLoading(false);
  }, [type, favOnly]);

  useEffect(() => { setPage(1); fetchGens(1); }, [type, favOnly]);

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && page < totalPages && !loading) {
        const next = page + 1;
        setPage(next);
        fetchGens(next, true);
      }
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, totalPages, loading, fetchGens]);

  const toggleFav = async (id: string) => {
    const auth = getAuth();
    if (!auth?.token) return;
    const res = await fetch(`${API_URL}/api/generations/${id}/favorite`, { method: "POST", headers: { Authorization: `Bearer ${auth.token}` } });
    if (res.ok) {
      const data = await res.json();
      setGens(prev => prev.map(g => g.id === id ? { ...g, is_favorite: data.is_favorite } : g));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, is_favorite: data.is_favorite } : null);
    }
  };

  const deleteGen = async (id: string) => {
    if (!confirm("Удалить генерацию?")) return;
    const auth = getAuth();
    if (!auth?.token) return;
    await fetch(`${API_URL}/api/generations/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${auth.token}` } });
    setGens(prev => prev.filter(g => g.id !== id));
    setSelected(null);
  };

  const auth = getAuth();
  if (!auth) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <p className="text-text/50">Войдите для просмотра галереи</p>
      <a href="/webchat" className="bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm">Войти</a>
    </div>
  );

  return (
    <div className="pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <h1 className="text-xl sm:text-2xl font-extrabold text-text mb-6">Мои генерации</h1>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${type === t.id ? "bg-accent text-white" : "bg-text/[0.04] text-text/50 hover:text-text/70"}`}>
              {t.label}
            </button>
          ))}
          <button onClick={() => setFavOnly(!favOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ml-2 ${favOnly ? "bg-red-500/10 text-red-500" : "bg-text/[0.04] text-text/30"}`}>
            {favOnly ? "❤️ Избранное" : "♡ Избранное"}
          </button>
        </div>

        {/* Grid */}
        {gens.length === 0 && loading ? (
          <SkeletonGrid cols={4} count={8} aspectSquare />
        ) : gens.length === 0 && !loading ? (
          <div className="text-center py-20 bg-text/[0.02] border border-text/5 rounded-2xl">
            <span className="text-5xl block mb-4">🎨</span>
            <h3 className="text-lg font-bold text-text mb-2">Здесь появятся ваши генерации</h3>
            <p className="text-sm text-text/40 mb-6">Попробуйте создать первую картинку или видео!</p>
            <a href="/webchat" className="bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90">Открыть чат</a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-fadeIn">
            {gens.map(g => (
              <div key={g.id} onClick={() => setSelected(g)}
                className="relative bg-bg border border-text/5 rounded-xl overflow-hidden cursor-pointer group hover:border-text/15 transition-all">
                {/* Preview */}
                <div className="aspect-square bg-text/[0.02] flex items-center justify-center overflow-hidden">
                  {g.type === "image" && g.result_url ? (
                    <img src={g.result_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  ) : g.type === "video" ? (
                    <div className="flex flex-col items-center gap-1 text-text/20"><span className="text-3xl">🎬</span><span className="text-[10px]">{g.model}</span></div>
                  ) : g.type === "audio" ? (
                    <div className="flex flex-col items-center gap-1 text-text/20"><span className="text-3xl">🎵</span><span className="text-[10px]">{g.model}</span></div>
                  ) : g.type === "3d" ? (
                    <div className="flex flex-col items-center gap-1 text-text/20"><span className="text-3xl">🧊</span><span className="text-[10px]">{g.model}</span></div>
                  ) : (
                    <p className="text-xs text-text/30 p-3 line-clamp-6">{g.result_text || g.prompt}</p>
                  )}
                </div>
                {/* Info */}
                <div className="p-2.5">
                  <p className="text-[10px] text-text/30 truncate">{g.prompt}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-text/20">{g.model}</span>
                    <span className="text-[9px] text-text/20">{timeAgo(g.created_at)}</span>
                  </div>
                </div>
                {/* Favorite button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFav(g.id); }}
                  className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all ${g.is_favorite ? "bg-red-500/20 text-red-500" : "bg-black/30 text-white/50 opacity-0 group-hover:opacity-100"}`}
                >
                  {g.is_favorite ? "❤️" : "♡"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        <div ref={loaderRef} className="h-10 flex items-center justify-center">
          {loading && <div className="flex items-center gap-2 text-text/20 text-sm"><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Загрузка...</div>}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="bg-bg rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Preview */}
            <div className="relative">
              {selected.type === "image" && selected.result_url ? (
                <img src={selected.result_url} alt="" className="w-full max-h-[50vh] object-contain bg-black/10" />
              ) : selected.type === "video" && selected.result_url ? (
                <video src={selected.result_url} controls className="w-full max-h-[50vh]" />
              ) : selected.type === "audio" && selected.result_url ? (
                <div className="p-8 text-center"><audio src={selected.result_url} controls className="w-full" /></div>
              ) : (
                <div className="p-6 max-h-[40vh] overflow-y-auto"><p className="text-sm text-text/70 whitespace-pre-wrap">{selected.result_text || selected.prompt}</p></div>
              )}
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur rounded-full flex items-center justify-center text-white/60 hover:text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Info */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs font-bold bg-text/[0.04] text-text/50 px-2 py-0.5 rounded">{selected.model}</span>
                <span className="text-xs text-text/25">{selected.type}</span>
                {selected.cost && <span className="text-xs text-text/25">${selected.cost.toFixed(4)}</span>}
                <span className="text-xs text-text/25 ml-auto">{timeAgo(selected.created_at)}</span>
              </div>
              <p className="text-sm text-text/60 mb-4">{selected.prompt}</p>
              <div className="flex gap-2 flex-wrap">
                {selected.result_url && (
                  <a href={selected.result_url} download target="_blank" className="px-4 py-2 rounded-xl text-xs font-bold bg-text/5 text-text/60 hover:bg-text/10 transition-colors">
                    Скачать
                  </a>
                )}
                <button onClick={() => toggleFav(selected.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${selected.is_favorite ? "bg-red-500/10 text-red-500" : "bg-text/5 text-text/60 hover:bg-text/10"}`}>
                  {selected.is_favorite ? "❤️ В избранном" : "♡ В избранное"}
                </button>
                <a href={`/webchat?prompt=${encodeURIComponent(selected.prompt)}`} className="px-4 py-2 rounded-xl text-xs font-bold bg-text/5 text-text/60 hover:bg-text/10 transition-colors">
                  🔄 Повторить
                </a>
                <button onClick={() => deleteGen(selected.id)} className="px-4 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-500/5 hover:bg-red-500/10 transition-colors ml-auto">
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
