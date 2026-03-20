export default function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Навигация" className="pt-20 pb-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ol className="flex items-center gap-1.5 text-xs text-text/40">
          <li>
            <a href="/" className="hover:text-accent transition-colors">Главная</a>
          </li>
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className="text-text/20">/</span>
              {item.href ? (
                <a href={item.href} className="hover:text-accent transition-colors">{item.label}</a>
              ) : (
                <span className="text-text/60 font-medium">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
