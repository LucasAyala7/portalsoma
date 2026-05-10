/**
 * Upload em batch das imagens locais pro R2.
 *
 * Source: apps/web/public/img/mensagens/{msgId}/{tier_X-hero|og}.{jpg|png}
 * Target: R2 bucket portalsoma-media, mesma key relativa (mensagens/{msgId}/...)
 *
 * Após upload, atualiza Image.url no DB pra apontar pra https://media.portalsoma.com.br/{key}.
 */

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, readdir, stat } from "node:fs/promises";
const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local = dirname(__filename_local);
const WORKSPACE_ROOT = resolve(__dirname_local, "..");
process.env.WORKSPACE_ROOT = WORKSPACE_ROOT;
config({ path: resolve(WORKSPACE_ROOT, ".env") });

import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const prisma = new PrismaClient();
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET ?? "portalsoma-media";
const PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "https://media.portalsoma.com.br";
const LOCAL_BASE = resolve(WORKSPACE_ROOT, "apps/web/public/img");
const LOCAL_PUBLIC_PREFIX = "/img"; // como aparece em DB hoje

interface FileEntry {
  absPath: string;
  key: string; // ex: "mensagens/abc123/og.png"
  size: number;
  contentType: string;
}

async function walk(dir: string, files: FileEntry[] = []): Promise<FileEntry[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const abs = resolve(dir, e.name);
    if (e.isDirectory()) await walk(abs, files);
    else if (e.isFile() && /\.(jpg|jpeg|png|webp)$/i.test(e.name)) {
      const rel = abs.replace(LOCAL_BASE + "\\", "").replace(LOCAL_BASE + "/", "").replace(/\\/g, "/");
      const ext = e.name.toLowerCase().split(".").pop()!;
      const ct = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      const s = await stat(abs);
      files.push({ absPath: abs, key: rel, size: s.size, contentType: ct });
    }
  }
  return files;
}

async function existsR2(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadOne(f: FileEntry, skipExisting: boolean): Promise<{ ok: boolean; skipped?: boolean; err?: string }> {
  if (skipExisting && (await existsR2(f.key))) return { ok: true, skipped: true };
  try {
    const buf = await readFile(f.absPath);
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: f.key,
        Body: buf,
        ContentType: f.contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, err: e instanceof Error ? e.message : String(e) };
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const skipExisting = !args.has("--no-skip");
  const concurrency = Number((process.argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1]) ?? "10");
  const updateDb = !args.has("--no-db");

  console.log(`\n📤 Upload imagens → R2 (skip-existing=${skipExisting} concurrency=${concurrency} updateDb=${updateDb})\n`);

  // 1) Walk local
  const files = await walk(LOCAL_BASE);
  console.log(`Arquivos locais encontrados: ${files.length}`);
  const totalMB = files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024;
  console.log(`Tamanho total: ${totalMB.toFixed(1)} MB\n`);

  // 2) Upload paralelo
  const t0 = Date.now();
  let cursor = 0;
  let ok = 0, skipped = 0, fail = 0;
  let lastReport = Date.now();

  async function worker(id: number) {
    while (cursor < files.length) {
      const idx = cursor++;
      const f = files[idx]!;
      const r = await uploadOne(f, skipExisting);
      if (r.ok) {
        if (r.skipped) skipped++;
        else ok++;
      } else {
        fail++;
        console.error(`[w${id} ${idx + 1}/${files.length}] FAIL ${f.key}: ${r.err}`);
      }
      if (Date.now() - lastReport > 5000) {
        const pct = (((idx + 1) / files.length) * 100).toFixed(0);
        const taxa = (ok + skipped) / ((Date.now() - t0) / 1000);
        console.log(`  [${idx + 1}/${files.length} ${pct}%] ok=${ok} skip=${skipped} fail=${fail} | ${taxa.toFixed(0)} files/s`);
        lastReport = Date.now();
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i + 1)));

  const elapsed = (Date.now() - t0) / 1000;
  console.log(`\n✅ UPLOAD CONCLUÍDO em ${elapsed.toFixed(0)}s`);
  console.log(`   ${ok} novos · ${skipped} já existentes · ${fail} fails\n`);

  if (!updateDb) {
    await prisma.$disconnect();
    return;
  }

  // 3) Atualiza Image.url: substitui /img/... por https://media.portalsoma.com.br/...
  console.log(`🔄 Atualizando DB (Image.url) ...`);
  const imgs = await prisma.image.findMany({
    where: { url: { startsWith: LOCAL_PUBLIC_PREFIX + "/" } },
    select: { id: true, url: true },
  });
  console.log(`Image rows com URL local: ${imgs.length}`);
  let updCount = 0;
  for (const img of imgs) {
    const rel = img.url.startsWith(LOCAL_PUBLIC_PREFIX + "/")
      ? img.url.slice(LOCAL_PUBLIC_PREFIX.length + 1)
      : img.url;
    const newUrl = `${PUBLIC_URL}/${rel}`;
    await prisma.image.update({ where: { id: img.id }, data: { url: newUrl } });
    updCount++;
    if (updCount % 200 === 0) console.log(`   updated ${updCount}/${imgs.length}`);
  }
  console.log(`✅ ${updCount} Image rows atualizados pra URLs R2`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
