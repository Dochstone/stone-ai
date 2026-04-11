const HUBS = [
  { href: "/alternatives/chatgpt", label: "Аналоги ChatGPT", icon: "🔄" },
  { href: "/alternatives/midjourney", label: "Аналоги Midjourney", icon: "🎨" },
  { href: "/compare", label: "Сравнение моделей", icon: "⚖️" },
  { href: "/tools/image-generation", label: "Генерация картинок", icon: "🖼️" },
  { href: "/tools/video-generation", label: "Генерация видео", icon: "🎬" },
  { href: "/models", label: "Все 65+ моделей", icon: "🤖" },
  { href: "/for/marketer", label: "AI для маркетолога", icon: "📢" },
  { href: "/for/developer", label: "AI для программиста", icon: "💻" },
  { href: "/for/business", label: "AI для бизнеса", icon: "💼" },
  { href: "/for/copywriter", label: "AI для копирайтера", icon: "✍️" },
  { href: "/pricing", label: "Тарифы", icon: "💎" },
  { href: "/blog", label: "Блог", icon: "📝" },
];

export function CrossLinks({ exclude }: { exclude?: string[] }) {
  const links = HUBS.filter((h) => !exclude?.some((e) => h.href.includes(e)));
  const display = links.slice(0, 6);

  return (
    <section className="mt-12 mb-8">
      <h2 className="text-lg font-bold text-text mb-4">Полезные разделы</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {display.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-text/[0.06] bg-bg hover:border-accent/30 hover:shadow-sm transition-all group"
          >
            <span className="text-lg">{link.icon}</span>
            <span className="text-[13px] font-medium text-text/70 group-hover:text-accent transition-colors">{link.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
