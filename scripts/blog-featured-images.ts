/**
 * Blog featured images — gera hero pra Posts PUBLISHED sem `imagemHeroId`.
 *
 * Pipeline (por Post):
 *   1. Flux Schnell 1200x800 com prompt específico da categoria (low cost)
 *   2. Baixa o Flux da R2 → dataUrl (evita TLS issue Windows no Satori fetch)
 *   3. Satori compose template "card" + texto do título + paleta variando por categoria
 *   4. Upload R2 em key `posts/{postId}/hero.png`
 *   5. Image record (modelo: "flux-schnell+satori-card") + Post.imagemHeroId
 *
 * Custo Replicate (Schnell ≈ $0.003/img ≈ R$ 0.02): ~R$ 0.60 pra 30 posts.
 *
 * Skip: posts que já têm imagemHeroId. Concurrency default = 2 (Replicate rate limits).
 * Progress log a cada 5 posts.
 *
 * Uso:
 *   pnpm tsx scripts/blog-featured-images.ts                  # processa todos
 *   pnpm tsx scripts/blog-featured-images.ts --limit=5        # processa só 5
 *   pnpm tsx scripts/blog-featured-images.ts --dry-run        # só lista
 *   pnpm tsx scripts/blog-featured-images.ts --concurrency=1  # serial
 */

// Windows local: Node não tem CF root CA — script é local-only contra R2 controlado, OK desabilitar.
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
import { generateFluxImage, composeMessageImage, uploadBuffer } from "@nivertotal/images";
import type { ComposePaleta } from "@nivertotal/images";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// ============================================================
// CONFIG
// ============================================================

const R2_BUCKET = process.env.R2_BUCKET ?? "portalsoma-media";
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "https://media.portalsoma.com.br").replace(/\/$/, "");

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const prisma = new PrismaClient();

// ============================================================
// PROMPTS POR CATEGORIA (slug → prompt Flux)
// ============================================================

const PROMPTS_POR_CATEGORIA: Record<string, string> = {
  "significado-da-data":
    "soft natural light through window onto wooden desk with vintage book, brass clock, dried flower, minimalist editorial photography, dreamy bokeh, warm golden hour, no text, no people faces",
  "etiqueta-do-aniversario":
    "elegant hand writing on cream paper envelope with vintage pen, soft daylight, minimalist still life, no text, no people",
  "presentes-e-mimos":
    "beautifully wrapped gift box on linen tablecloth with dried lavender, soft natural light, premium editorial still life, no text",
  "celebracao-e-festa":
    "elegant table setting with candle light, fresh flowers and wine glasses, soft warm bokeh, intimate gathering atmosphere, no text, no people faces",
  "relacoes-e-afeto":
    "two hands gently holding coffee cups on rustic wooden table, soft window light, intimate conversation atmosphere, dreamy bokeh, no text, no faces visible",
};

const PALETA_POR_CATEGORIA: Record<string, ComposePaleta> = {
  "significado-da-data": "warm",
  "etiqueta-do-aniversario": "sky",
  "presentes-e-mimos": "emerald",
  "celebracao-e-festa": "violet",
  "relacoes-e-afeto": "rose",
};

const FALLBACK_PROMPT =
  "minimalist editorial still life with soft natural light, dried flowers, warm bokeh, premium photography, no text, no people";
const FALLBACK_PALETA: ComposePaleta = "warm";

function promptForCategoria(slug: string): string {
  return PROMPTS_POR_CATEGORIA[slug] ?? FALLBACK_PROMPT;
}

function paletaForCategoria(slug: string): ComposePaleta {
  return PALETA_POR_CATEGORIA[slug] ?? FALLBACK_PALETA;
}

// ============================================================
// ARGS
// ============================================================

interface Args {
  limit?: number;
  concurrency: number;
  dryRun: boolean;
  force: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { concurrency: 2, dryRun: false, force: false };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    const [, key, val] = m;
    if (key === "limit") out.limit = Number(val);
    else if (key === "concurrency") out.concurrency = Number(val);
    else if (key === "dry-run") out.dryRun = true;
    else if (key === "force") out.force = true;
  }
  return out;
}

// ============================================================
// R2 HELPERS (Flux → dataUrl pra Satori bypass TLS Windows)
// ============================================================

function urlToKey(url: string): string | undefined {
  if (url.startsWith(R2_PUBLIC_URL + "/")) return url.slice(R2_PUBLIC_URL.length + 1);
  return undefined;
}

async function fetchAsDataUrl(url: string): Promise<string | undefined> {
  const key = urlToKey(url);
  if (!key) {
    console.warn(`  [warn] key extraction fail ${url}`);
    return undefined;
  }
  try {
    const out = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    const chunks: Buffer[] = [];
    const stream = out.Body as NodeJS.ReadableStream;
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const buf = Buffer.concat(chunks);
    const ct = out.ContentType ?? "image/jpeg";
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch (e) {
    console.warn(`  [warn] r2 get fail ${key}:`, e instanceof Error ? e.message : e);
    return undefined;
  }
}

// ============================================================
// WORKER
// ============================================================

interface JobResult {
  postId: string;
  ok: boolean;
  skipped?: boolean;
  custoBRL?: number;
  err?: string;
}

async function processOne(postId: string, args: Args): Promise<JobResult> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { categoria: true },
  });
  if (!post) return { postId, ok: false, err: "not found" };

  if (!args.force && post.imagemHeroId) {
    return { postId, ok: true, skipped: true, err: "skip (já tem imagemHeroId)" };
  }

  const categoriaSlug = post.categoria.slug;
  const prompt = promptForCategoria(categoriaSlug);
  const paleta = paletaForCategoria(categoriaSlug);
  const keyBase = `posts/${post.id}/bg`;

  if (args.dryRun) {
    console.log(
      `  [dry] ${post.id} | cat=${categoriaSlug} | paleta=${paleta} | "${post.titulo.slice(0, 60)}..."`,
    );
    return { postId, ok: true, custoBRL: 0.02 };
  }

  let custoBRL = 0;

  // 1. Gera bg Flux Schnell
  let bgFluxUrl: string;
  try {
    const flux = await generateFluxImage({
      prompt,
      model: "schnell",
      formato: "hero",
      keyBase,
      alt: `Imagem ilustrativa: ${post.titulo}`,
    });
    bgFluxUrl = flux.url;
    custoBRL += flux.custoBRL;
  } catch (e) {
    return { postId, ok: false, custoBRL, err: `flux fail: ${e instanceof Error ? e.message : e}` };
  }

  // 2. Baixa Flux via S3 GetObject pra dataUrl (evita TLS no fetch do Satori)
  const bgDataUrl = await fetchAsDataUrl(bgFluxUrl);
  if (!bgDataUrl) {
    return { postId, ok: false, custoBRL, err: "fail downloading bg flux pra dataUrl" };
  }

  // 3. Compose Satori card com título do post
  let composed: { buffer: Buffer; width: number; height: number };
  try {
    composed = await composeMessageImage({
      texto: post.titulo,
      template: "card",
      paleta,
      formato: "hero",
      bgUrl: bgDataUrl,
    });
  } catch (e) {
    return {
      postId,
      ok: false,
      custoBRL,
      err: `compose fail: ${e instanceof Error ? e.message : e}`,
    };
  }

  // 4. Upload R2 + Image record + update Post
  try {
    const key = `posts/${post.id}/hero.png`;
    const uploaded = await uploadBuffer({
      key,
      buffer: composed.buffer,
      contentType: "image/png",
    });

    const novaImg = await prisma.image.create({
      data: {
        url: uploaded.url,
        formato: "hero",
        width: composed.width,
        height: composed.height,
        alt: `${post.titulo} — Portal Soma`,
        promptUsado: prompt,
        modelo: "flux-schnell+satori-card",
        custo: custoBRL,
      },
    });

    await prisma.post.update({
      where: { id: post.id },
      data: { imagemHeroId: novaImg.id },
    });

    return { postId, ok: true, custoBRL };
  } catch (e) {
    return {
      postId,
      ok: false,
      custoBRL,
      err: `upload/db fail: ${e instanceof Error ? e.message : e}`,
    };
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  // Validação REPLICATE_API_TOKEN
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("\n❌ REPLICATE_API_TOKEN não encontrado no .env");
    console.error("   Adicione no arquivo .env do projeto:");
    console.error('     REPLICATE_API_TOKEN="r8_..."');
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  console.log("\n🎨 BLOG FEATURED IMAGES — args:", args, "\n");

  // Posts PUBLISHED sem imagemHeroId (ou todos se --force)
  const where = args.force
    ? { status: "PUBLISHED" as const }
    : { status: "PUBLISHED" as const, imagemHeroId: null };

  const posts = await prisma.post.findMany({
    where,
    select: { id: true, titulo: true, imagemHeroId: true },
    take: args.limit,
    orderBy: { criadoEm: "asc" },
  });

  console.log(`Total a processar: ${posts.length}`);
  if (posts.length === 0) {
    console.log("Nada a fazer. ✨\n");
    await prisma.$disconnect();
    return;
  }

  const ids = posts.map((p) => p.id);
  let cursor = 0;
  let ok = 0;
  let skip = 0;
  let fail = 0;
  let custoTotal = 0;
  const t0 = Date.now();

  async function worker(workerId: number) {
    while (cursor < ids.length) {
      const idx = cursor++;
      const id = ids[idx]!;
      const r = await processOne(id, args);
      if (r.ok && r.skipped) {
        skip++;
      } else if (r.ok) {
        ok++;
        custoTotal += r.custoBRL ?? 0;
      } else {
        fail++;
        console.error(`  [w${workerId} ${idx + 1}/${ids.length}] FAIL ${id} | ${r.err}`);
      }
      if ((idx + 1) % 5 === 0 || idx + 1 === ids.length) {
        const taxa = (idx + 1) / ((Date.now() - t0) / 1000);
        console.log(
          `  [progress] ${idx + 1}/${ids.length} | ok=${ok} skip=${skip} fail=${fail} | custo≈R$${custoTotal.toFixed(2)} | ${taxa.toFixed(2)} post/s`,
        );
      }
    }
  }

  await Promise.all(Array.from({ length: args.concurrency }, (_, i) => worker(i + 1)));

  const elapsed = (Date.now() - t0) / 1000;
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ BLOG FEATURED IMAGES CONCLUÍDO`);
  console.log(`   ${ok} novos · ${skip} skip · ${fail} fail`);
  console.log(`   💸 Custo total ≈ R$ ${custoTotal.toFixed(2)} (Flux Schnell)`);
  console.log(`   ⏱  ${(elapsed / 60).toFixed(1)}min`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
