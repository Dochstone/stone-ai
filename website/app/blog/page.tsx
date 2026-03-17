import type { Metadata } from "next";
import { POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Блог — Stone AI",
  description:
    "Статьи про AI-модели, сравнения, гайды и советы. Как выбрать модель, сэкономить на AI и оплатить из России.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogPage() {
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            Блог
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
            Статьи и гайды
          </h1>
          <p className="text-text/60 max-w-lg mx-auto">
            Как выбрать AI-модель, сэкономить на токенах и оплатить из России без VPN.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {POSTS.map((post) => (
            <a
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="bg-white rounded-2xl border border-text/5 p-6 card-hover block"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-text/35">{formatDate(post.date)}</span>
                <span className="w-1 h-1 bg-text/15 rounded-full" />
                <span className="text-xs text-text/35">{post.readTime}</span>
              </div>
              <h2 className="font-bold text-lg mb-2 leading-snug">{post.title}</h2>
              <p className="text-text/50 text-sm leading-relaxed line-clamp-2">
                {post.description}
              </p>
              <span className="inline-block mt-4 text-accent text-sm font-semibold">
                Читать &rarr;
              </span>
            </a>
          ))}
        </div>

        <div className="text-center mt-16">
          <a
            href="/webchat"
            className="inline-block bg-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
          >
            Попробовать бесплатно
          </a>
          <p className="mt-3 text-sm text-text/40">10 бесплатных запросов каждый день</p>
        </div>
      </div>
    </div>
  );
}
