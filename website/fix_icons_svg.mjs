import sharp from "sharp";

const variants = {
  "tool-projects": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="28" fill="#15803D"/>
    <g fill="#ffffff">
      <path d="M24 44 L24 88 Q24 92 28 92 L92 92 Q96 92 96 88 L96 52 Q96 48 92 48 L56 48 L48 40 L28 40 Q24 40 24 44 Z"/>
      <rect x="60" y="28" width="22" height="16" rx="2" fill="#ffffff" opacity="0.85"/>
      <rect x="66" y="22" width="22" height="16" rx="2" fill="#ffffff" opacity="0.95"/>
    </g>
  </svg>`,

  "tool-ab-test": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="28" fill="#475569"/>
    <g>
      <rect x="26" y="32" width="32" height="56" rx="6" fill="#ffffff"/>
      <rect x="62" y="32" width="32" height="56" rx="6" fill="#ffffff"/>
      <text x="42" y="68" font-family="Arial, sans-serif" font-size="26" font-weight="900" fill="#475569" text-anchor="middle">A</text>
      <text x="78" y="68" font-family="Arial, sans-serif" font-size="26" font-weight="900" fill="#475569" text-anchor="middle">B</text>
    </g>
  </svg>`,

  "tool-campaigns": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="28" fill="#B45309"/>
    <g fill="#ffffff">
      <path d="M28 48 L28 72 L42 72 L68 90 L68 30 L42 48 Z"/>
      <rect x="34" y="72" width="10" height="18" rx="2"/>
      <path d="M76 46 Q84 60 76 74" stroke="#ffffff" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M84 40 Q96 60 84 80" stroke="#ffffff" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M92 34 Q108 60 92 86" stroke="#ffffff" stroke-width="5" fill="none" stroke-linecap="round"/>
    </g>
  </svg>`,
};

for (const [name, svg] of Object.entries(variants)) {
  await sharp(Buffer.from(svg)).resize(1024, 1024).png().toFile(`/tmp/${name}.png`);
  console.log(`${name}.png`);
}
