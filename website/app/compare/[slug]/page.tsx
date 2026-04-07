import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MODELS } from "@/lib/models";
import { COMPARISONS } from "@/lib/seo-data";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

const ChatWidget = dynamic(() => import("@/components/ChatWidget"), { ssr: false });

interface Props { params: { slug: string } }

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const comp = COMPARISONS.find((c) => c.slug === params.slug);
  if (!comp) return {};
  return {
    title: comp.title,
    description: comp.description,
    alternates: { canonical: `${SITE_URL}/compare/${comp.slug}` },
    openGraph: { title: comp.title, description: comp.description, url: `${SITE_URL}/compare/${comp.slug}`, type: "article", siteName: "Stone AI" },
  };
}

const companyColor: Record<string, string> = {
  OpenAI: "#22c55e",
  Anthropic: "#f97316",
  Google: "#3b82f6",
  Meta: "#0ea5e9",
  Mistral: "#a855f7",
  DeepSeek: "#06b6d4",
  xAI: "#64748b",
  Perplexity: "#6366f1",
};

const companyLogo: Record<string, string> = {
  OpenAI: "/logos/openai.svg",
  Anthropic: "/logos/anthropic.svg",
  Google: "/logos/google.svg",
  Meta: "/logos/meta.svg",
  Mistral: "/logos/mistral.svg",
  DeepSeek: "/logos/deepseek.svg",
  xAI: "/logos/xai.svg",
  Perplexity: "/logos/perplexity.svg",
};

const catEmoji: Record<string, string> = { chat: "💬", image: "🎨", video: "📹", reason: "🧠", code: "💻", search: "🔍", "3d": "🧊" };
const catLabel: Record<string, string> = { chat: "Чат", image: "Картинки", video: "Видео", reason: "Reasoning", code: "Код", search: "Поиск", "3d": "3D" };

function ModelCard({ id, side }: { id: string; side: "left" | "right" }) {
  const m = MODELS.find((x) => x.id === id);
  if (!m) return null;
  const color = companyColor[m.company] || "#C4623D";
  const logo = companyLogo[m.company];
  return (
    <div className="relative rounded-2xl border border-text/5 overflow-hidden transition-all hover:border-text/10 hover:shadow-lg">
      {/* Gradient header */}
      <div className="px-6 pt-5 pb-4" style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)` }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${color}18`, color }}>{m.company}</span>
          {m.tier === "free" && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal/15 text-teal">Бесплатно</span>}
        </div>
        <div className="flex items-center gap-3">
          {logo && <img src={logo} alt="" className="w-8 h-8 rounded-lg opacity-70 dark:invert" />}
          <h3 className="text-xl font-extrabold text-text">{m.name}</h3>
        </div>
      </div>
      {/* Body */}
      <div className="bg-bg px-6 py-5">
        <p className="text-sm text-text/50 mb-4 leading-relaxed">{m.description}</p>
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-text/[0.03] rounded-xl p-2.5 text-center">
            <div className="text-[9px] text-text/30 font-semibold uppercase">Контекст</div>
            <div className="text-sm font-extrabold text-text/80 mt-0.5">{m.context || "—"}</div>
          </div>
          <div className="bg-text/[0.03] rounded-xl p-2.5 text-center">
            <div className="text-[9px] text-text/30 font-semibold uppercase">Тип</div>
            <div className="text-sm font-extrabold text-text/80 mt-0.5">{catEmoji[m.category]} {catLabel[m.category]}</div>
          </div>
          <div className="bg-text/[0.03] rounded-xl p-2.5 text-center">
            <div className="text-[9px] text-text/30 font-semibold uppercase">Цена</div>
            <div className="text-sm font-extrabold text-text/80 mt-0.5">{m.tier === "free" ? "FREE" : `$${m.pricePerMillion}`}</div>
          </div>
        </div>
        {/* Strengths */}
        {m.strengths && (
          <div className="flex flex-wrap gap-1.5">
            {m.strengths.map((s) => (
              <span key={s} className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${side === "left" ? "bg-accent/10 text-accent" : "bg-teal/10 text-teal"}`}>{s}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComparePage({ params }: Props) {
  const comp = COMPARISONS.find((c) => c.slug === params.slug);
  if (!comp) notFound();

  const m1 = MODELS.find((x) => x.id === comp.model1);
  const m2 = MODELS.find((x) => x.id === comp.model2);

  const faqItems = [
    { q: `Какая модель лучше: ${m1?.name} или ${m2?.name}?`, a: comp.verdict },
    { q: "Можно ли попробовать обе модели бесплатно?", a: "Да, Stone AI даёт 15 бесплатных запросов в день к быстрым моделям. Зарегистрируйтесь и попробуйте обе модели." },
    { q: "Сколько стоит подписка?", a: "Подписка Start — 390₽/мес (20+ моделей). Pro — 890₽/мес (все 65+ моделей). Elite — 1990₽/мес (максимум)." },
  ];

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Article", headline: comp.h1, description: comp.description,
    datePublished: "2026-04-07", dateModified: "2026-04-07",
    author: { "@type": "Organization", name: "Stone AI", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Stone AI", url: SITE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/compare/${comp.slug}` },
  };
  const faqJsonLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs items={[{ label: "Сравнения", href: "/compare" }, { label: comp.h1 }]} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="text-3xl md:text-5xl font-extrabold text-text mb-4 leading-tight">{comp.h1}</h1>
        <p className="text-lg text-text/50 mb-12 max-w-2xl">{comp.description}</p>

        {/* VS badge */}
        <div className="flex items-center justify-center mb-6">
          <div className="h-px flex-1 bg-text/[0.06]" />
          <div className="mx-4 w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="text-accent font-extrabold text-sm">VS</span>
          </div>
          <div className="h-px flex-1 bg-text/[0.06]" />
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-14">
          <ModelCard id={comp.model1} side="left" />
          <ModelCard id={comp.model2} side="right" />
        </div>

        {/* Table */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Сравнительная таблица</h2>
          <div className="bg-bg rounded-2xl border border-text/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-text/5">
                  <th className="text-left px-5 py-3 text-text/30 font-semibold text-xs uppercase tracking-wider">Параметр</th>
                  <th className="text-center px-5 py-3 text-text font-bold">{m1?.name}</th>
                  <th className="text-center px-5 py-3 text-text font-bold">{m2?.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text/[0.04]">
                <tr><td className="px-5 py-3 text-text/40">Компания</td><td className="px-5 py-3 text-center font-medium text-text/70">{m1?.company}</td><td className="px-5 py-3 text-center font-medium text-text/70">{m2?.company}</td></tr>
                <tr><td className="px-5 py-3 text-text/40">Контекст</td><td className="px-5 py-3 text-center font-medium text-text/70">{m1?.context || "—"}</td><td className="px-5 py-3 text-center font-medium text-text/70">{m2?.context || "—"}</td></tr>
                <tr><td className="px-5 py-3 text-text/40">Цена / 1M</td><td className="px-5 py-3 text-center font-medium text-text/70">${m1?.pricePerMillion}</td><td className="px-5 py-3 text-center font-medium text-text/70">${m2?.pricePerMillion}</td></tr>
                <tr><td className="px-5 py-3 text-text/40">Доступ</td><td className="px-5 py-3 text-center font-medium text-text/70">{m1?.tier === "free" ? "Бесплатно" : "Подписка"}</td><td className="px-5 py-3 text-center font-medium text-text/70">{m2?.tier === "free" ? "Бесплатно" : "Подписка"}</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Для каких задач подходят</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-bg rounded-2xl border-2 border-accent/15 p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-accent/30" />
              <h3 className="font-extrabold text-text mb-4 flex items-center gap-2">
                {companyLogo[m1?.company || ""] && <img src={companyLogo[m1?.company || ""]} alt="" className="w-5 h-5 rounded opacity-70 dark:invert" />}
                {m1?.name}
              </h3>
              <ul className="space-y-3">
                {comp.useCases.model1.map((uc) => (
                  <li key={uc} className="flex items-center gap-3 text-sm text-text/60">
                    <span className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </span>
                    {uc}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-bg rounded-2xl border-2 border-teal/15 p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal to-teal/30" />
              <h3 className="font-extrabold text-text mb-4 flex items-center gap-2">
                {companyLogo[m2?.company || ""] && <img src={companyLogo[m2?.company || ""]} alt="" className="w-5 h-5 rounded opacity-70 dark:invert" />}
                {m2?.name}
              </h3>
              <ul className="space-y-3">
                {comp.useCases.model2.map((uc) => (
                  <li key={uc} className="flex items-center gap-3 text-sm text-text/60">
                    <span className="w-6 h-6 rounded-lg bg-teal/10 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </span>
                    {uc}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Verdict */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-4">Вердикт</h2>
          <div className="bg-gradient-to-br from-accent/8 via-teal/5 to-accent/3 rounded-2xl p-8 border border-accent/10 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-5xl opacity-10 select-none">⚖️</div>
            <p className="text-text/70 text-base leading-relaxed relative z-10">{comp.verdict}</p>
            <div className="mt-5 flex gap-3 relative z-10">
              <Link href="/dashboard/chat" className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                Попробовать оба <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link href="/pricing" className="text-xs font-bold text-text/30 hover:text-text/50 flex items-center gap-1">
                Тарифы
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Частые вопросы</h2>
          <div className="space-y-3">
            {faqItems.map((f) => (
              <details key={f.q} className="bg-bg rounded-xl border border-text/5 group">
                <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-text/80 list-none flex items-center justify-between">
                  {f.q}
                  <svg className="w-4 h-4 text-text/20 group-open:rotate-180 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <p className="px-5 pb-4 text-sm text-text/50 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Try it */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-4">Попробуйте прямо сейчас</h2>
          <ChatWidget placeholder={`Спросите ${m1?.name || "AI"} или ${m2?.name || "AI"} что-нибудь`} />
        </section>

        {/* CTA */}
        <section className="bg-dark text-white rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-xl font-extrabold mb-3">65+ моделей в одном чате</h2>
          <p className="text-white/40 text-sm mb-6">15 бесплатных запросов в день. Без карты. Без VPN.</p>
          <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-xl hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25">
            Открыть полный чат
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </section>

        {/* Related */}
        <section className="mt-14">
          <h2 className="text-lg font-bold text-text mb-4">Другие сравнения</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {COMPARISONS.filter((c) => c.slug !== comp.slug).slice(0, 6).map((c) => (
              <Link key={c.slug} href={`/compare/${c.slug}`} className="bg-bg rounded-xl border border-text/5 px-4 py-3 text-sm font-medium text-text/60 hover:border-accent/20 hover:text-accent transition-colors">
                {c.h1.replace(/ — .*/, "")}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
