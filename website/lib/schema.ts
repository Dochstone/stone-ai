import { SITE_URL } from "./constants";

/**
 * Stone AI Schema.org factories — single source of truth for structured data.
 * Each function returns a plain JS object ready for JSON.stringify into a
 * <script type="application/ld+json"> tag.
 */

// ── Shared references ──────────────────────────────────────────────
const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

export const orgRef = { "@id": ORG_ID } as const;
export const siteRef = { "@id": SITE_ID } as const;

// ── HowTo ──────────────────────────────────────────────────────────
export interface HowToStep {
  name: string;
  text: string;
  image?: string;
  url?: string;
}

export function buildHowTo(params: {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration like "PT10M"
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: params.name,
    description: params.description,
    ...(params.image ? { image: params.image } : {}),
    ...(params.totalTime ? { totalTime: params.totalTime } : {}),
    step: params.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.image ? { image: s.image } : {}),
      ...(s.url ? { url: s.url } : {}),
    })),
  };
}

// ── VideoObject ────────────────────────────────────────────────────
export interface VideoChapter {
  name: string;
  startOffset: number; // seconds
  endOffset?: number;
  url?: string;
}

export function buildVideoObject(params: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string; // ISO 8601
  durationSeconds?: number;
  contentUrl?: string;
  embedUrl?: string;
  chapters?: VideoChapter[];
}) {
  const iso = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${sec ? `${sec}S` : ""}` || "PT0S";
  };
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: params.name,
    description: params.description,
    thumbnailUrl: params.thumbnailUrl,
    uploadDate: params.uploadDate,
    ...(params.durationSeconds ? { duration: iso(params.durationSeconds) } : {}),
    ...(params.contentUrl ? { contentUrl: params.contentUrl } : {}),
    ...(params.embedUrl ? { embedUrl: params.embedUrl } : {}),
    publisher: {
      "@type": "Organization",
      name: "Stone AI",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
      },
    },
    ...(params.chapters && params.chapters.length
      ? {
          hasPart: params.chapters.map((c) => ({
            "@type": "Clip",
            name: c.name,
            startOffset: c.startOffset,
            ...(c.endOffset !== undefined ? { endOffset: c.endOffset } : {}),
            ...(c.url ? { url: c.url } : {}),
          })),
        }
      : {}),
  };
}

// ── Person (author) ────────────────────────────────────────────────
export interface PersonData {
  slug: string;
  name: string;
  jobTitle: string;
  bio: string;
  image?: string;
  sameAs?: string[];
  knowsAbout?: string[];
}

export function buildPerson(p: PersonData) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/authors/${p.slug}#person`,
    name: p.name,
    jobTitle: p.jobTitle,
    description: p.bio,
    url: `${SITE_URL}/authors/${p.slug}`,
    ...(p.image ? { image: p.image } : {}),
    ...(p.sameAs && p.sameAs.length ? { sameAs: p.sameAs } : {}),
    ...(p.knowsAbout && p.knowsAbout.length ? { knowsAbout: p.knowsAbout } : {}),
    worksFor: orgRef,
  };
}

// ── SoftwareApplication (расширенная) ──────────────────────────────
export function buildSoftwareApplication(params: {
  name: string;
  slug: string;
  description: string;
  category: string; // applicationCategory
  priceUsd: number;
  features?: string[];
  softwareVersion?: string;
  screenshot?: string;
  creator?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: params.name,
    description: params.description,
    url: `${SITE_URL}/models/${params.slug}`,
    applicationCategory: params.category,
    operatingSystem: "Web, Android, iOS",
    softwareRequirements: "Modern web browser",
    ...(params.softwareVersion ? { softwareVersion: params.softwareVersion } : {}),
    ...(params.screenshot ? { screenshot: params.screenshot } : {}),
    ...(params.features && params.features.length
      ? { featureList: params.features.join(", ") }
      : {}),
    offers: {
      "@type": "Offer",
      price: params.priceUsd.toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/pricing`,
    },
    ...(params.creator
      ? {
          creator: { "@type": "Organization", name: params.creator },
        }
      : {}),
    publisher: orgRef,
  };
}

// ── FAQPage ────────────────────────────────────────────────────────
export interface FaqItem {
  q: string;
  a: string;
}

export function buildFAQPage(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: it.a,
      },
    })),
  };
}

// ── PriceSpecification / Offer ─────────────────────────────────────
export function buildSubscriptionOffer(params: {
  name: string;
  priceRub: number;
  description?: string;
  url?: string;
}) {
  return {
    "@type": "Offer",
    name: params.name,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: params.priceRub,
      priceCurrency: "RUB",
      billingDuration: "P1M", // monthly
      billingIncrement: 1,
      unitText: "monthly subscription",
    },
    availability: "https://schema.org/InStock",
    ...(params.description ? { description: params.description } : {}),
    ...(params.url ? { url: params.url } : {}),
  };
}

// ── ItemList (for comparison pages, lists) ──────────────────────────
export interface ItemListEntry {
  name: string;
  url: string;
  description?: string;
  image?: string;
}

export function buildItemList(items: ItemListEntry[], listName?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...(listName ? { name: listName } : {}),
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: it.url,
      ...(it.description ? { description: it.description } : {}),
      ...(it.image ? { image: it.image } : {}),
    })),
  };
}

// ── Helper for dangerouslySetInnerHTML ─────────────────────────────
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data) };
}
