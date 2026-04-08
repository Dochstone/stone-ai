"use client";

import { useState, useEffect } from "react";
import { getAuth } from "@/lib/auth";
import { MODELS } from "@/lib/models";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

interface Bot {
  id: number;
  name: string;
  description: string;
  system_prompt: string;
  model_id: string;
  avatar_emoji: string;
  is_public: boolean;
  usage_count: number;
  created_at: string | null;
}

const EMOJI_OPTIONS = ["🤖", "💬", "🧠", "📚", "✍️", "🎯", "🔬", "💡", "🎓", "🛠️", "📊", "🌐"];

export default function BotsPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [publicBots, setPublicBots] = useState<Bot[]>([]);
  const [tab, setTab] = useState<"my" | "public">("my");
  const [editing, setEditing] = useState<Bot | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", system_prompt: "", model_id: "gpt-4o-mini", avatar_emoji: "🤖", is_public: false });
  const [loading, setLoading] = useState(false);
  const auth = getAuth();

  const fetchBots = async () => {
    if (!auth) return;
    const res = await fetch(`${API_URL}/api/bots`, { headers: { Authorization: `Bearer ${auth.token}` } });
    if (res.ok) { const d = await res.json(); setBots(d.bots); }
  };

  const fetchPublic = async () => {
    const res = await fetch(`${API_URL}/api/bots/public`);
    if (res.ok) { const d = await res.json(); setPublicBots(d.bots); }
  };

  useEffect(() => { fetchBots(); fetchPublic(); }, []);

  const save = async () => {
    if (!auth || !form.name.trim() || !form.system_prompt.trim()) return;
    setLoading(true);
    try {
      const res = editing
        ? await fetch(`${API_URL}/api/bots/${editing.id}`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })
        : await fetch(`${API_URL}/api/bots`, {
            method: "POST",
            headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Ошибка" }));
        alert(typeof err.detail === "string" ? err.detail : "Ошибка сохранения");
        setLoading(false);
        return;
      }
      setEditing(null);
      setCreating(false);
      setForm({ name: "", description: "", system_prompt: "", model_id: "gpt-4o-mini", avatar_emoji: "🤖", is_public: false });
      fetchBots();
    } catch { alert("Ошибка сети"); }
    setLoading(false);
  };

  const deleteBot = async (id: number) => {
    if (!auth || !confirm("Удалить бота?")) return;
    await fetch(`${API_URL}/api/bots/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${auth.token}` } });
    fetchBots();
  };

  const startChat = (bot: Bot) => {
    sessionStorage.setItem("stone_bot_config", JSON.stringify({ id: bot.id, name: bot.name, system_prompt: bot.system_prompt, model_id: bot.model_id, avatar_emoji: bot.avatar_emoji }));
    window.location.href = "/dashboard/chat";
  };

  const openEdit = (bot: Bot) => {
    setForm({ name: bot.name, description: bot.description, system_prompt: bot.system_prompt, model_id: bot.model_id, avatar_emoji: bot.avatar_emoji, is_public: bot.is_public });
    setEditing(bot);
    setCreating(true);
  };

  if (!auth) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-text/40">Войдите чтобы создавать ботов</p>
      <a href="/profile" className="text-accent font-bold hover:underline mt-2 inline-block">Войти</a>
    </div>
  );

  return (
    <div className="pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text">Конструктор ботов</h1>
            <p className="text-sm text-text/40 mt-1">Создавайте AI-ботов с персональными инструкциями</p>
          </div>
          <button
            onClick={() => { setCreating(true); setEditing(null); setForm({ name: "", description: "", system_prompt: "", model_id: "gpt-4o-mini", avatar_emoji: "🤖", is_public: false }); }}
            className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 4v16m8-8H4" /></svg>
            Создать
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-text/[0.04] rounded-xl p-1">
          <button onClick={() => setTab("my")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "my" ? "bg-bg text-text shadow-sm" : "text-text/40"}`}>
            Мои боты ({bots.length})
          </button>
          <button onClick={() => setTab("public")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "public" ? "bg-bg text-text shadow-sm" : "text-text/40"}`}>
            Публичные ({publicBots.length})
          </button>
        </div>

        {/* Create/Edit form */}
        {creating && (
          <div className="bg-white rounded-2xl border border-text/5 p-5 mb-6">
            <h3 className="text-base font-bold text-text mb-4">{editing ? "Редактировать бота" : "Новый бот"}</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                {/* Avatar */}
                <div>
                  <label className="text-[10px] font-bold text-text/30 uppercase tracking-wider">Аватар</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {EMOJI_OPTIONS.map(e => (
                      <button key={e} onClick={() => setForm(f => ({ ...f, avatar_emoji: e }))}
                        className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${form.avatar_emoji === e ? "bg-accent/10 ring-2 ring-accent/30" : "bg-text/[0.04] hover:bg-text/[0.08]"}`}
                      >{e}</button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-text/30 uppercase tracking-wider">Имя бота</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Переводчик, Копирайтер, Ассистент..."
                      className="w-full mt-1 bg-bg border border-text/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text/30 uppercase tracking-wider">Описание</label>
                    <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Короткое описание для каталога"
                      className="w-full mt-1 bg-bg border border-text/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text/30 uppercase tracking-wider">Системный промпт</label>
                <textarea value={form.system_prompt} onChange={e => setForm(f => ({ ...f, system_prompt: e.target.value }))}
                  placeholder="Ты профессиональный переводчик. Переводи текст с русского на английский, сохраняя тон и стиль..."
                  rows={4}
                  className="w-full mt-1 bg-bg border border-text/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30 resize-none" />
                <p className="text-[10px] text-text/25 mt-1">{form.system_prompt.length}/5000</p>
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-text/30 uppercase tracking-wider">Модель</label>
                  <select value={form.model_id} onChange={e => setForm(f => ({ ...f, model_id: e.target.value }))}
                    className="w-full mt-1 bg-bg border border-text/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30">
                    {MODELS.filter(m => (m.category === "chat" || m.category === "reason" || m.category === "code") && m.tier === "free").map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.company})</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 pb-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
                    className="w-4 h-4 rounded accent-accent" />
                  <span className="text-xs text-text/50">Публичный</span>
                </label>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={save} disabled={loading || !form.name.trim() || !form.system_prompt.trim()}
                  className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-accent/90 transition-colors disabled:opacity-40">
                  {loading ? "Сохранение..." : editing ? "Сохранить" : "Создать бота"}
                </button>
                <button onClick={() => { setCreating(false); setEditing(null); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-text/40 hover:bg-text/[0.04] transition-colors">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bot list */}
        {tab === "my" ? (
          bots.length === 0 && !creating ? (
            <div className="py-12 bg-text/[0.02] border border-text/5 rounded-2xl">
              <div className="text-center px-6">
                <img src="/mascots/stone-mascot-chat.png" alt="Stone" width="72" height="72" className="mx-auto mb-3" />
                <h3 className="text-lg font-bold text-text mb-2">Создайте своего AI-бота</h3>
                <p className="text-sm text-text/40 mb-5 max-w-md mx-auto">
                  Задайте инструкции, загрузите базу знаний (PDF/TXT) — бот будет отвечать по вашим данным.
                  Подключите к Telegram или встройте на сайт.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-6 mb-5 max-w-lg mx-auto">
                <div className="bg-white rounded-xl p-3 text-center border border-text/5">
                  <span className="text-xl block mb-1">📄</span>
                  <span className="text-[11px] text-text/50">База знаний из PDF</span>
                </div>
                <div className="bg-white rounded-xl p-3 text-center border border-text/5">
                  <span className="text-xl block mb-1">🤖</span>
                  <span className="text-[11px] text-text/50">Telegram-бот</span>
                </div>
                <div className="bg-white rounded-xl p-3 text-center border border-text/5">
                  <span className="text-xl block mb-1">🌐</span>
                  <span className="text-[11px] text-text/50">Виджет на сайт</span>
                </div>
              </div>
              <div className="text-center">
                <button onClick={() => setCreating(true)} className="bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90">
                  Создать первого бота
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {bots.map(bot => (
                <div key={bot.id} className="bg-white rounded-2xl border border-text/5 p-4 flex items-center gap-4 hover:border-accent/15 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl shrink-0">{bot.avatar_emoji}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-text truncate">{bot.name}</h3>
                    <p className="text-xs text-text/40 truncate">{bot.description || bot.system_prompt.slice(0, 80)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-text/25">{MODELS.find(m => m.id === bot.model_id)?.name || bot.model_id}</span>
                      {bot.is_public && <span className="text-[10px] bg-teal/10 text-teal px-1.5 py-0.5 rounded font-medium">Публичный</span>}
                      {bot.is_public && (
                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`<script src="https://stoneai.ru/widget.js" data-bot-id="${bot.id}"><\/script>`); alert("Код виджета скопирован!"); }}
                          className="text-[10px] text-accent hover:underline cursor-pointer">Виджет</button>
                      )}
                      <button onClick={async (e) => {
                        e.stopPropagation();
                        const token = prompt("Вставьте токен от @BotFather:");
                        if (!token || !auth) return;
                        const res = await fetch(`${API_URL}/api/telegram-bots/connect`, {
                          method: "POST",
                          headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
                          body: JSON.stringify({ bot_id: bot.id, bot_token: token }),
                        });
                        if (res.ok) {
                          const d = await res.json();
                          alert(`Telegram-бот @${d.username} подключён!`);
                        } else {
                          const err = await res.json().catch(() => ({ detail: "Ошибка" }));
                          alert(typeof err.detail === "string" ? err.detail : "Ошибка подключения");
                        }
                      }} className="text-[10px] text-[#2AABEE] hover:underline cursor-pointer">Telegram</button>
                      <span className="text-[10px] text-text/20">{bot.usage_count} исп.</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => startChat(bot)} className="bg-accent text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors">Чат</button>
                    <button
                      onClick={async () => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = ".pdf,.txt,.md";
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (!file || !auth) return;
                          const fd = new FormData();
                          fd.append("bot_id", String(bot.id));
                          fd.append("file", file);
                          const res = await fetch(`${API_URL}/api/knowledge/upload`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${auth.token}` },
                            body: fd,
                          });
                          if (res.ok) {
                            const d = await res.json();
                            alert(`Загружено: ${d.filename} (${d.chunks} частей)`);
                          } else {
                            const err = await res.json().catch(() => ({ detail: "Ошибка" }));
                            alert(typeof err.detail === "string" ? err.detail : "Ошибка загрузки");
                          }
                        };
                        input.click();
                      }}
                      className="text-text/25 hover:text-accent p-2 rounded-lg hover:bg-accent/5 transition-colors"
                      title="Загрузить документ в базу знаний"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    </button>
                    <button onClick={() => openEdit(bot)} className="text-text/25 hover:text-text/60 p-2 rounded-lg hover:bg-text/[0.04] transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => deleteBot(bot.id)} className="text-text/25 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/5 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          publicBots.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-text/30 text-sm">Пока нет публичных ботов</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {publicBots.map(bot => (
                <div key={bot.id} className="bg-white rounded-2xl border border-text/5 p-4 hover:border-accent/15 transition-colors cursor-pointer" onClick={() => startChat(bot as Bot)}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-xl">{bot.avatar_emoji}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-text truncate">{bot.name}</h3>
                      <span className="text-[10px] text-text/25">{bot.usage_count} исп.</span>
                    </div>
                  </div>
                  <p className="text-xs text-text/40 line-clamp-2">{bot.description}</p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
