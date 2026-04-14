import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

// Granular AI-crawler policy (2026 best practice):
// - Disallow training bots (they scrape content for LLM training without giving traffic back)
// - Allow search bots (they cite us in AI answers and drive real referrals)
// See: https://platform.openai.com/docs/bots, https://docs.anthropic.com/en/docs/about-claude/bots
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

  return {
    rules: [
      // Default policy for all crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow: privateDisallow,
      },

      // === TRAINING BOTS — disallow (don't train on our content) ===
      { userAgent: "GPTBot", disallow: "/" },           // OpenAI training
      { userAgent: "ClaudeBot", disallow: "/" },        // Anthropic training
      { userAgent: "anthropic-ai", disallow: "/" },     // Anthropic legacy
      { userAgent: "Google-Extended", disallow: "/" },  // Google Bard/Gemini training
      { userAgent: "CCBot", disallow: "/" },            // Common Crawl (feeds training data)
      { userAgent: "cohere-ai", disallow: "/" },        // Cohere training
      { userAgent: "FacebookBot", disallow: "/" },      // Meta training
      { userAgent: "Amazonbot", disallow: "/" },        // Amazon training
      { userAgent: "Bytespider", disallow: "/" },       // ByteDance training

      // === SEARCH BOTS — allow (they cite us in AI answers, drive traffic) ===
      // OpenAI search
      { userAgent: "OAI-SearchBot", allow: "/", disallow: privateDisallow },
      { userAgent: "ChatGPT-User", allow: "/", disallow: privateDisallow },
      // Anthropic search
      { userAgent: "Claude-SearchBot", allow: "/", disallow: privateDisallow },
      { userAgent: "Claude-User", allow: "/", disallow: privateDisallow },
      // Perplexity
      { userAgent: "PerplexityBot", allow: "/", disallow: privateDisallow },
      { userAgent: "Perplexity-User", allow: "/", disallow: privateDisallow },
      // Apple Intelligence
      { userAgent: "Applebot", allow: "/", disallow: privateDisallow },
      { userAgent: "Applebot-Extended", allow: "/", disallow: privateDisallow },
      // Traditional search (always open)
      { userAgent: "Googlebot", allow: "/", disallow: privateDisallow },
      { userAgent: "Bingbot", allow: "/", disallow: privateDisallow },
      { userAgent: "YandexBot", allow: "/", disallow: privateDisallow },
      { userAgent: "DuckDuckBot", allow: "/", disallow: privateDisallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL.replace(/^https?:\/\//, ""),
  };
}
