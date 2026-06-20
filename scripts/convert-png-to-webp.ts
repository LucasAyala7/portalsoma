/**
 * Batch convert PNG → WebP no R2 — reduz peso da hero img (1.36MB → ~200KB típico).
 *
 * Pra cada Image com url terminando em .png:
 *   1. Download PNG (HTTPS público média.portalsoma.com.br)
 *   2. sharp convert WebP quality 80
 *   3. Upload R2 com mesma key + ".webp"
 *   4. Update Image.url no DB (mantém PNG no R2 como fallback)
 *
 * Paralelismo: 8 (controlado por p-limit-ish).
 * Resumable: pula imgs que já tem url=.webp.
 *
 * Run: pnpm -F @nivertotal/web tsx scripts/convert-png-to-webp.ts [--limit=N] [--dry]
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local = dirname(__filename_local);
const WORKSPACE_ROOT = resolve(__dirname_local, "..");
process.env.WORKSPACE_ROOT = WORKSPACE_ROOT;
config({ path: resolve(WORKSPACE_ROOT, ".env") });

import { PrismaClient } from "@prisma/client";
import { uploadBuffer } from "@nivertotal/images";
import sharp from "sharp";

const prisma = new PrismaClient();

const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "https://media.portalsoma.com.br").replace(/\/$/, "");

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [[m[1], m[2] ?? "true"]] : [];
  }),
);
const LIMIT = args.limit ? Number(args.limit) : undefined;
const CONCURRENCY = args.concurrency ? Number(args.concurrency) : 8;
const DRY_RUN = args.dry === "true";
const QUALITY = args.quality ? Number(args.quality) : 80;

interface ImageRow {
  id: string;
  url: string;
}

async function processOne(img: ImageRow, idx: number, total: number): Promise<{ ok: boolean; saved?: number; error?: string }> {
  const tag = `[${idx + 1}/${total}] ${img.id.slice(-8)}`;
  try {
    // 1. Download PNG
    const res = await fetch(img.url);
    if (!res.ok) return { ok: false, error: `download ${res.status}` };
    const pngBuf = Buffer.from(await res.arrayBuffer());
    const pngSize = pngBuf.length;

    // 2. Sharp convert WebP
    const webpBuf = await sharp(pngBuf).webp({ quality: QUALITY, effort: 4 }).toBuffer();
    const webpSize = webpBuf.length;
    const saved = pngSize - webpSize;
    const pct = ((saved / pngSize) * 100).toFixed(0);

    if (DRY_RUN) {
      console.log(`${tag} DRY: ${(pngSize / 1024).toFixed(0)}KB → ${(webpSize / 1024).toFixed(0)}KB (-${pct}%)`);
      return { ok: true, saved };
    }

    // 3. Upload R2 — derive key from URL
    const key = img.url.replace(`${R2_PUBLIC_URL}/`, "").replace(/\.png$/i, ".webp");
    await uploadBuffer({
      key,
      buffer: webpBuf,
      contentType: "image/webp",
      cacheControl: "public, max-age=31536000, immutable",
    });

    // 4. Update DB
    const newUrl = `${R2_PUBLIC_URL}/${key}`;
    await prisma.image.update({
      where: { id: img.id },
      data: { url: newUrl },
    });

    console.log(`${tag} ✓ ${(pngSize / 1024).toFixed(0)}KB → ${(webpSize / 1024).toFixed(0)}KB (-${pct}%)`);
    return { ok: true, saved };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${tag} ✗ ${msg}`);
    return { ok: false, error: msg };
  }
}

async function main() {
  console.log(`[convert-png-to-webp] starting (concurrency=${CONCURRENCY}, quality=${QUALITY}, dry=${DRY_RUN})`);

  const where = { url: { endsWith: ".png" } };
  const total = await prisma.image.count({ where });
  console.log(`[convert-png-to-webp] total PNG candidates: ${total}`);

  const images = await prisma.image.findMany({
    where,
    select: { id: true, url: true },
    orderBy: { criadoEm: "desc" },
    take: LIMIT,
  });

  console.log(`[convert-png-to-webp] processing ${images.length} (limit=${LIMIT ?? "none"})`);

  let okCount = 0;
  let errCount = 0;
  let totalSaved = 0;
  let cursor = 0;
  const t0 = Date.now();

  async function worker() {
    while (cursor < images.length) {
      const idx = cursor++;
      const img = images[idx]!;
      const r = await processOne(img, idx, images.length);
      if (r.ok) {
        okCount++;
        totalSaved += r.saved ?? 0;
      } else errCount++;
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
  const savedMB = (totalSaved / 1024 / 1024).toFixed(1);
  console.log(`\n[convert-png-to-webp] DONE in ${elapsed}s — ok=${okCount} err=${errCount} saved=${savedMB}MB`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
