/**
 * Geração de imagens em batch — 3 tiers baseado no volumeMensal do cluster.
 *
 * TIER_1 (≥ 50k vol): Flux Pro hero + Satori OG (~R$ 0.22/msg)
 * TIER_2 (10-50k):     Flux Schnell hero + Satori OG (~R$ 0.02/msg)
 * TIER_3 (1k-10k):     só Satori OG (R$ 0)
 * < 1k:                pula (cauda longa, deploy sem hero)
 *
 * Persistência: cria Image records + linka com Mensagem via imagemHeroId/imagemOgId.
 * Skip-existing: se a mensagem já tem imagemHeroId, pula.
 */

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local = dirname(__filename_local);
const WORKSPACE_ROOT = resolve(__dirname_local, "..");
process.env.WORKSPACE_ROOT = WORKSPACE_ROOT;
const envPath = resolve(WORKSPACE_ROOT, ".env");
const envResult = config({ path: envPath });
if (envResult.error) console.warn("[env] dotenv error:", envResult.error.message);
else console.log(`[env] loaded ${Object.keys(envResult.parsed ?? {}).length} vars from ${envPath}`);
if (!process.env.REPLICATE_API_TOKEN) console.warn("[env] REPLICATE_API_TOKEN não disponível após carregar .env");

import { PrismaClient } from "@prisma/client";
import { generateFluxImage, composeMessageImage, pickTemplate, uploadBuffer } from "@nivertotal/images";
import type { ComposePaleta } from "@nivertotal/images";
import { readFile } from "node:fs/promises";

/** Converte URL local "/img/..." em data:image/jpeg;base64,... pra passar pro Satori */
async function urlToDataUrl(url: string): Promise<string | undefined> {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  // URL local relativa tipo /img/mensagens/.../tier_2-hero.jpg → resolve em IMAGE_LOCAL_DIR
  const localDir = process.env.IMAGE_LOCAL_DIR ?? "apps/web/public/img";
  const publicPrefix = process.env.IMAGE_LOCAL_PUBLIC_URL ?? "/img";
  const relPath = url.startsWith(publicPrefix) ? url.slice(publicPrefix.length).replace(/^\//, "") : url.replace(/^\//, "");
  const filePath = resolve(__dirname_local, "..", localDir, relPath);
  try {
    const buf = await readFile(filePath);
    const ext = filePath.toLowerCase().endsWith(".png") ? "png" : "jpeg";
    return `data:image/${ext};base64,${buf.toString("base64")}`;
  } catch (e) {
    console.warn(`  [warn] url→dataUrl failed: ${filePath}:`, e instanceof Error ? e.message : e);
    return undefined;
  }
}

const prisma = new PrismaClient();

interface Args {
  limit?: number;
  tier1Only?: boolean;
  tier2Only?: boolean;
  ogOnly?: boolean;
  skipExisting?: boolean;
  dryRun?: boolean;
  concurrency?: number;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { skipExisting: true, concurrency: 2 };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    const [, key, val] = m;
    if (key === "limit") out.limit = Number(val);
    else if (key === "concurrency") out.concurrency = Number(val);
    else if (key === "tier1-only") out.tier1Only = true;
    else if (key === "tier2-only") out.tier2Only = true;
    else if (key === "og-only") out.ogOnly = true;
    else if (key === "no-skip") out.skipExisting = false;
    else if (key === "dry-run") out.dryRun = true;
  }
  return out;
}

// Paleta de cores por tipo de cluster (baseado no slug)
function paletaForCluster(slug: string): ComposePaleta {
  if (/mae|esposa|namorada|filha|amiga|noiva|sogra|tia|prima|enteada|afilhada|madrinha|pastora|cunhada|sobrinha|bisneta|neta|bonita|romantica/.test(slug)) return "rose";
  if (/pai|filho|amigo|marido|tio|irmao|sobrinho|chefe|cunhado|patrao|padrinho|padre|pastor|namorado|enteado|afilhado|colega|cliente|lider|homem|sogro|genro/.test(slug)) return "sky";
  if (/avo|bisne|idoso|100|95|90|80|75/.test(slug)) return "amber";
  if (/poema|reflexiva|gratidao|abencoada|biblica|crista|evangelica|catolica|gospel|espirita/.test(slug)) return "violet";
  if (/casamento|bodas|relacionamento|namoro/.test(slug)) return "emerald";
  if (/mes|ano|mesversario|baby|bebe/.test(slug)) return "warm";
  return "warm";
}

// Prompt visual baseado em cluster (sem chamar Claude — template fixo)
function promptForCluster(slug: string, nome: string): string {
  const lower = slug.toLowerCase();
  const baseStyle =
    "soft pastel watercolor texture, dreamy bokeh light, premium editorial photography, " +
    "warm golden hour lighting, blurred background, no text, no people faces, no logos";

  if (/mae|esposa|namorada|filha|amiga|noiva|sogra|tia|prima|cunhada|sobrinha|bisneta|neta|enteada|afilhada|madrinha/.test(lower)) {
    return `delicate hands holding fresh roses and peonies bouquet, soft rose petals scattered on linen tablecloth, ${baseStyle}`;
  }
  if (/pai|filho|amigo|marido|tio|irmao|sobrinho|chefe|cunhado|padrinho|padre|pastor|namorado|enteado|afilhado|colega|cliente|lider|homem|sogro|genro/.test(lower)) {
    return `rustic wooden table with vintage leather notebook, fountain pen, brass pocket watch, soft window light, ${baseStyle}`;
  }
  if (/avo|bisne|idoso|100-anos|95-anos|90-anos|80-anos|75-anos|70-anos/.test(lower)) {
    return `vintage sepia photo album, dried wildflowers, antique pearl necklace on lace doily, soft window light, nostalgic, ${baseStyle}`;
  }
  if (/poema|reflexiva|gratidao|abencoada|biblica|crista|evangelica|catolica|gospel|espirita/.test(lower)) {
    return `open Bible on linen cloth, single white candle softly lit, fresh white lily, golden divine sunbeam, peaceful, sacred atmosphere, ${baseStyle}`;
  }
  if (/casamento|bodas/.test(lower)) {
    return `golden wedding rings on lace doily, soft champagne glow, white roses and eucalyptus, ${baseStyle}`;
  }
  if (/relacionamento|namoro/.test(lower)) {
    return `two coffee cups on wooden cafe table, fairy lights bokeh, sunset window, intimate cozy atmosphere, ${baseStyle}`;
  }
  if (/mesversario|de-1-mes|de-3-meses|de-6-meses|de-9-meses|de-10-meses|de-12-meses|baby|bebe/.test(lower)) {
    return `tiny baby socks on knitted cream blanket, soft pastel ribbon, dried daisy, dreamy nursery, ${baseStyle}`;
  }
  if (/whatsapp|status|engracada|engracado/.test(lower)) {
    return `colorful confetti scattered on pastel pink table, balloons in soft focus, golden glitter, festive joyful celebration, ${baseStyle}`;
  }
  if (/aniversario|niver/.test(lower)) {
    return `birthday cake with lit candles on white tablecloth, soft pastel balloons in background, gold confetti, dreamy bokeh, ${baseStyle}`;
  }
  return `birthday celebration scene, pastel colors, balloons, flowers, soft light, dreamy bokeh, ${baseStyle}`;
}

interface JobResult {
  msgId: string;
  ok: boolean;
  tier: "TIER_1" | "TIER_2" | "TIER_3";
  custo: number;
  err?: string;
}

async function processMessage(
  msgId: string,
  args: Args,
): Promise<JobResult> {
  const m = await prisma.mensagem.findUnique({
    where: { id: msgId },
    include: { cluster: true, persona: true },
  });
  if (!m) return { msgId, ok: false, tier: "TIER_3", custo: 0, err: "not found" };

  const vol = m.cluster.volumeMensal ?? 0;
  const tier: "TIER_1" | "TIER_2" | "TIER_3" =
    vol >= 50000 ? "TIER_1" : vol >= 10000 ? "TIER_2" : "TIER_3";

  // Mode-specific filters first (--og-only deve ignorar skip de hero)
  if (args.tier1Only && tier !== "TIER_1") return { msgId, ok: true, tier, custo: 0, err: "skip (não tier1)" };
  if (args.tier2Only && tier !== "TIER_2") return { msgId, ok: true, tier, custo: 0, err: "skip (não tier2)" };
  if (args.ogOnly) {
    // só OG, sem Flux
    return processOgOnly(m, tier, !!args.skipExisting);
  }
  // Skip de hero só vale quando NÃO é og-only
  if (args.skipExisting && m.imagemHeroId) {
    return { msgId, ok: true, tier, custo: 0, err: "skip (já tem hero)" };
  }

  let custo = 0;
  let bgUrl: string | undefined;
  let heroDbId: string | null = null;

  // Gerar Flux pro TIER_1 e TIER_2
  if (tier === "TIER_1" || tier === "TIER_2") {
    const fluxModel = tier === "TIER_1" ? "pro" : "schnell";
    const prompt = promptForCluster(m.cluster.slug, m.cluster.nome);
    const keyBase = `mensagens/${m.id}/${tier.toLowerCase()}`;

    if (args.dryRun) {
      console.log(`  [dry] ${tier} ${m.cluster.slug} | ${prompt.slice(0, 80)}...`);
      return { msgId, ok: true, tier, custo: tier === "TIER_1" ? 0.22 : 0.02 };
    }

    try {
      const flux = await generateFluxImage({
        prompt,
        model: fluxModel,
        formato: "hero",
        keyBase,
        alt: `Imagem ilustrativa: ${m.titulo}`,
      });
      custo += flux.custoBRL;
      bgUrl = flux.url;

      const heroImg = await prisma.image.create({
        data: {
          url: flux.url,
          formato: "hero",
          width: flux.width,
          height: flux.height,
          alt: flux.alt,
          promptUsado: flux.promptUsado,
          modelo: flux.modelo,
          custo: flux.custoBRL,
        },
      });
      heroDbId = heroImg.id;
    } catch (e) {
      return { msgId, ok: false, tier, custo, err: e instanceof Error ? e.message : "flux fail" };
    }
  }

  // Compose OG via Satori (todos os tiers)
  // Satori precisa URL absoluta — se bgUrl for local, converte pra data: URL
  let ogDbId: string | null = null;
  try {
    const paleta = paletaForCluster(m.cluster.slug);
    const bgForSatori = bgUrl ? await urlToDataUrl(bgUrl) : undefined;
    const template = pickTemplate(m.conteudo, !!bgForSatori);
    const ogResult = await composeMessageImage({
      texto: m.resumo ?? m.titulo,
      autorNome: m.persona?.nome,
      template,
      paleta,
      formato: "og",
      bgUrl: bgForSatori,
    });
    const ogKey = `mensagens/${m.id}/og.png`;
    const uploaded = await uploadBuffer({
      key: ogKey,
      buffer: ogResult.buffer,
      contentType: "image/png",
    });
    const ogImg = await prisma.image.create({
      data: {
        url: uploaded.url,
        formato: "og",
        width: ogResult.width,
        height: ogResult.height,
        alt: `Quote card: ${m.titulo}`,
        modelo: "og-programatic",
        custo: 0,
      },
    });
    ogDbId = ogImg.id;
  } catch (e) {
    console.warn(`  [warn] OG fail ${m.id}:`, e instanceof Error ? e.message : e);
  }

  // Linka com Mensagem
  await prisma.mensagem.update({
    where: { id: m.id },
    data: { imagemHeroId: heroDbId, imagemOgId: ogDbId },
  });

  return { msgId, ok: true, tier, custo };
}

async function processOgOnly(m: any, tier: "TIER_1" | "TIER_2" | "TIER_3", skipExisting: boolean): Promise<JobResult> {
  if (skipExisting && m.imagemOgId) return { msgId: m.id, ok: true, tier, custo: 0, err: "skip (já tem og)" };

  try {
    const paleta = paletaForCluster(m.cluster.slug);
    const ogResult = await composeMessageImage({
      texto: m.resumo ?? m.titulo,
      autorNome: m.persona?.nome,
      template: "minimal",
      paleta,
      formato: "og",
    });
    const ogKey = `mensagens/${m.id}/og.png`;
    const uploaded = await uploadBuffer({
      key: ogKey,
      buffer: ogResult.buffer,
      contentType: "image/png",
    });
    const ogImg = await prisma.image.create({
      data: {
        url: uploaded.url,
        formato: "og",
        width: ogResult.width,
        height: ogResult.height,
        alt: `Quote card: ${m.titulo}`,
        modelo: "og-programatic",
        custo: 0,
      },
    });
    await prisma.mensagem.update({ where: { id: m.id }, data: { imagemOgId: ogImg.id } });
    return { msgId: m.id, ok: true, tier, custo: 0 };
  } catch (e) {
    return { msgId: m.id, ok: false, tier, custo: 0, err: e instanceof Error ? e.message : "og fail" };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log("\n🎨 GERAÇÃO DE IMAGENS — args:", args, "\n");

  // Pega mensagens publicadas, ordenadas por volumeMensal do cluster (desc)
  const mensagens = await prisma.mensagem.findMany({
    where: { status: "PUBLISHED" },
    include: { cluster: true },
    take: args.limit,
  });

  // Ordena por volume cluster desc
  mensagens.sort((a, b) => (b.cluster.volumeMensal ?? 0) - (a.cluster.volumeMensal ?? 0));

  // Distribuição por tier
  const tiers = { TIER_1: 0, TIER_2: 0, TIER_3: 0, skip: 0 };
  for (const m of mensagens) {
    const v = m.cluster.volumeMensal ?? 0;
    if (v >= 50000) tiers.TIER_1++;
    else if (v >= 10000) tiers.TIER_2++;
    else if (v >= 1000) tiers.TIER_3++;
    else tiers.skip++;
  }
  console.log(`Distribuição: TIER_1=${tiers.TIER_1} TIER_2=${tiers.TIER_2} TIER_3=${tiers.TIER_3} (sem-img=${tiers.skip})`);

  let alvo = mensagens;
  // Filtros
  if (args.tier1Only) alvo = alvo.filter((m) => (m.cluster.volumeMensal ?? 0) >= 50000);
  else if (args.tier2Only) alvo = alvo.filter((m) => {
    const v = m.cluster.volumeMensal ?? 0;
    return v >= 10000 && v < 50000;
  });
  // og-only e default: cobre 100% (cauda longa também leva OG Satori grátis)
  // (sem filtro de volume)

  console.log(`Alvo: ${alvo.length} mensagens\n`);

  if (alvo.length === 0) {
    console.log("Nada a fazer.");
    await prisma.$disconnect();
    return;
  }

  // Worker pool
  const t0 = Date.now();
  const ids = alvo.map((m) => m.id);
  let cursor = 0;
  let ok = 0, fail = 0, custoTotal = 0;
  const tierStats = { TIER_1: 0, TIER_2: 0, TIER_3: 0 };

  async function worker(workerId: number) {
    while (cursor < ids.length) {
      const idx = cursor++;
      const id = ids[idx]!;
      const r = await processMessage(id, args);
      if (r.ok) {
        ok++;
        custoTotal += r.custo;
        tierStats[r.tier]++;
      } else {
        fail++;
        console.error(`  [w${workerId} ${idx + 1}/${ids.length}] FAIL ${id} | ${r.err}`);
      }
      if ((idx + 1) % 20 === 0) {
        const taxa = (idx + 1) / ((Date.now() - t0) / 1000);
        console.log(`  [progress] ${idx + 1}/${ids.length} | ok=${ok} fail=${fail} | T1=${tierStats.TIER_1} T2=${tierStats.TIER_2} T3=${tierStats.TIER_3} | R$ ${custoTotal.toFixed(2)} | ${taxa.toFixed(1)} msg/s`);
      }
    }
  }

  await Promise.all(Array.from({ length: args.concurrency ?? 2 }, (_, i) => worker(i + 1)));

  const elapsed = (Date.now() - t0) / 1000;
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ GERAÇÃO DE IMAGENS CONCLUÍDA`);
  console.log(`   ${ok} OK · ${fail} FAIL`);
  console.log(`   T1=${tierStats.TIER_1} T2=${tierStats.TIER_2} T3=${tierStats.TIER_3}`);
  console.log(`   💰 R$ ${custoTotal.toFixed(2)}`);
  console.log(`   ⏱  ${(elapsed / 60).toFixed(1)}min`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
