interface ToolPageHeroProps {
  badge: string;
  title: string;
  highlight: string;
  description: string;
  breadcrumb?: string;
}

export default function ToolPageHero({ badge, title, highlight, description, breadcrumb }: ToolPageHeroProps) {
  return (
    <section className="hero-gradient pt-28 pb-16 md:pt-36 md:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {breadcrumb && (
          <nav aria-label="Навигация" className="mb-6 -mt-4">
            <ol className="flex items-center justify-center gap-1.5 text-xs text-text/40">
              <li><a href="/" className="hover:text-accent transition-colors">Главная</a></li>
              <li className="flex items-center gap-1.5">
                <span className="text-text/20">/</span>
                <span className="text-text/60 font-medium">{breadcrumb}</span>
              </li>
            </ol>
          </nav>
        )}
        <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
          {badge}
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
          {title}
          <br />
          <span className="bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent">
            {highlight}
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-text/60 max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/webchat"
            className="bg-accent text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
          >
            Попробовать бесплатно
          </a>
          <a
            href="/models"
            className="border-2 border-text/15 text-text px-8 py-4 rounded-xl font-bold hover:border-accent hover:text-accent transition-colors"
          >
            Все 65+ моделей
          </a>
        </div>
      </div>
    </section>
  );
}
