import { SITE_URL } from "@/lib/constants";

export function breadcrumbJsonLd(items: { label: string; href?: string }[]) {
  const all = [{ label: "Главная", href: "/" }, ...items];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: item.href ? `${SITE_URL}${item.href}` : undefined,
    })),
  };
}

export default function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(items)) }} />
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
    </>
  );
}
