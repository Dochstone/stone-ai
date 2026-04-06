"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/Skeleton";
import { getAuth, API_URL } from "@/lib/auth";

interface Product { name: string; description: string; price: string }
interface Project {
  id: string; name: string; description: string | null;
  audience: string | null; tone: string | null;
  products: Product[] | null; keywords: string[] | null;
  is_default: boolean; created_at: string | null;
}

const TONES = [
  { value: "formal", label: "Формальный" },
  { value: "friendly", label: "Дружелюбный" },
  { value: "professional", label: "Профессиональный" },
  { value: "casual", label: "Свободный" },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [limit, setLimit] = useState(1);
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [keywords, setKeywords] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    const auth = getAuth();
    if (!auth?.token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/projects/`, { headers: { Authorization: `Bearer ${auth.token}` } });
      const data = await res.json();
      setProjects(data.projects || []);
      setLimit(data.limit || 1);
      setPlan(data.plan || "free");
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const openCreate = () => {
    setEditing(null);
    setName(""); setDescription(""); setAudience(""); setTone(""); setKeywords("");
    setProducts([]);
    setShowForm(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setName(p.name);
    setDescription(p.description || "");
    setAudience(p.audience || "");
    setTone(p.tone || "");
    setKeywords((p.keywords || []).join(", "));
    setProducts(p.products || []);
    setShowForm(true);
  };

  const handleSave = async () => {
    const auth = getAuth();
    if (!auth?.token || !name.trim()) return;
    setSaving(true);
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      audience: audience.trim() || null,
      tone: tone || null,
      products: products.length > 0 ? products : null,
      keywords: keywords.trim() ? keywords.split(",").map(k => k.trim()).filter(Boolean) : null,
    };
    try {
      const url = editing ? `${API_URL}/api/projects/${editing.id}` : `${API_URL}/api/projects/`;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowForm(false);
        fetchProjects();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Ошибка");
      }
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить проект?")) return;
    const auth = getAuth();
    if (!auth?.token) return;
    await fetch(`${API_URL}/api/projects/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${auth.token}` } });
    fetchProjects();
  };

  const handleSetDefault = async (id: string) => {
    const auth = getAuth();
    if (!auth?.token) return;
    await fetch(`${API_URL}/api/projects/${id}/set-default`, { method: "POST", headers: { Authorization: `Bearer ${auth.token}` } });
    fetchProjects();
  };

  if (loading) return (
    <div className="pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-bg border border-text/5 rounded-2xl p-5 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {!getAuth() && (
          <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-text/60">Войдите, чтобы использовать все функции</p>
            <a href="/dashboard/chat" className="bg-accent text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors shrink-0">Войти</a>
          </div>
        )}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text">Мои проекты</h1>
            <p className="text-sm text-text/40 mt-1">{projects.length} из {limit >= 999 ? "∞" : limit} · тариф {plan === "max-pro" ? "Elite" : plan === "max" ? "Pro" : plan === "mini" ? "Start" : "Free"}</p>
          </div>
          <button
            onClick={openCreate}
            disabled={projects.length >= limit}
            className="bg-accent text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Создать проект
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 bg-text/[0.02] border border-text/5 rounded-2xl">
            <img src="/mascots/stone-mascot-idle.png" alt="Stone" width="100" height="100" className="mx-auto mb-4" />
            <h3 className="text-lg font-bold text-text mb-2">Добавьте свой первый бизнес</h3>
            <p className="text-sm text-text/40 mb-6 max-w-md mx-auto">AI будет учитывать контекст вашего бренда, аудиторию и тон голоса во всех ответах</p>
            <button onClick={openCreate} className="bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90">
              Создать проект
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
            {projects.map(p => (
              <div key={p.id} className={`bg-bg border rounded-2xl p-5 relative ${p.is_default ? "border-accent/30" : "border-text/5"}`}>
                {p.is_default && (
                  <span className="absolute -top-2.5 right-4 bg-accent text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full">По умолчанию</span>
                )}
                <h3 className="text-base font-bold text-text mb-1">{p.name}</h3>
                {p.description && <p className="text-xs text-text/40 line-clamp-2 mb-2">{p.description}</p>}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {p.tone && (
                    <span className="text-[10px] bg-text/[0.04] text-text/50 px-2 py-0.5 rounded">{TONES.find(t => t.value === p.tone)?.label || p.tone}</span>
                  )}
                  {p.products && p.products.length > 0 && (
                    <span className="text-[10px] bg-text/[0.04] text-text/50 px-2 py-0.5 rounded">{p.products.length} продуктов</span>
                  )}
                  {p.keywords && p.keywords.length > 0 && (
                    <span className="text-[10px] bg-text/[0.04] text-text/50 px-2 py-0.5 rounded">{p.keywords.length} ключей</span>
                  )}
                </div>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => openEdit(p)} className="text-accent hover:underline font-semibold">Редактировать</button>
                  {!p.is_default && <button onClick={() => handleSetDefault(p.id)} className="text-teal hover:underline font-semibold">Сделать основным</button>}
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline font-semibold ml-auto">Удалить</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-bg rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-3 border-b border-text/5 flex items-center justify-between">
              <h2 className="text-base font-bold">{editing ? "Редактировать проект" : "Новый проект"}</h2>
              <button onClick={() => setShowForm(false)} className="text-text/30 hover:text-text/60"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-text/60 mb-1 block">Название *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Мой бизнес"
                  className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-text/60 mb-1 block">Описание</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Чем занимается компания..." rows={2}
                  className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20 resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-text/60 mb-1 block">Целевая аудитория</label>
                <textarea value={audience} onChange={e => setAudience(e.target.value)} placeholder="Женщины 25-40, интересуются..." rows={2}
                  className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20 resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-text/60 mb-1 block">Тон голоса</label>
                <select value={tone} onChange={e => setTone(e.target.value)}
                  className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none">
                  <option value="">Не выбран</option>
                  {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-text/60 mb-1 block">Ключевые слова</label>
                <input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="маркетинг, SEO, реклама"
                  className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20" />
                <p className="text-[10px] text-text/25 mt-1">Через запятую</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-text/60">Продукты/услуги</label>
                  <button onClick={() => setProducts([...products, { name: "", description: "", price: "" }])} className="text-[10px] text-accent font-bold">+ Добавить</button>
                </div>
                {products.map((p, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={p.name} onChange={e => { const n = [...products]; n[i].name = e.target.value; setProducts(n); }} placeholder="Название"
                      className="flex-1 bg-text/[0.04] border border-text/[0.08] rounded-lg px-3 py-2 text-xs focus:outline-none" />
                    <input value={p.price} onChange={e => { const n = [...products]; n[i].price = e.target.value; setProducts(n); }} placeholder="Цена"
                      className="w-24 bg-text/[0.04] border border-text/[0.08] rounded-lg px-3 py-2 text-xs focus:outline-none" />
                    <button onClick={() => setProducts(products.filter((_, j) => j !== i))} className="text-red-400 text-xs px-1">×</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text/40 border border-text/[0.08]">Отмена</button>
              <button onClick={handleSave} disabled={!name.trim() || saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-accent hover:bg-accent/90 disabled:opacity-40 shadow-md shadow-accent/20">
                {saving ? "Сохранение..." : editing ? "Сохранить" : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
