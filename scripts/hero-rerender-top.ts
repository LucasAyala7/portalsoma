/**
 * Re-render hero das TOP N mensagens por engajamento usando Flux Pro com
 * prompt blueprint técnico (lente/lighting/materiais) — qualidade superior
 * ao Flux Schnell usado em massa antes.
 *
 * Default: top 30 mensagens (~R$ 7 Flux Pro). Usar --top=100 pra TOP 100 (~R$22).
 *
 * Substitui imagemHeroId pra novo Image record (modelo: "flux-pro-blueprint").
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
import { generateFluxImage, composeMessageImage, uploadBuffer } from "@nivertotal/images";
import type { ComposePaleta, ComposeTemplate } from "@nivertotal/images";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const prisma = new PrismaClient();

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

interface Args {
  top: number;
  offset: number;
  dryRun: boolean;
  force: boolean;
  concurrency: number;
  model: "pro" | "schnell";
}

function parseArgs(argv: string[]): Args {
  const out: Args = { top: 30, offset: 0, dryRun: false, force: false, concurrency: 2, model: "pro" };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    const [, k, v] = m;
    if (k === "top") out.top = Number(v);
    else if (k === "offset") out.offset = Number(v);
    else if (k === "dry-run") out.dryRun = true;
    else if (k === "force") out.force = true;
    else if (k === "concurrency") out.concurrency = Number(v);
    else if (k === "model") out.model = v === "schnell" ? "schnell" : "pro";
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

function pickTemplate(msgId: string): ComposeTemplate {
  let h = 0;
  for (let i = 0; i < msgId.length; i++) h = (h * 31 + msgId.charCodeAt(i)) >>> 0;
  const r = h % 100;
  if (r < 55) return "centro";
  if (r < 80) return "full";
  return "card";
}

function clampTexto(t: string, max = 55): string {
  const words = t.trim().split(/\s+/);
  if (words.length <= max) return t.trim();
  const cut = words.slice(0, max).join(" ");
  const lastDot = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  if (lastDot > cut.length * 0.6) return cut.slice(0, lastDot + 1);
  return cut + "…";
}

/**
 * Prompt blueprint técnico — versão refinada (lens, lighting, materials, exclusions explícitas).
 * Aplicado por cluster slug pra evitar imagem genérica.
 */
function promptBlueprint(clusterSlug: string, _msgTitulo: string): string {
  const lens = "shot on 85mm lens, f/1.8 shallow depth of field, ISO 200";
  const lighting = "soft natural daylight from large window left side, golden hour warmth, no harsh shadows, dreamy bokeh background";
  const style = "premium editorial photography, magazine quality, hyperreal, professional color grading, warm tones";
  const exclusions = "NO text, NO faces visible, NO logos, NO watermarks, NO writing, NO people";

  let subject = "";
  if (/mae|esposa|namorada|filha|amiga|noiva|sogra|tia|prima/.test(clusterSlug)) {
    subject = "delicate woman hands gently holding fresh peonies and pink roses bouquet, soft pastel rose petals scattered on white linen tablecloth, vintage lace handkerchief";
  } else if (/pai|filho|amigo|marido|tio|irmao|chefe|padrinho|sogro|genro/.test(clusterSlug)) {
    subject = "rustic dark walnut wooden table with vintage cracked-leather notebook, brass pocket watch with chain, antique fountain pen, single sprig of dried rosemary";
  } else if (/avo|bisne|idoso|100|95|90|80|75/.test(clusterSlug)) {
    subject = "vintage sepia-toned family photo album opened on lace doily, weathered pearl necklace, dried lavender flowers, antique gold-rimmed reading glasses, soft window light";
  } else if (/poema|reflexiva|gratidao|abencoada|biblica|crista|evangelica|catolica|gospel|espirita|pastor|padre/.test(clusterSlug)) {
    subject = "open antique leather-bound Bible on cream linen cloth, single white pillar candle gently lit casting warm glow, fresh white lily flower, golden divine sunbeam through window, peaceful sacred atmosphere";
  } else if (/casamento|bodas/.test(clusterSlug)) {
    subject = "two gold wedding rings resting on vintage lace doily, soft champagne glow background, fresh white roses and eucalyptus sprigs, dried wheat";
  } else if (/relacionamento|namoro/.test(clusterSlug)) {
    subject = "two warm coffee cups on rustic distressed wooden cafe table, twinkling fairy lights bokeh background, sunset window light, intimate cozy atmosphere, single rose petal";
  } else if (/mesversario|de-1-mes|de-3-meses|de-6-meses|de-9-meses|de-12-meses|baby|bebe/.test(clusterSlug)) {
    subject = "tiny knitted cream baby socks on soft fleece blanket, dried daisy flower, pastel pink satin ribbon, vintage silver rattle, dreamy nursery atmosphere";
  } else if (/whatsapp|status|engracada|engracado/.test(clusterSlug)) {
    subject = "colorful confetti scattered on soft pastel pink table, gold glitter sparkling, pastel balloons in soft focus background, golden ribbon curls, festive joyful celebration";
  } else if (/aniversario|niver/.test(clusterSlug)) {
    subject = "elegant birthday cake with three lit golden candles on white linen tablecloth, pastel balloons in dreamy soft focus background, gold confetti scattered, fresh flower petals";
  } else {
    subject = "elegant still life with fresh white peonies, lit beeswax candle, gold-rimmed champagne flute on linen, soft pastel colors";
  }

  return `${subject}, ${lighting}, ${style}, ${lens}, ${exclusions}`;
}

async function fetchAsDataUrl(url: string): Promise<string | undefined> {
  const key = url.startsWith(R2_PUBLIC_URL + "/") ? url.slice(R2_PUBLIC_URL.length + 1) : null;
  if (!key) return undefined;
  try {
    const out = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    const chunks: Buffer[] = [];
    const stream = out.Body as NodeJS.ReadableStream;
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const buf = Buffer.concat(chunks);
    return `data:${out.ContentType ?? "image/jpeg"};base64,${buf.toString("base64")}`;
  } catch {
    return undefined;
  }
}

interface JobResult {
  msgId: string;
  ok: boolean;
  custo: number;
  err?: string;
}

async function processOne(msgId: string, args: Args): Promise<JobResult> {
  const m = await prisma.mensagem.findUnique({
    where: { id: msgId },
    include: { cluster: true, persona: true, imagemHero: true },
  });
  if (!m) return { msgId, ok: false, custo: 0, err: "not found" };

  const blueprintModelo = args.model === "pro" ? "flux-pro-blueprint" : "flux-schnell-blueprint";
  if (!args.force && (m.imagemHero?.modelo === "flux-pro-blueprint" || m.imagemHero?.modelo === blueprintModelo)) {
    return { msgId, ok: true, custo: 0, err: "skip (já blueprint)" };
  }

  const prompt = promptBlueprint(m.cluster.slug, m.titulo);
  const keyBase = `mensagens/${m.id}/blueprint-${args.model}`;

  if (args.dryRun) {
    console.log(`  [dry] ${m.id} | ${m.cluster.slug} | ${args.model} | ${prompt.slice(0, 80)}...`);
    return { msgId, ok: true, custo: args.model === "pro" ? 0.05 : 0.01 };
  }

  let custoTotal = 0;
  let bgUrl: string | undefined;

  try {
    const flux = await generateFluxImage({
      prompt,
      model: args.model,
      formato: "hero",
      keyBase,
      alt: `Imagem editorial: ${m.titulo}`,
    });
    custoTotal += flux.custoBRL;
    bgUrl = flux.url;
  } catch (e) {
    return { msgId, ok: false, custo: custoTotal, err: e instanceof Error ? e.message : "flux fail" };
  }

  try {
    const bgDataUrl = bgUrl ? await fetchAsDataUrl(bgUrl) : undefined;
    const texto = clampTexto(m.conteudo, 55);
    const template = pickTemplate(m.id);
    const paleta = paletaForCluster(m.cluster.slug);
    const composed = await composeMessageImage({
      texto,
      autorNome: m.persona?.nome,
      template,
      paleta,
      formato: "hero",
      bgUrl: bgDataUrl,
    });
    const key = `mensagens/${m.id}/hero-blueprint-${args.model}.png`;
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
        modelo: blueprintModelo,
        promptUsado: prompt,
        custo: custoTotal,
      },
    });
    await prisma.mensagem.update({
      where: { id: m.id },
      data: { imagemHeroId: novaImg.id },
    });
    return { msgId, ok: true, custo: custoTotal };
  } catch (e) {
    return { msgId, ok: false, custo: custoTotal, err: e instanceof Error ? e.message : "compose fail" };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`\n🎨 HERO RE-RENDER TOP — top=${args.top} | concurrency=${args.concurrency} | dryRun=${args.dryRun}\n`);

  const top = await prisma.mensagem.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ likes: "desc" }, { copies: "desc" }, { visualizacoes: "desc" }],
    take: args.top + args.offset,
    select: { id: true },
  });

  const ids = top.slice(args.offset).map((m) => m.id);
  console.log(`Alvo: ${ids.length} mensagens TOP (offset=${args.offset})`);

  let cursor = 0;
  let ok = 0, fail = 0, custoTotal = 0;
  const t0 = Date.now();

  async function worker(workerId: number) {
    while (cursor < ids.length) {
      const idx = cursor++;
      const id = ids[idx]!;
      const r = await processOne(id, args);
      if (r.ok) {
        ok++;
        custoTotal += r.custo;
      } else {
        fail++;
        console.error(`  [w${workerId} ${idx + 1}/${ids.length}] FAIL ${id} | ${r.err}`);
      }
      if ((idx + 1) % 10 === 0) {
        const taxa = (idx + 1) / ((Date.now() - t0) / 1000);
        console.log(`  [progress] ${idx + 1}/${ids.length} | ok=${ok} fail=${fail} | R$ ${custoTotal.toFixed(2)} | ${taxa.toFixed(2)} msg/s`);
      }
    }
  }

  await Promise.all(Array.from({ length: args.concurrency }, (_, i) => worker(i + 1)));

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ HERO RE-RENDER CONCLUÍDO: ${ok} novos · ${fail} fail`);
  console.log(`   💸 Custo total: R$ ${custoTotal.toFixed(2)} (Flux Pro)`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
