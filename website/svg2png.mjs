import sharp from "sharp";
import fs from "fs";
import path from "path";

const SRC = "/var/www/stone-ai/website/public/logos";
const OUT = "/var/www/stone-ai/website/public/logos-png";

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const files = fs.readdirSync(SRC).filter(f => f.endsWith(".svg"));
for (const f of files) {
  const src = path.join(SRC, f);
  const dst = path.join(OUT, f.replace(".svg", ".png"));
  try {
    await sharp(src, { density: 300 })
      .resize({ width: 96, height: 96, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(dst);
    console.log(`${f} -> ${path.basename(dst)}`);
  } catch (e) {
    console.log(`FAIL ${f}: ${e.message}`);
  }
}
