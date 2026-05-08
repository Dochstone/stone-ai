"use client";

import { useState, useEffect, useCallback } from "react";
import AuthFormComponent, { type AuthState } from "@/components/AuthForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";
const SITE = "https://stoneai.ru";

interface Referral {
  name: string;
  joined: string | null;
  deposited_usd: number;
  plan: string;
  requests: number;
}

interface Stats {
  referral_code: string;
  referral_count: number;
  referral_balance: number;
  referral_percent: number;
  is_partner: boolean;
  total_deposits_usd: number;
  paid_count: number;
  conversion_pct: number;
  referrals: Referral[];
}

interface CampaignRow {
  campaign: string;
  source: string;
  clicks: number;
  unique: number;
}

interface SourceRow {
  source: string;
  clicks: number;
  unique: number;
}

interface ClicksStats {
  period_days: number;
  total_clicks: number;
  unique_clicks: number;
  registrations: number;
  conversion_pct: number;
  daily: { date: string; clicks: number; unique: number }[];
  by_campaign: CampaignRow[];
  by_source: SourceRow[];
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: "Free", color: "bg-zinc-500/10 text-zinc-500" },
  mini: { label: "Start", color: "bg-blue-500/10 text-blue-500" },
  max: { label: "Pro", color: "bg-purple-500/10 text-purple-500" },
  "max-pro": { label: "Elite", color: "bg-amber-500/10 text-amber-600" },
};

const CLICKS_PERIODS = [7, 30, 90] as const;
type ClicksPeriod = (typeof CLICKS_PERIODS)[number];

export default function PartnerDashboard() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [clicks, setClicks] = useState<ClicksStats | null>(null);
  const [clicksPeriod, setClicksPeriod] = useState<ClicksPeriod>(30);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  // Link generator
  const [linkSource, setLinkSource] = useState("vk");
  const [linkMedium, setLinkMedium] = useState("cpc");
  const [linkCampaign, setLinkCampaign] = useState("");
  const [linkPage, setLinkPage] = useState("/");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("stone_auth");
      if (saved) setAuth(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  const fetchStats = useCallback(async (token: string) => {
    try {
      await fetch(`${API_URL}/api/referral/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await fetch(`${API_URL}/api/referral/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.is_partner) {
          setError("Эта страница только для партнёров. Обратитесь в поддержку @StoneAIsupport для подключения.");
          return;
        }
        setStats(data);
      } else {
        setError("Не удалось загрузить данные");
      }
    } catch {
      setError("Ошибка сети");
    }
  }, []);

  const fetchClicks = useCallback(async (token: string, days: ClicksPeriod) => {
    try {
      const res = await fetch(`${API_URL}/api/referral/clicks?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setClicks(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (auth?.token) fetchStats(auth.token);
  }, [auth?.token, fetchStats]);

  useEffect(() => {
    if (auth?.token) fetchClicks(auth.token, clicksPeriod);
  }, [auth?.token, clicksPeriod, fetchClicks]);

  const generateLink = () => {
    if (!stats?.referral_code) return "";
    const params = new URLSearchParams();
    params.set("ref", stats.referral_code);
    if (linkSource) params.set("utm_source", linkSource);
    if (linkMedium) params.set("utm_medium", linkMedium);
    if (linkCampaign) params.set("utm_campaign", linkCampaign);
    const page = linkPage.startsWith("/") ? linkPage : `/${linkPage}`;
    return `${SITE}${page}?${params.toString()}`;
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  if (!loaded) return null;
  if (!auth) return <AuthFormComponent onAuth={setAuth} subtitle="Partner Dashboard" />;

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="bg-surface rounded-2xl border border-text/5 p-8 max-w-md text-center">
          <p className="text-2xl mb-3">🔒</p>
          <p className="text-text/60 text-sm">{error}</p>
          <a href="https://t.me/StoneAIsupport" target="_blank" rel="noopener noreferrer"
            className="inline-block mt-4 bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors">
            Написать в поддержку
          </a>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-text/30 text-sm">Загрузка...</p>
      </div>
    );
  }

  const link = generateLink();

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-surface border-b border-text/5">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-lg font-extrabold text-text">Stone AI</a>
            <span className="bg-accent/10 text-accent text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">Партнёр</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/dashboard/chat" className="text-xs text-text/40 hover:text-text transition-colors">Чат</a>
            <button
              onClick={() => { localStorage.removeItem("stone_auth"); setAuth(null); }}
              className="text-xs text-text/30 hover:text-red-500 transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          <KPI label="Ваш %" value={`${stats.referral_percent}%`} accent />
          <KPI label="Кликов" value={(clicks?.total_clicks ?? 0).toLocaleString("ru-RU")} hint={`${clicksPeriod}д`} />
          <KPI label="Уникальных" value={(clicks?.unique_clicks ?? 0).toLocaleString("ru-RU")} hint={`${clicksPeriod}д`} />
          <KPI label="Регистраций" value={stats.referral_count.toString()} />
          <KPI label="CR клик→рег" value={`${clicks?.conversion_pct ?? 0}%`} />
          <KPI label="Платящих" value={stats.paid_count.toString()} />
          <KPI label="Депозиты" value={`$${stats.total_deposits_usd.toFixed(2)}`} />
          <KPI label="Ваш заработок" value={`$${stats.referral_balance.toFixed(2)}`} accent />
        </div>

        {/* Referral Code */}
        <div className="bg-surface rounded-2xl border border-text/5 p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm">Ваш реферальный код</h2>
            <span className="font-mono font-bold text-accent text-lg">{stats.referral_code}</span>
          </div>
          <div className="flex gap-2">
            <input
              readOnly
              value={`${SITE}/?ref=${stats.referral_code}`}
              className="flex-1 bg-bg border border-text/10 rounded-xl px-4 py-2.5 text-sm text-text/60 font-mono min-w-0"
            />
            <button
              onClick={() => copy(`${SITE}/?ref=${stats.referral_code}`, "link")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm shrink-0 transition-colors ${
                copied === "link" ? "bg-emerald-500 text-white" : "bg-accent text-white hover:bg-accent/90"
              }`}
            >
              {copied === "link" ? "Скопировано!" : "Копировать"}
            </button>
          </div>
        </div>

        {/* Link Generator */}
        <div className="bg-surface rounded-2xl border border-text/5 p-6 mb-6">
          <h2 className="font-bold text-sm mb-4">Генератор UTM-ссылок</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="text-[10px] font-semibold text-text/30 uppercase tracking-wider mb-1 block">Страница</label>
              <select value={linkPage} onChange={(e) => setLinkPage(e.target.value)}
                className="w-full bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-sm">
                <option value="/">Главная</option>
                <option value="/pricing">Тарифы</option>
                <option value="/models">Модели</option>
                <option value="/webchat">Чат</option>
                <option value="/dashboard/chat">Дашборд</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-text/30 uppercase tracking-wider mb-1 block">Источник</label>
              <select value={linkSource} onChange={(e) => setLinkSource(e.target.value)}
                className="w-full bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-sm">
                <option value="vk">VK</option>
                <option value="telegram">Telegram</option>
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="google">Google</option>
                <option value="yandex">Yandex</option>
                <option value="tiktok">TikTok</option>
                <option value="other">Другое</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-text/30 uppercase tracking-wider mb-1 block">Тип</label>
              <select value={linkMedium} onChange={(e) => setLinkMedium(e.target.value)}
                className="w-full bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-sm">
                <option value="cpc">CPC (реклама)</option>
                <option value="cpm">CPM (баннер)</option>
                <option value="social">Social (пост)</option>
                <option value="post">Post (статья)</option>
                <option value="video">Видео</option>
                <option value="referral">Реферал</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-text/30 uppercase tracking-wider mb-1 block">Кампания</label>
              <input value={linkCampaign} onChange={(e) => setLinkCampaign(e.target.value)}
                placeholder="my_campaign"
                className="w-full bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-bg border border-text/10 rounded-xl px-4 py-2.5 text-xs text-text/50 font-mono break-all min-w-0 select-all">
              {link}
            </div>
            <button
              onClick={() => copy(link, "utm")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm shrink-0 transition-colors ${
                copied === "utm" ? "bg-emerald-500 text-white" : "bg-accent text-white hover:bg-accent/90"
              }`}
            >
              {copied === "utm" ? "Скопировано!" : "Копировать"}
            </button>
          </div>
        </div>

        {/* Clicks block */}
        <ClicksBlock data={clicks} period={clicksPeriod} onPeriod={setClicksPeriod} />

        {/* Referrals Table */}
        <div className="bg-surface rounded-2xl border border-text/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-text/5 flex items-center justify-between">
            <h2 className="font-bold text-sm">Ваши рефералы ({stats.referral_count})</h2>
            <button onClick={() => fetchStats(auth.token)}
              className="text-xs text-text/30 hover:text-accent transition-colors">
              Обновить
            </button>
          </div>

          {stats.referrals.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-text/40 text-sm mb-3">Пока 0 рефералов — это нормально, всё впереди.</p>
              <p className="text-text/30 text-xs max-w-md mx-auto">Скопируйте готовый шаблон поста для VK, Telegram или YouTube из блока «Промо-материалы» ниже и поделитесь ссылкой.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-text/[0.02] text-text/40 text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-4 text-left font-semibold">Пользователь</th>
                    <th className="py-2.5 px-4 text-left font-semibold">Регистрация</th>
                    <th className="py-2.5 px-4 text-center font-semibold">Тариф</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Депозит</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Ваш доход</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Запросов</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.referrals.map((r, i) => {
                    const plan = PLAN_LABELS[r.plan] || PLAN_LABELS.free;
                    const earn = r.deposited_usd * stats.referral_percent / 100;
                    return (
                      <tr key={i} className="border-t border-text/[0.04] hover:bg-text/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-accent/10 rounded-full flex items-center justify-center text-accent font-bold text-[10px] shrink-0">
                              {r.name[0]?.toUpperCase()}
                            </div>
                            <span className="text-text/80 font-medium truncate max-w-[120px]">{r.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-text/40 text-xs">
                          {r.joined ? new Date(r.joined).toLocaleDateString("ru-RU") : "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${plan.color}`}>
                            {plan.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {r.deposited_usd > 0 ? (
                            <span className="text-emerald-500">${r.deposited_usd.toFixed(2)}</span>
                          ) : (
                            <span className="text-text/20">$0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {earn > 0 ? (
                            <span className="text-accent">${earn.toFixed(2)}</span>
                          ) : (
                            <span className="text-text/20">$0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-text/40">
                          {r.requests > 0 ? r.requests.toLocaleString() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="mt-8 bg-surface rounded-2xl border border-text/5 p-6">
          <h2 className="font-bold text-sm mb-4">Как это работает</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { icon: "🔗", title: "Поделитесь ссылкой", desc: "Скопируйте UTM-ссылку или возьмите готовый шаблон поста" },
              { icon: "👤", title: "Пользователь регистрируется", desc: "Реферальный код применяется автоматически" },
              { icon: "💳", title: "Пользователь оплачивает", desc: "Любой депозит или подписка засчитывается" },
              { icon: "💰", title: `Вы получаете ${stats.referral_percent}%`, desc: "Зачисляется на ваш баланс мгновенно" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl mb-2">{s.icon}</div>
                <p className="font-bold text-sm mb-1">{s.title}</p>
                <p className="text-text/40 text-xs">{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-text/30 text-[11px] mt-5 text-center">
            Реферальная связь сохраняется навсегда — пока пользователь активен в Stone AI. Cookie window не нужен.
          </p>
        </div>

        {/* Withdraw */}
        <WithdrawBlock balance={stats.referral_balance} referralCode={stats.referral_code} />

        {/* Promo materials */}
        <PromoMaterials referralCode={stats.referral_code} percent={stats.referral_percent} copy={copy} copied={copied} />

        {/* Support */}
        <div className="mt-6 text-center">
          <p className="text-text/20 text-xs">
            Вопросы? <a href="https://t.me/StoneAIsupport" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">@StoneAIsupport</a>
          </p>
        </div>
      </div>
    </div>
  );
}

const WITHDRAW_MIN_USD = 10;

function WithdrawBlock({ balance, referralCode }: { balance: number; referralCode: string }) {
  const canWithdraw = balance >= WITHDRAW_MIN_USD;
  const message = encodeURIComponent(
    `Здравствуйте! Хочу запросить выплату партнёрской комиссии Stone AI.\n\nРеферальный код: ${referralCode}\nТекущий баланс: $${balance.toFixed(2)}\nЖелаемый способ выплаты (выберите): СБП / USDT TRC-20 / Telegram Stars / на баланс Stone AI\nРеквизиты: ___\n\nСпасибо!`
  );
  const tgLink = `https://t.me/StoneAIsupport?text=${message}`;

  return (
    <div className="mt-6 bg-surface rounded-2xl border border-text/5 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-sm mb-1">Вывод средств</h2>
          <p className="text-text/40 text-xs">
            Доступно к выводу: <span className="text-accent font-bold">${balance.toFixed(2)}</span>
            <span className="text-text/30"> · минимум ${WITHDRAW_MIN_USD}</span>
          </p>
        </div>
        {canWithdraw ? (
          <a
            href={tgLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors"
          >
            Запросить выплату
          </a>
        ) : (
          <button
            disabled
            className="bg-text/5 text-text/30 px-5 py-2.5 rounded-xl font-bold text-sm cursor-not-allowed"
          >
            Минимум ${WITHDRAW_MIN_USD}
          </button>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-text/40">
        <div className="bg-bg border border-text/5 rounded-lg px-3 py-2 text-center">СБП в рублях</div>
        <div className="bg-bg border border-text/5 rounded-lg px-3 py-2 text-center">USDT (TRC-20 / ERC-20)</div>
        <div className="bg-bg border border-text/5 rounded-lg px-3 py-2 text-center">Telegram Stars</div>
        <div className="bg-bg border border-text/5 rounded-lg px-3 py-2 text-center">На баланс Stone AI</div>
      </div>
      <p className="text-text/30 text-[11px] mt-3">
        Заявка отправляется в Telegram-поддержку. Зачисление обычно за 1–3 рабочих дня.
      </p>
    </div>
  );
}

const PROMO_TEMPLATES = (refLink: string, percent: number) => [
  {
    platform: "Telegram-пост",
    text: `🤖 Все нейросети в одном месте — Stone AI

GPT-5, Claude Opus 4.6, Gemini 3 Pro, Sora 2, Midjourney-аналоги, Nano Banana Pro — 65+ моделей в одной подписке.

Без VPN, оплата картой РФ, СБП или Telegram Stars.

Тарифы от 990 ₽/мес. Бесплатно — 10 запросов/день.

👉 ${refLink}`,
  },
  {
    platform: "VK-пост",
    text: `Нейросети без VPN из России — обзор Stone AI 🇷🇺

Что внутри:
• GPT-5, Claude Opus 4.6, Gemini 3 Pro
• Генерация картинок (Nano Banana Pro, Midjourney-аналоги)
• Видео через Sora 2 и Kling
• Голосовые модели и TTS
• Оплата картой РФ, СБП

Подписки от 990 ₽/мес. Бесплатный тариф — 10 запросов/день.

Регистрация 30 секунд: ${refLink}`,
  },
  {
    platform: "YouTube-описание",
    text: `📌 Stone AI — все нейросети в одном кабинете без VPN
👉 ${refLink}

В подписке:
✅ GPT-5, Claude Opus 4.6, Gemini 3 Pro
✅ Sora 2, Kling, Midjourney-аналоги
✅ Nano Banana Pro для фото
✅ Оплата картой РФ, СБП, Telegram Stars
✅ От 990 ₽/мес, бесплатный тариф навсегда

Тайм-коды:
00:00 — Что такое Stone AI
01:30 — Какие модели внутри
03:45 — Сравнение с ChatGPT Plus
05:20 — Как оплатить из России
07:00 — Реальные кейсы`,
  },
  {
    platform: "Короткий пост / Stories",
    text: `Все нейросети без VPN. GPT-5, Claude, Gemini, Sora 2, Midjourney-аналоги — в одной подписке от 990 ₽/мес. Оплата картой РФ. Старт бесплатно: ${refLink}`,
  },
  {
    platform: "Email-рассылка",
    text: `Тема: Все нейросети без VPN — обзор Stone AI

Привет!

Если работаете с нейросетями для контента, кода или маркетинга — посмотрите Stone AI. Это российский агрегатор, который собрал в одной подписке 65+ моделей: GPT-5, Claude Opus 4.6, Gemini 3 Pro, Sora 2, Nano Banana Pro и другие.

Главное:
— без VPN, оплата картой РФ или СБП
— тарифы от 990 ₽/мес против $80+/мес за прямые подписки на ChatGPT + Claude + Gemini
— бесплатный тариф навсегда — 10 запросов/день
— регистрация 30 секунд

Попробовать: ${refLink}`,
  },
];

const PROMO_LINKS = (refCode: string) => [
  { label: "Главная", url: `https://stoneai.ru/?ref=${refCode}` },
  { label: "Тарифы", url: `https://stoneai.ru/pricing?ref=${refCode}` },
  { label: "Каталог моделей", url: `https://stoneai.ru/models?ref=${refCode}` },
  { label: "Чат", url: `https://stoneai.ru/dashboard/chat?ref=${refCode}` },
  { label: "Блог", url: `https://stoneai.ru/blog?ref=${refCode}` },
  { label: "ChatGPT без VPN", url: `https://stoneai.ru/blog/chatgpt-bez-vpn-russia?ref=${refCode}` },
  { label: "Claude в России", url: `https://stoneai.ru/blog/kak-ispolzovat-claude-v-rossii?ref=${refCode}` },
  { label: "ТОП-15 нейросетей", url: `https://stoneai.ru/blog/best-neural-networks-2026?ref=${refCode}` },
];

function PromoMaterials({
  referralCode,
  percent,
  copy,
  copied,
}: {
  referralCode: string;
  percent: number;
  copy: (text: string, label: string) => void;
  copied: string;
}) {
  const refLink = `https://stoneai.ru/?ref=${referralCode}`;
  const templates = PROMO_TEMPLATES(refLink, percent);
  const links = PROMO_LINKS(referralCode);

  return (
    <div className="mt-6 bg-surface rounded-2xl border border-text/5 p-6">
      <div className="mb-5">
        <h2 className="font-bold text-sm mb-1">Промо-материалы</h2>
        <p className="text-text/40 text-xs">Готовые шаблоны постов для VK, Telegram, YouTube и email + быстрые ссылки на популярные landing-страницы.</p>
      </div>

      {/* Quick deeplinks */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold text-text/30 uppercase tracking-wider mb-2">Быстрые ссылки на страницы</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {links.map((l, i) => {
            const key = `link-${i}`;
            const isCopied = copied === key;
            return (
              <button
                key={l.label}
                onClick={() => copy(l.url, key)}
                className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                  isCopied
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                    : "bg-bg border-text/10 text-text/60 hover:border-accent/30 hover:text-text"
                }`}
                title={l.url}
              >
                <span className="block font-semibold truncate">{isCopied ? "Скопировано!" : l.label}</span>
                <span className="block text-[10px] text-text/30 truncate font-mono">{l.url.replace("https://stoneai.ru", "")}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Post templates */}
      <div>
        <p className="text-[10px] font-semibold text-text/30 uppercase tracking-wider mb-2">Шаблоны постов</p>
        <div className="space-y-3">
          {templates.map((t, i) => {
            const key = `tpl-${i}`;
            const isCopied = copied === key;
            return (
              <div key={t.platform} className="bg-bg border border-text/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-text/70">{t.platform}</p>
                  <button
                    onClick={() => copy(t.text, key)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                      isCopied ? "bg-emerald-500 text-white" : "bg-accent/10 text-accent hover:bg-accent/20"
                    }`}
                  >
                    {isCopied ? "Скопировано!" : "Копировать"}
                  </button>
                </div>
                <pre className="text-text/60 text-xs whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">{t.text}</pre>
              </div>
            );
          })}
        </div>
        <p className="text-text/30 text-[11px] mt-4">
          Подставьте свои факты, цифры и кейсы — собственный опыт работает в 3–5 раз лучше шаблона. Можно адаптировать под свою нишу.
        </p>
      </div>
    </div>
  );
}

function ClicksBlock({
  data,
  period,
  onPeriod,
}: {
  data: ClicksStats | null;
  period: ClicksPeriod;
  onPeriod: (p: ClicksPeriod) => void;
}) {
  const campaigns = data?.by_campaign ?? [];
  const sources = data?.by_source ?? [];
  const totalClicks = data?.total_clicks ?? 0;

  return (
    <div className="bg-surface rounded-2xl border border-text/5 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-text/5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-sm">Клики по вашим ссылкам</h2>
          <p className="text-text/40 text-xs mt-0.5">
            Считаем переходы по ссылкам с <span className="font-mono text-text/60">?ref={`{ваш код}`}</span>. Уникальные — по IP.
          </p>
        </div>
        <div className="flex gap-1 bg-bg border border-text/10 rounded-lg p-1">
          {CLICKS_PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => onPeriod(p)}
              className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${
                period === p ? "bg-accent text-white" : "text-text/40 hover:text-text"
              }`}
            >
              {p}д
            </button>
          ))}
        </div>
      </div>

      {totalClicks === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-3xl mb-2">🔗</p>
          <p className="text-text/40 text-sm">За {period} {period === 7 ? "дней" : "дней"} переходов по вашим ссылкам не было.</p>
          <p className="text-text/30 text-xs mt-1.5">Скопируйте ссылку из блока выше и поделитесь в соцсетях.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-px lg:bg-text/5">
          <div className="bg-surface p-4">
            <p className="text-[10px] font-semibold text-text/30 uppercase tracking-wider mb-3">По кампаниям</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text/40 text-[10px] uppercase tracking-wider">
                  <th className="text-left font-semibold pb-2">Кампания</th>
                  <th className="text-left font-semibold pb-2">Источник</th>
                  <th className="text-right font-semibold pb-2">Клики</th>
                  <th className="text-right font-semibold pb-2">Уник.</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.slice(0, 15).map((r, i) => (
                  <tr key={i} className="border-t border-text/[0.04]">
                    <td className="py-2 font-mono text-text/70 truncate max-w-[140px]" title={r.campaign}>{r.campaign}</td>
                    <td className="py-2 text-text/50">{r.source}</td>
                    <td className="py-2 text-right font-semibold">{r.clicks}</td>
                    <td className="py-2 text-right text-text/50">{r.unique}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-surface p-4">
            <p className="text-[10px] font-semibold text-text/30 uppercase tracking-wider mb-3">По источникам</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text/40 text-[10px] uppercase tracking-wider">
                  <th className="text-left font-semibold pb-2">Источник</th>
                  <th className="text-right font-semibold pb-2">Клики</th>
                  <th className="text-right font-semibold pb-2">Уник.</th>
                  <th className="text-right font-semibold pb-2">Доля</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((r, i) => {
                  const share = totalClicks > 0 ? (r.clicks / totalClicks) * 100 : 0;
                  return (
                    <tr key={i} className="border-t border-text/[0.04]">
                      <td className="py-2 text-text/70">{r.source}</td>
                      <td className="py-2 text-right font-semibold">{r.clicks}</td>
                      <td className="py-2 text-right text-text/50">{r.unique}</td>
                      <td className="py-2 text-right text-text/40">{share.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, accent, hint }: { label: string; value: string; accent?: boolean; hint?: string }) {
  return (
    <div className="bg-surface rounded-2xl border border-text/5 p-4 text-center">
      <p className={`text-xl font-extrabold ${accent ? "text-accent" : "text-text"}`}>{value}</p>
      <p className="text-[10px] text-text/30 mt-1 uppercase tracking-wider">
        {label}
        {hint && <span className="text-text/20 normal-case tracking-normal"> · {hint}</span>}
      </p>
    </div>
  );
}
