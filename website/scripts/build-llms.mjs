// Generate public/llms.txt and llms-full.txt from .tmpl files,
// substituting {{price_*}} placeholders with current prices from lib/pricing.ts.
//
// Re-run automatically via the `prebuild` script in package.json.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pricingPath = join(root, "lib", "pricing.ts");

// Read PRICES_CURRENT directly from pricing.ts (single source of truth).
const pricingSrc = readFileSync(pricingPath, "utf-8");
const block = pricingSrc.match(/PRICES_CURRENT[^=]*=\s*\{([\s\S]*?)\}/);
if (!block) {
  console.error("Cannot locate PRICES_CURRENT in lib/pricing.ts");
  process.exit(1);
}

function pickPrice(tier) {
  // Match either bare key (mini: 990) or quoted key ("max-pro": 3990)
  const re = new RegExp(`["']?${tier.replace(/-/g, "\\-")}["']?\\s*:\\s*(\\d+)`);
  const m = block[1].match(re);
  if (!m) {
    console.error(`Tier ${tier} not found`);
    process.exit(1);
  }
  return Number(m[1]);
}

const prices = {
  mini: pickPrice("mini"),
  max: pickPrice("max"),
  "max-pro": pickPrice("max-pro"),
};

function fmt(n) {
  return n.toLocaleString("ru-RU").replace(/,/g, "\u00A0").replace(/\u00A0/g, " ");
}

const replacements = {
  "{{price_mini_full}}": `${fmt(prices.mini)}₽/мес`,
  "{{price_max_full}}": `${fmt(prices.max)}₽/мес`,
  "{{price_elite_full}}": `${fmt(prices["max-pro"])}₽/мес`,
  "{{price_mini}}": `${fmt(prices.mini)}₽`,
  "{{price_max}}": `${fmt(prices.max)}₽`,
  "{{price_elite}}": `${fmt(prices["max-pro"])}₽`,
};

for (const [src, dst] of [
  ["public/llms.txt.tmpl", "public/llms.txt"],
  ["public/llms-full.txt.tmpl", "public/llms-full.txt"],
]) {
  const srcPath = join(root, src);
  if (!existsSync(srcPath)) {
    console.warn(`SKIP missing template: ${src}`);
    continue;
  }
  let text = readFileSync(srcPath, "utf-8");
  for (const [k, v] of Object.entries(replacements)) text = text.split(k).join(v);
  writeFileSync(join(root, dst), text);
  console.log(`built ${dst}`);
}
