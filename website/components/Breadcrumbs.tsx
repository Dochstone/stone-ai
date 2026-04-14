import { SITE_URL } from "@/lib/constants";

export function breadcrumbJsonLd(items: { label: string; href: string }[]) {
  const all = [{ label: "Главная", href: "/" }, ...items];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: `${SITE_URL}${item.href}`,
    })),
  };
}

interface Props {
  items: { label: string; href: string }[];
  /** Hide the visual trail (JSON-LD still rendered). Useful for pages with their own chrome. */
  visualHidden?: boolean;
}

export default function Breadcrumbs({ items, visualHidden = false }: Props) {
  const all = [{ label: "Главная", href: "/" }, ...items];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(items)) }}
      />
      {!visualHidden && (
        <nav aria-label="Хлебные крошки" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-text/50">
            {all.map((item, i) => {
              const isLast = i === all.length - 1;
              return (
                <li key={item.href} className="flex items-center gap-1.5 min-w-0">
                  {isLast ? (
                    <span className="font-semibold text-text/70 truncate max-w-[180px] sm:max-w-xs">
                      {item.label}
                    </span>
                  ) : (
                    <a
                      href={item.href}
                      className="hover:text-accent transition-colors truncate max-w-[120px] sm:max-w-[200px]"
                    >
                      {item.label}
                    </a>
                  )}
                  {!isLast && (
                    <span aria-hidden="true" className="text-text/20">
                      /
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
    </>
  );
}
