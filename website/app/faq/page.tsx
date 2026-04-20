import type { Metadata } from "next";
import Breadcrumbs, { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { homeFaqData, FAQ_CATEGORIES, type FaqCategory } from "@/lib/faq-data";
import { tagToSlug } from "@/lib/blog";
import { SITE_URL } from "@/lib/constants";
import FaqSearch from "./FaqSearch";
import { Rocket, Sparkles, Wrench, Gem, CreditCard, Wand2, type LucideIcon } from "lucide-react";

const CAT_META: Record<FaqCategory, { Icon: LucideIcon; color: string }> = {
  start:      { Icon: Rocket,     color: "#22D3EE" },
  generation: { Icon: Sparkles,   color: "#A855F7" },
  tools:      { Icon: Wrench,     color: "#F59E0B" },
  pricing:    { Icon: Gem,        color: "#EC4899" },
  payments:   { Icon: CreditCard, color: "#10B981" },
  features:   { Icon: Wand2,      color: "#8B5CF6" },
};

export const metadata: Metadata = {
  title: "Частые вопросы (FAQ) — Stone AI",
  description:
    "Ответы на частые вопросы о Stone AI: как начать, какие модели доступны бесплатно, сколько стоят тарифы и инструменты, способы оплаты, AI-боты, агент, рекламные кампании, презентации.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ — Stone AI",
    description: "Все ответы о Stone AI в одном месте: тарифы, оплата, инструменты, модели.",
    type: "website",
  },
};

function buildFaqPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homeFaqData.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      },
    })),
  };
}

export default function FaqPage() {
  const bcItems = [{ label: "FAQ", href: "/faq" }];

  const grouped = FAQ_CATEGORIES.map((c) => ({
    ...c,
    items: homeFaqData
      .filter((f) => f.category === c.id)
      .map((f) => ({ ...f, slug: tagToSlug(f.q) })),
  })).filter((c) => c.items.length > 0);

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqPageJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(bcItems)) }}
      />
      <Breadcrumbs items={bcItems} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-8 md:mb-10">
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/15 to-teal/10 blur-2xl" aria-hidden="true" />
            <img
              src="/mascots/stone-mascot-chat.webp?v=2"
              alt="Маскот Stone AI отвечает на вопросы"
              width={176}
              height={176}
              loading="eager"
              className="relative w-full h-full object-contain drop-shadow-xl"
            />
          </div>
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            FAQ
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Частые вопросы</h1>
          <p className="text-base text-text/70 max-w-2xl mx-auto">
            Всё что нужно знать про Stone AI: тарифы, инструменты, оплата, модели. Не нашли свой вопрос —
            напишите в&nbsp;
            <a href="https://t.me/StoneAIsupport" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              Telegram-поддержку
            </a>.
          </p>
        </header>

        {/* Category chips — horizontal scroll on mobile */}
        <nav
          aria-label="Категории FAQ"
          className="-mx-4 sm:mx-auto px-4 sm:px-0 mb-8 flex gap-2 overflow-x-auto no-scrollbar sm:flex-wrap sm:justify-center snap-x snap-proximity sm:snap-none"
        >
          {grouped.map((c) => {
            const Icon = CAT_META[c.id].Icon;
            return (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                className="group shrink-0 snap-start whitespace-nowrap inline-flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-text/5 text-text/70 hover:bg-accent/10 hover:text-accent text-sm font-semibold transition-colors"
                style={{ ["--pad-c" as string]: CAT_META[c.id].color }}
              >
                <span className="glass-pad flex items-center justify-center w-7 h-7 rounded-full">
                  <Icon className="block" size={14} strokeWidth={2.4} />
                </span>
                {c.name} ({c.items.length})
              </a>
            );
          })}
        </nav>

        <FaqSearch
          items={homeFaqData.map((f) => ({
            q: f.q,
            a: f.a.replace(/<[^>]+>/g, " "),
            slug: tagToSlug(f.q),
            category: f.category,
          }))}
        />

        <div className="space-y-10">
          {grouped.map((cat) => {
            const Icon = CAT_META[cat.id].Icon;
            return (
            <section
              key={cat.id}
              id={`cat-${cat.id}`}
              className="group scroll-mt-28"
              style={{ ["--pad-c" as string]: CAT_META[cat.id].color }}
            >
              <h2 className="text-xl md:text-2xl font-extrabold mb-4 flex items-center gap-3">
                <span className="glass-pad flex items-center justify-center w-9 h-9 rounded-xl">
                  <Icon className="block" size={18} strokeWidth={2.4} />
                </span>
                {cat.name}
              </h2>
              <div className="space-y-3">
                {cat.items.map((item) => (
                  <details
                    key={item.slug}
                    id={item.slug}
                    className="group bg-surface rounded-2xl border border-text/5 overflow-hidden scroll-mt-28"
                  >
                    <summary className="p-5 cursor-pointer font-semibold text-sm text-text/85 list-none flex items-start justify-between gap-4 hover:bg-text/[0.02] transition-colors">
                      <span className="flex items-center gap-2">
                        <span aria-hidden="true" className="text-text/25 group-hover:text-accent transition-colors text-xs font-mono">#</span>
                        {item.q}
                      </span>
                      <svg
                        className="w-4 h-4 text-text/30 shrink-0 transition-transform group-open:rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div
                      className="px-5 pb-5 text-sm text-text/65 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: item.a }}
                    />
                  </details>
                ))}
              </div>
            </section>
            );
          })}
        </div>

        {/* No answer CTA */}
        <div className="mt-16 text-center bg-accent/5 border border-accent/10 rounded-2xl p-6 sm:p-8">
          <h2 className="font-extrabold text-lg mb-2">Не нашли ответ?</h2>
          <p className="text-text/60 text-sm mb-5">Напишите нам в Telegram — отвечаем в рабочее время в течение часа.</p>
          <a
            href="https://t.me/StoneAIsupport"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-accent text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors"
          >
            Открыть поддержку в Telegram →
          </a>
        </div>
      </div>
    </div>
  );
}
