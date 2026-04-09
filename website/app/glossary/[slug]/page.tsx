import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";
import dynamic from "next/dynamic";
const ChatWidget = dynamic(() => import("@/components/ChatWidget"), { ssr: false });
import { GLOSSARY } from "@/lib/glossary";

export async function generateStaticParams() {
  return GLOSSARY.map(t => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const term = GLOSSARY.find(t => t.slug === params.slug);
  if (!term) return {};
  return {
    title: term.title,
    description: term.description,
    alternates: { canonical: `/glossary/${term.slug}` },
    openGraph: { title: term.title, description: term.description, type: "article" },
  };
}

export default function GlossaryTermPage({ params }: { params: { slug: string } }) {
  const term = GLOSSARY.find(t => t.slug === params.slug);
  if (!term) return notFound();

  const relatedTerms = term.related.map(r => GLOSSARY.find(t => t.slug === r)).filter(Boolean);

  // DefinedTerm JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term.term,
    description: term.definition,
    url: `${SITE_URL}/glossary/${term.slug}`,
    inDefinedTermSet: { "@type": "DefinedTermSet", name: "AI-глоссарий Stone AI", url: `${SITE_URL}/glossary` },
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Breadcrumbs items={[{ label: "Глоссарий", href: "/glossary" }, { label: term.term }]} />

        <h1 className="text-3xl font-extrabold text-text mt-6 mb-4">{term.title}</h1>

        {/* Definition card */}
        <div className="bg-accent/5 border border-accent/10 rounded-2xl p-6 mb-6">
          <p className="text-lg text-text leading-relaxed font-medium">{term.definition}</p>
        </div>

        {/* Details */}
        <div className="prose-like text-text/70 leading-relaxed mb-8">
          <p>{term.details}</p>
        </div>

        {/* Examples */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-text mb-3">Примеры использования</h2>
          <ul className="space-y-2">
            {term.examples.map((ex, i) => (
              <li key={i} className="flex items-start gap-2 text-text/60">
                <span className="text-accent mt-0.5">•</span>
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Related terms */}
        {relatedTerms.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-text mb-3">Связанные термины</h2>
            <div className="flex flex-wrap gap-2">
              {relatedTerms.map(rt => rt && (
                <Link key={rt.slug} href={`/glossary/${rt.slug}`}
                  className="bg-surface border border-text/[0.06] px-3 py-1.5 rounded-lg text-sm text-text/70 hover:text-accent hover:border-accent/20 transition-colors">
                  {rt.term}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-surface border border-text/[0.06] rounded-2xl p-6 text-center mb-8">
          <p className="text-sm text-text/50 mb-3">Попробуйте {term.term} в Stone AI</p>
          <Link href="/dashboard/chat" className="inline-flex bg-accent text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors">
            Открыть AI-чат →
          </Link>
        </div>

        <ChatWidget />
      </div>
    </div>
  );
}
