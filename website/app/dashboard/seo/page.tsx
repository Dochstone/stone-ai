import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "SEO-модуль" };

const tools = [
  {
    href: "/dashboard/seo/article",
    icon: "📝",
    title: "Генератор SEO-статей",
    desc: "Оптимизированная статья с H2/H3, ключами, FAQ и мета-тегами",
    cost: "5₽",
    color: "from-green-500 to-emerald-600",
  },
  {
    href: "/dashboard/seo/analyze",
    icon: "🔍",
    title: "Анализатор текста",
    desc: "Оценка SEO-параметров: релевантность, читабельность, структура, ключи",
    cost: "3₽",
    color: "from-blue-500 to-cyan-500",
  },
  {
    href: "/dashboard/seo/meta",
    icon: "🏷️",
    title: "Мета-теги",
    desc: "Title, Description, Keywords, Open Graph + превью в поиске Google",
    cost: "2₽",
    color: "from-purple-500 to-pink-500",
  },
];

export default function SEOHub() {
  return (
    <div className="pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <h1 className="text-2xl font-extrabold text-text mb-2">SEO-модуль</h1>
        <p className="text-sm text-text/40 mb-8">3 инструмента для создания и анализа SEO-контента</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tools.map(t => (
            <Link key={t.href} href={t.href}
              className="bg-bg border border-text/5 rounded-2xl p-6 hover:border-accent/20 hover:shadow-lg transition-all group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                {t.icon}
              </div>
              <h3 className="text-base font-bold text-text mb-1 group-hover:text-accent transition-colors">{t.title}</h3>
              <p className="text-xs text-text/40 mb-3">{t.desc}</p>
              <span className="text-[10px] text-text/25">от {t.cost} за генерацию</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
