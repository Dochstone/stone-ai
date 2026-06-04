import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { HOW_TO_GUIDES, HOW_TO_CATEGORIES } from "@/lib/how-to";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Как пользоваться нейросетями в России 2026 — пошаговые инструкции",
  description: "Пошаговые инструкции: как пользоваться ChatGPT, Midjourney, Claude, Sora, Kling и другими нейросетями из России без VPN. Доступ через Stone AI, оплата картой РФ.",
  alternates: { canonical: `${SITE_URL}/how-to` },
  openGraph: {
    title: "Как пользоваться нейросетями в России — пошаговые инструкции",
    description: "Гайды по ChatGPT, Midjourney, Claude, Sora и другим AI без VPN. Доступ через Stone AI.",
    url: `${SITE_URL}/how-to`,
    type: "website",
    siteName: "Stone AI",
  },
};

export default function HowToIndexPage() {
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: HOW_TO_GUIDES.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/how-to/${g.slug}`,
      name: g.h1,
    })),
  };

  return (
    <div className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <Breadcrumbs items={[{ label: "Как пользоваться", href: "/how-to" }]} />

        <h1 className="text-3xl md:text-5xl font-extrabold text-text mt-6 mb-4 leading-tight">
          Как пользоваться нейросетями в России — пошаговые инструкции
        </h1>
        <p className="text-lg text-text/50 mb-12 max-w-2xl">
          Гайды по ChatGPT, Midjourney, Claude, Sora, Kling и другим AI-сервисам без VPN и зарубежной карты. Все
          инструменты доступны через Stone AI на русском, с оплатой картой РФ.
        </p>

        {HOW_TO_CATEGORIES.map((cat) => {
          const guides = HOW_TO_GUIDES.filter((g) => g.category === cat.id);
          if (guides.length === 0) return null;
          return (
            <section key={cat.id} className="mb-12">
              <h2 className="text-2xl font-extrabold text-text mb-5">
                <span className="mr-2">{cat.icon}</span>
                {cat.label}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {guides.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/how-to/${g.slug}`}
                    className="bg-bg rounded-2xl border border-text/5 p-5 hover:border-accent/30 transition-colors group"
                  >
                    <h3 className="font-bold text-text mb-1 group-hover:text-accent transition-colors">
                      Как пользоваться {g.tool}
                    </h3>
                    <p className="text-sm text-text/50 line-clamp-2">{g.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
