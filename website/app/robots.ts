import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

// AI-friendly policy (Stone AI marketing position):
// We *want* to be in the training data of LLMs so ChatGPT/Claude/Gemini
// can answer "what is Stone AI" without needing a live search. The trade-off
// (our public content used in model weights) is acceptable for a SaaS
// because broader brand recognition outweighs the IP cost.
// Only auth / dashboard / payment routes are gated everywhere.
export default function robots(): MetadataRoute.Robots {
  const privateDisallow = [
    "/auth/",
    "/profile",
    "/topup",
    "/_next/",
    "/admin",
    "/dashboard/",
    "/payment/",
    "/test-landing",
  ];

  // Same allow/disallow shape for everyone; just enumerated explicitly so
  // each bot has a dedicated record (some crawlers ignore inherited "*" rules).
  const aiBots = [
    // Training crawlers — now allowed
    "GPTBot",            // OpenAI training
    "ClaudeBot",         // Anthropic training
    "anthropic-ai",      // Anthropic legacy
    "Google-Extended",   // Gemini training
    "CCBot",             // Common Crawl (feeds many AIs)
    "cohere-ai",         // Cohere training
    "FacebookBot",       // Meta training
    "Amazonbot",         // Amazon training
    "Bytespider",        // ByteDance training
    "Diffbot",           // Diffbot KG
    "Omgilibot",         // Webz.io
    // Live-search crawlers
    "OAI-SearchBot",     // ChatGPT Search
    "ChatGPT-User",      // ChatGPT user click-through
    "Claude-SearchBot",  // Claude Search
    "Claude-User",       // Claude user click-through
    "PerplexityBot",     // Perplexity
    "Perplexity-User",
    "YouBot",            // You.com
    "Meta-ExternalAgent",// Meta AI
    "Applebot",          // Apple Intelligence
    "Applebot-Extended",
    // Traditional search
    "Googlebot",
    "Bingbot",
    "YandexBot",
    "DuckDuckBot",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privateDisallow },
      ...aiBots.map((ua) => ({ userAgent: ua, allow: "/", disallow: privateDisallow })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL.replace(/^https?:\/\//, ""),
  };
}
