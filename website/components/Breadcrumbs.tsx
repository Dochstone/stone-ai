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

export default function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  // Visual breadcrumbs hidden — navbar already provides navigation.
  // JSON-LD preserved for SEO (Google rich results).
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(items)) }} />
  );
}
