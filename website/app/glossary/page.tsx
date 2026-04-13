import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { GLOSSARY, GLOSSARY_CATEGORIES } from "@/lib/glossary";

export const metadata: Metadata = {
  title: "AI-глоссарий — словарь терминов нейросетей и искусственного интеллекта",
  description: "Глоссарий AI: 50+ терминов про нейросети, LLM, GPT, промпты, токены и другие понятия. Простые объяснения на русском.",
  alternates: { canonical: "/glossary" },
  openGraph: {
    title: "AI-глоссарий Stone AI — 50+ терминов",
    description: "Словарь нейросетей: GPT, LLM, промпт, токен, Transformer и другие. Простым языком.",
  },
};

export default function GlossaryPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: "Глоссарий", href: "/glossary" }]} />
        <h1 className="text-3xl font-extrabold text-text mt-6 mb-2">AI-глоссарий</h1>
        <p className="text-text/50 mb-8">50+ терминов про нейросети и искусственный интеллект. Простые объяснения на русском языке.</p>

        {GLOSSARY_CATEGORIES.map(cat => {
          const terms = GLOSSARY.filter(t => t.category === cat.id);
          if (!terms.length) return null;
          return (
            <div key={cat.id} className="mb-8">
              <h2 className="text-xl font-bold text-text mb-4">{cat.icon} {cat.label}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {terms.map(t => (
                  <Link key={t.slug} href={`/glossary/${t.slug}`}
                    className="bg-surface rounded-xl border border-text/[0.06] p-4 hover:border-accent/20 hover:shadow-sm transition-all group">
                    <h3 className="text-sm font-bold text-text group-hover:text-accent transition-colors">{t.term}</h3>
                    <p className="text-xs text-text/40 mt-1 line-clamp-2">{t.definition}</p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
