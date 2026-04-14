import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import AuthorCard from "@/components/AuthorCard";
import { CrossLinks } from "@/components/CrossLinks";
import { AUTHORS } from "@/lib/authors";
import { buildItemList } from "@/lib/schema";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Авторы блога Stone AI",
  description:
    "Команда Stone AI: основатель, AI-маркетологи, редакция. Эксперты, которые тестируют нейросети на реальных задачах и пишут гайды по работе с AI без VPN из России.",
  alternates: { canonical: "/authors" },
  openGraph: {
    title: "Авторы Stone AI",
    description: "Команда экспертов Stone AI — гайды, обзоры, кейсы по работе с нейросетями.",
  },
};

export default function AuthorsPage() {
  const itemList = buildItemList(
    AUTHORS.map((a) => ({
      name: a.name,
      url: `${SITE_URL}/authors/${a.slug}`,
      description: a.jobTitle,
    })),
    "Авторы Stone AI",
  );

  return (
    <div className="min-h-screen pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />

      <Breadcrumbs items={[{ label: "Авторы", href: "/authors" }]} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <header className="text-center mb-12">
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            Команда Stone AI
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-5">Авторы блога</h1>
          <p className="text-text/60 text-lg max-w-2xl mx-auto leading-relaxed">
            За статьями Stone AI стоят живые люди — основатель компании, маркетологи и редакция,
            которые каждый день работают с 65+ нейросетями и делятся практическим опытом.
            Никаких ботов, никакого «AI-сгенерированного мусора без правки».
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {AUTHORS.map((author) => (
            <AuthorCard key={author.slug} author={author} />
          ))}
        </div>

        <section className="mt-16 bg-gradient-to-br from-accent/5 to-teal/5 border border-accent/10 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-extrabold mb-2">Хотите присоединиться?</h2>
          <p className="text-text/60 text-sm mb-5 max-w-md mx-auto">
            Ищем экспертов в AI-маркетинге, разработке, дизайне для написания гостевых статей.
            Гонорар + продвижение в нашей аудитории 15 000+ читателей.
          </p>
          <a
            href="https://t.me/StoneAIsupport"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors"
          >
            Написать в редакцию →
          </a>
        </section>

        <CrossLinks prefer={["blog", "compare", "models"]} exclude={["authors"]} />
      </div>
    </div>
  );
}
