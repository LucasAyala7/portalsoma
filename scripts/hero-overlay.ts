/**
 * Hero overlay batch — re-renderiza TODOS os hero das mensagens publicadas
 * com texto Satori por cima do Flux existente (ou MINIMAL pra mensagens sem Flux).
 *
 * Lê imagemHero atual:
 *   - se existe (Flux): download da R2 → dataUrl → Satori compose com bgUrl
 *   - se não existe:   template MINIMAL (gradient cor paleta + texto + watermark)
 *
 * Skip-existing: se imagemHero atual já tem modelo === "hero-composed", pula.
 * Atualiza imagemHeroId pro novo Image record (modelo: "hero-composed").
 *
 * Custo: R$ 0 (puro Satori) + R2 storage.
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
import { composeMessageImage, uploadBuffer } from "@nivertotal/images";
import type { ComposePaleta, ComposeTemplate } from "@nivertotal/images";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

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

interface Args {
  limit?: number;
  concurrency: number;
  skipExisting: boolean;
  dryRun: boolean;
  force: boolean;
  onlyMissing: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { concurrency: 4, skipExisting: true, dryRun: false, force: false, onlyMissing: false };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    const [, key, val] = m;
    if (key === "limit") out.limit = Number(val);
    else if (key === "concurrency") out.concurrency = Number(val);
    else if (key === "no-skip") out.skipExisting = false;
    else if (key === "dry-run") out.dryRun = true;
    else if (key === "force") out.force = true;
    else if (key === "only-missing") out.onlyMissing = true;
  }
  return out;
}

function paletaForCluster(slug: string): ComposePaleta {
  if (/mae|esposa|namorada|filha|amiga|noiva|sogra|tia|prima|enteada|afilhada|madrinha|pastora|cunhada|sobrinha|bisneta|neta|bonita|romantica/.test(slug)) return "rose";
  if (/pai|filho|amigo|marido|tio|irmao|sobrinho|chefe|cunhado|patrao|padrinho|padre|pastor|namorado|enteado|afilhado|colega|cliente|lider|homem|sogro|genro/.test(slug)) return "sky";
  if (/avo|bisne|idoso|100|95|90|80|75/.test(slug)) return "amber";
  if (/poema|reflexiva|gratidao|abencoada|biblica|crista|evangelica|catolica|gospel|espirita/.test(slug)) return "violet";
  if (/casamento|bodas|relacionamento|namoro/.test(slug)) return "emerald";
  return "warm";
}

/** Trunca pra ~120 palavras pra legibilidade na hero. Mantém frases inteiras quando possível. */
function clampTextoParaHero(texto: string, maxWords = 120): string {
  const words = texto.trim().split(/\s+/);
  if (words.length <= maxWords) return texto.trim();
  const truncated = words.slice(0, maxWords).join(" ");
  // Tenta cortar no último ponto/ponto-final/interrogação/exclamação dentro do range
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?"),
  );
  if (lastSentenceEnd > truncated.length * 0.6) {
    return truncated.slice(0, lastSentenceEnd + 1).trim();
  }
  return truncated.trim() + "…";
}

/** Pra mensagens com bg, randomiza entre centro/card/full com pesos. */
function pickTemplateRandom(hasBg: boolean, msgId: string): ComposeTemplate {
  if (!hasBg) return "minimal";
  // Hash determinístico do id pra distribuição estável (não muda em re-runs)
  let h = 0;
  for (let i = 0; i < msgId.length; i++) h = (h * 31 + msgId.charCodeAt(i)) >>> 0;
  const r = h % 100;
  // 55% centro · 25% full · 20% card
  if (r < 55) return "centro";
  if (r < 80) return "full";
  return "card";
}

/** Extrai a key R2 da URL pública (https://media.portalsoma.com.br/path/key.jpg → path/key.jpg).
 * Retorna undefined se a URL não é do R2 público (ex: legacy unsplash) — nesse caso cai pra MINIMAL. */
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

interface JobResult {
  msgId: string;
  ok: boolean;
  template?: ComposeTemplate;
  err?: string;
}

async function processOne(msgId: string, args: Args): Promise<JobResult> {
  const m = await prisma.mensagem.findUnique({
    where: { id: msgId },
    include: {
      cluster: true,
      persona: true,
      imagemHero: true,
    },
  });
  if (!m) return { msgId, ok: false, err: "not found" };

  // Skip se já tem hero-composed
  if (args.skipExisting && !args.force && m.imagemHero?.modelo === "hero-composed") {
    return { msgId, ok: true, err: "skip (já composed)" };
  }

  // only-missing: só processa mensagens SEM imagemHero atual
  if (args.onlyMissing && m.imagemHeroId) {
    return { msgId, ok: true, err: "skip (já tem hero)" };
  }

  // Texto da mensagem — sempre conteudo clampado (resumo as vezes é meta-descritivo gerado por IA).
  // Clamp em ~55 palavras pra ficar legível em hero 1200x800 com fontSize ≥40.
  const texto = clampTextoParaHero(m.conteudo, 55);

  // Bg: procura Image Flux original via URL prefix (preserva ref mesmo após --force).
  // URLs Flux têm padrão: mensagens/{msgId}/tier_X-hero-...jpg
  let bgDataUrl: string | undefined;
  const fluxOriginal = await prisma.image.findFirst({
    where: {
      url: { startsWith: `${R2_PUBLIC_URL}/mensagens/${m.id}/tier_` },
      OR: [{ modelo: "flux-pro" }, { modelo: "flux-schnell" }],
    },
    orderBy: { criadoEm: "asc" },
  });
  if (fluxOriginal?.url) {
    bgDataUrl = await fetchAsDataUrl(fluxOriginal.url);
  }

  const template = pickTemplateRandom(!!bgDataUrl, m.id);
  const paleta = paletaForCluster(m.cluster.slug);

  if (args.dryRun) {
    console.log(`  [dry] ${m.id} | ${template} | ${paleta} | bg=${!!bgDataUrl} | "${texto.slice(0, 50)}..."`);
    return { msgId, ok: true, template };
  }

  try {
    const composed = await composeMessageImage({
      texto,
      autorNome: m.persona?.nome,
      template,
      paleta,
      formato: "hero",
      bgUrl: bgDataUrl,
    });

    const key = `mensagens/${m.id}/hero-composed.png`;
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
        alt: `${m.titulo} — Portal Soma`,
        modelo: "hero-composed",
        custo: 0,
      },
    });

    await prisma.mensagem.update({
      where: { id: m.id },
      data: { imagemHeroId: novaImg.id },
    });

    return { msgId, ok: true, template };
  } catch (e) {
    return { msgId, ok: false, err: e instanceof Error ? e.message : "compose fail" };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log("\n🎨 HERO OVERLAY BATCH — args:", args, "\n");

  const mensagens = await prisma.mensagem.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, imagemHeroId: true },
    take: args.limit,
    orderBy: { criadoEm: "asc" },
  });

  console.log(`Total publicadas: ${mensagens.length}`);
  const comHero = mensagens.filter((m) => m.imagemHeroId).length;
  console.log(`Com imagemHero atual: ${comHero} · sem: ${mensagens.length - comHero}\n`);

  const ids = mensagens.map((m) => m.id);
  let cursor = 0;
  let ok = 0, skip = 0, fail = 0;
  const tplStats: Record<ComposeTemplate, number> = { centro: 0, card: 0, full: 0, minimal: 0 };
  const t0 = Date.now();

  async function worker(workerId: number) {
    while (cursor < ids.length) {
      const idx = cursor++;
      const id = ids[idx]!;
      const r = await processOne(id, args);
      if (r.ok && r.template) {
        ok++;
        tplStats[r.template]++;
      } else if (r.ok) {
        skip++;
      } else {
        fail++;
        console.error(`  [w${workerId} ${idx + 1}/${ids.length}] FAIL ${id} | ${r.err}`);
      }
      if ((idx + 1) % 50 === 0) {
        const taxa = (idx + 1) / ((Date.now() - t0) / 1000);
        console.log(`  [progress] ${idx + 1}/${ids.length} | ok=${ok} skip=${skip} fail=${fail} | centro=${tplStats.centro} full=${tplStats.full} card=${tplStats.card} minimal=${tplStats.minimal} | ${taxa.toFixed(1)} msg/s`);
      }
    }
  }

  await Promise.all(Array.from({ length: args.concurrency }, (_, i) => worker(i + 1)));

  const elapsed = (Date.now() - t0) / 1000;
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ HERO OVERLAY CONCLUÍDO`);
  console.log(`   ${ok} novos · ${skip} skip · ${fail} fail`);
  console.log(`   templates: centro=${tplStats.centro} full=${tplStats.full} card=${tplStats.card} minimal=${tplStats.minimal}`);
  console.log(`   ⏱  ${(elapsed / 60).toFixed(1)}min`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
