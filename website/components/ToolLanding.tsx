import type { ReactNode } from "react";

interface FAQ { q: string; a: string }

interface ToolLandingProps {
  badge: string;
  title: string;
  description: string;
  models: { name: string; badge: string; price: string }[];
  prompts: { emoji: string; label: string; text: string }[];
  faq: FAQ[];
  ctaText: string;
  ctaHref: string;
  children?: ReactNode;
}

export default function ToolLanding({ badge, title, description, models, prompts, faq, ctaText, ctaHref, children }: ToolLandingProps) {
  const faqJsonLd = faq.length > 0 ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) } : null;

  return (
    <div className="pt-28 pb-20 min-h-screen">
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <span className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-4">{badge}</span>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{title}</h1>
          <p className="text-text/60 max-w-2xl mx-auto mb-8">{description}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href={ctaHref} className="bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors">{ctaText}</a>
            <a href="/pricing" className="border-2 border-text/15 text-text px-6 py-3 rounded-xl font-bold text-sm hover:border-accent hover:text-accent transition-colors">Все 65+ нейросетей</a>
          </div>
        </div>

        {/* Models */}
        <div className="mb-16">
          <h2 className="text-xl font-extrabold text-center mb-6">Доступные модели</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map(m => (
              <div key={m.name} className="bg-white rounded-2xl border border-text/5 p-5 card-hover">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-text">{m.name}</h3>
                  <span className="text-[9px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-full">{m.badge}</span>
                </div>
                <p className="text-xs text-text/40">{m.price}</p>
              </div>
            ))}
          </div>
        </div>

        {children}

        {/* Prompts */}
        <div className="mb-16">
          <h2 className="text-xl font-extrabold text-center mb-6">Примеры промптов</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {prompts.map(p => (
              <div key={p.label} className="bg-white rounded-xl border border-text/5 p-4 hover:border-accent/20 transition-colors">
                <span className="text-lg mr-2">{p.emoji}</span>
                <span className="text-sm font-semibold text-text">{p.label}</span>
                <p className="text-xs text-text/40 mt-1 line-clamp-2">{p.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-xl font-extrabold text-center mb-6">Частые вопросы</h2>
          <div className="max-w-3xl mx-auto space-y-3">
            {faq.map((f, i) => (
              <details key={i} className="bg-white rounded-xl border border-text/5 group">
                <summary className="px-5 py-4 text-sm font-semibold text-text cursor-pointer list-none flex items-center justify-between">
                  {f.q}
                  <svg className="w-4 h-4 text-text/30 shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <p className="px-5 pb-4 text-sm text-text/60 leading-relaxed" dangerouslySetInnerHTML={{ __html: f.a }} />
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-accent/10 to-teal/10 rounded-2xl p-10">
          <h2 className="text-2xl font-extrabold mb-3">{ctaText}</h2>
          <p className="text-text/50 mb-6">65+ нейросетей · Карта РФ · СБП · Крипто · От 590₽/мес</p>
          <a href={ctaHref} className="bg-accent text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors inline-block">{ctaText}</a>
        </div>
      </div>
    </div>
  );
}
