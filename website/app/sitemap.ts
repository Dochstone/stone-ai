import type { MetadataRoute } from "next";
import { POSTS } from "@/lib/blog";
import { MODELS } from "@/lib/models";
import { COMPARISONS, ALTERNATIVES, PROFESSIONS, TOOL_HUBS } from "@/lib/seo-data";
import { USE_CASES } from "@/lib/use-cases";
import { GLOSSARY } from "@/lib/glossary";
import { AUTHORS } from "@/lib/authors";

import { SITE_URL } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-03-21");

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/models`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/webchat`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/studio`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/health`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/chat`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/images`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/video`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/audio`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/3d`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/documents`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/code`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/translate`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/docs`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/authors`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/referral`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/tools/utm-builder`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/chatbot`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/presentations`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/terms`, lastModified: new Date("2026-01-01"), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date("2026-01-01"), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/refund`, lastModified: new Date("2026-01-01"), changeFrequency: "yearly", priority: 0.3 },
  ];

  const blogPages: MetadataRoute.Sitemap = POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const modelPages: MetadataRoute.Sitemap = MODELS.map((model) => ({
    url: `${SITE_URL}/models/${model.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const comparePages: MetadataRoute.Sitemap = COMPARISONS.map((c) => ({
    url: `${SITE_URL}/compare/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const alternativePages: MetadataRoute.Sitemap = ALTERNATIVES.map((a) => ({
    url: `${SITE_URL}/alternatives/${a.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const professionPages: MetadataRoute.Sitemap = PROFESSIONS.map((p) => ({
    url: `${SITE_URL}/for/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const toolHubPages: MetadataRoute.Sitemap = TOOL_HUBS.map((t) => ({
    url: `${SITE_URL}/tools/${t.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const useCasePages: MetadataRoute.Sitemap = USE_CASES.map((uc) => ({
    url: `${SITE_URL}/use-cases/${uc.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const glossaryPages: MetadataRoute.Sitemap = GLOSSARY.map((g) => ({
    url: `${SITE_URL}/glossary/${g.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const authorPages: MetadataRoute.Sitemap = AUTHORS.map((a) => ({
    url: `${SITE_URL}/authors/${a.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...blogPages,
    ...modelPages,
    ...comparePages,
    ...alternativePages,
    ...professionPages,
    ...toolHubPages,
    ...useCasePages,
    ...glossaryPages,
    ...authorPages,
  ];
}
