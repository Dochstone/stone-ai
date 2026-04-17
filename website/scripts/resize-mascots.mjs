import sharp from "sharp";
import { readFile, writeFile, readdir } from "fs/promises";
import { join } from "path";

const MASCOTS_DIR = "public/mascots";
const TARGET_SIZE = 240;
const QUALITY = 82;

const KEEP = new Set([
  "stone-mascot-idle.webp",
  "stone-mascot-chat.webp",
  "stone-mascot-loading.webp",
  "stone-mascot-success.webp",
]);

const files = (await readdir(MASCOTS_DIR)).filter((f) => KEEP.has(f));

for (const file of files) {
  const path = join(MASCOTS_DIR, file);
  const input = await readFile(path);
  const before = input.length;
  const meta = await sharp(input).metadata();

  const output = await sharp(input)
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toBuffer();

  await writeFile(path, output);

  const saved = (((before - output.length) / before) * 100).toFixed(0);
  console.log(
    `${file.padEnd(30)} ${meta.width}×${meta.height} → ${TARGET_SIZE}×${TARGET_SIZE}  ${(before / 1024).toFixed(0)}KB → ${(output.length / 1024).toFixed(0)}KB  (-${saved}%)`
  );
}
