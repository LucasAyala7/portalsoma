/**
 * Worker imagery: gera imagens de mensagens conforme tier.
 *
 * TIER_1: Flux Pro hero (1200x800) + Flux Pro OG (1200x630) + Pinterest vertical
 * TIER_2: Flux Schnell hero + OG programático
 * TIER_3: só OG programático (custo zero)
 */

import { Worker, type Job } from "bullmq";
import { prisma } from "@nivertotal/db";
import { generateFluxImage, generateOgProgramatic } from "@nivertotal/images";
import { redis, QUEUES, logJob, type ImageJobPayload } from "@nivertotal/workers-shared";

async function processarJob(job: Job<ImageJobPayload>) {
  const { mensagemId } = job.data;
  const t0 = Date.now();

  await logJob({ tipo: "generate_image", status: "running", payload: job.data });

  const mensagem = await prisma.mensagem.findUnique({
    where: { id: mensagemId },
    include: {
      cluster: true,
      complemento: true,
      autor: true,
    },
  });
  if (!mensagem) throw new Error(`Mensagem ${mensagemId} não encontrada`);

  const tier = job.data.tier ?? mensagem.tier;
  const keyBase = `mensagens/${mensagem.slug}`;
  let custoTotal = 0;
  const imagensCriadas: string[] = [];

  // Define paleta baseada no tipo do cluster
  const paleta = pickPaleta(mensagem.cluster.tipo, mensagem.cluster.slug);

  // ============ TIER_3: só OG programático ============
  if (tier === "TIER_3") {
    const og = await generateOgProgramatic({
      titulo: mensagem.titulo,
      destinatario: mensagem.cluster.nome,
      autorNome: mensagem.autor.nome,
      autorFotoUrl: mensagem.autor.fotoUrl ?? undefined,
      paletaSlug: paleta,
      formato: "og",
      keyBase,
    });
    const ogImg = await prisma.image.create({
      data: {
        url: og.url,
        formato: "og",
        width: og.width,
        height: og.height,
        alt: mensagem.titulo,
        modelo: "og-programatic",
        custo: 0,
      },
    });
    await prisma.mensagem.update({
      where: { id: mensagem.id },
      data: { imagemOgId: ogImg.id },
    });
    imagensCriadas.push("og");
  }

  // ============ TIER_2: Flux Schnell hero + OG programático ============
  if (tier === "TIER_2") {
    const heroPrompt = construirPromptHero(mensagem.cluster.nome, mensagem.cluster.tipo);
    const hero = await generateFluxImage({
      prompt: heroPrompt,
      model: "schnell",
      formato: "hero",
      keyBase,
      alt: `Imagem hero — ${mensagem.titulo}`,
    });
    const heroImg = await prisma.image.create({
      data: {
        url: hero.url,
        formato: "hero",
        width: hero.width,
        height: hero.height,
        alt: hero.alt,
        promptUsado: heroPrompt,
        modelo: hero.modelo,
        custo: hero.custoBRL,
      },
    });
    custoTotal += hero.custoBRL;

    const og = await generateOgProgramatic({
      titulo: mensagem.titulo,
      destinatario: mensagem.cluster.nome,
      autorNome: mensagem.autor.nome,
      autorFotoUrl: mensagem.autor.fotoUrl ?? undefined,
      paletaSlug: paleta,
      formato: "og",
      keyBase,
    });
    const ogImg = await prisma.image.create({
      data: {
        url: og.url,
        formato: "og",
        width: og.width,
        height: og.height,
        alt: mensagem.titulo,
        modelo: "og-programatic",
        custo: 0,
      },
    });

    await prisma.mensagem.update({
      where: { id: mensagem.id },
      data: { imagemHeroId: heroImg.id, imagemOgId: ogImg.id },
    });
    imagensCriadas.push("hero", "og");
  }

  // ============ TIER_1: Flux Pro hero + Flux Pro OG + Pinterest ============
  if (tier === "TIER_1") {
    const heroPrompt = construirPromptHero(mensagem.cluster.nome, mensagem.cluster.tipo);
    const hero = await generateFluxImage({
      prompt: heroPrompt,
      model: "pro",
      formato: "hero",
      keyBase,
      alt: `Imagem hero — ${mensagem.titulo}`,
    });
    const heroImg = await prisma.image.create({
      data: {
        url: hero.url,
        formato: "hero",
        width: hero.width,
        height: hero.height,
        alt: hero.alt,
        promptUsado: heroPrompt,
        modelo: hero.modelo,
        custo: hero.custoBRL,
      },
    });
    custoTotal += hero.custoBRL;

    const ogPrompt = `${heroPrompt}, composition optimized for social media preview, centered`;
    const og = await generateFluxImage({
      prompt: ogPrompt,
      model: "pro",
      formato: "og",
      keyBase,
      alt: mensagem.titulo,
    });
    const ogImg = await prisma.image.create({
      data: {
        url: og.url,
        formato: "og",
        width: og.width,
        height: og.height,
        alt: og.alt,
        promptUsado: ogPrompt,
        modelo: og.modelo,
        custo: og.custoBRL,
      },
    });
    custoTotal += og.custoBRL;

    const pinPrompt = `${heroPrompt}, vertical composition, decorative typography space at top, Pinterest-style`;
    const pin = await generateFluxImage({
      prompt: pinPrompt,
      model: "pro",
      formato: "pinterest",
      keyBase,
      alt: mensagem.titulo,
    });
    const pinImg = await prisma.image.create({
      data: {
        url: pin.url,
        formato: "pinterest",
        width: pin.width,
        height: pin.height,
        alt: pin.alt,
        promptUsado: pinPrompt,
        modelo: pin.modelo,
        custo: pin.custoBRL,
      },
    });
    custoTotal += pin.custoBRL;

    await prisma.mensagem.update({
      where: { id: mensagem.id },
      data: {
        imagemHeroId: heroImg.id,
        imagemOgId: ogImg.id,
        imagemPinId: pinImg.id,
      },
    });
    imagensCriadas.push("hero", "og", "pinterest");
  }

  await logJob({
    tipo: "generate_image",
    status: "success",
    payload: job.data,
    resultado: { tier, imagens: imagensCriadas },
    custo: custoTotal,
    duracao: Date.now() - t0,
  });

  console.log(`[imagery] ✓ ${mensagemId} ${tier} (${imagensCriadas.join(",")}) R$${custoTotal.toFixed(3)}`);
}

function construirPromptHero(clusterNome: string, tipo: string): string {
  // ATENÇÃO: este prompt gera APENAS BACKGROUND atmosférico.
  // O texto da mensagem é sobreposto depois via composeMessageImage (Satori).
  // Nunca peça pro Flux escrever texto — ele erra acentos PT-BR e a tipografia escapa do nosso controle.
  const base = `atmospheric ambient background, warm cinematic lighting, golden hour, soft bokeh, dreamy depth of field, hyperrealistic photography, shot on Canon R5, 50mm f/1.4, editorial style`;
  const exclusoes = `Avoid at all costs: any text, letters, words, signs, banners, captions, clipart, plastic look, stock photo aesthetic, cake clipart, generic balloons, AI uncanny artifacts, watermarks, logos, faces in close-up (we want ambient/atmosphere)`;

  let especifico = "";
  if (clusterNome.includes("Mãe") || clusterNome.includes("Avó")) {
    especifico = "warm wooden surface with peonies and morning sunlight, soft fabric textures, no text";
  } else if (clusterNome.includes("Filha") || clusterNome.includes("Filho")) {
    especifico = "elegant cake with sparkler candle in soft focus, pastel decorations, blurred family setting in background, no text";
  } else if (clusterNome.includes("Amiga") || clusterNome.includes("Amigo")) {
    especifico = "festive table edge with confetti and champagne glasses, warm tones, candid mood, no text";
  } else if (tipo === "FALECIDO") {
    especifico = "single white candle next to white roses, soft window light, peaceful empty atmosphere, no text";
  } else if (tipo === "TOM" && (clusterNome.includes("Evangélica") || clusterNome.includes("Bíblica"))) {
    especifico = "open book pages with morning light streaming through window, peaceful sacred atmosphere, white flowers nearby, no readable text";
  } else {
    especifico = "elegant celebration setup with cake and flowers in soft focus, ambient warm light, no text";
  }

  return `${especifico}, ${base}. ${exclusoes}`;
}

function pickPaleta(tipo: string, slug: string): "warm" | "rose" | "sky" | "violet" | "emerald" {
  if (tipo === "FALECIDO") return "sky";
  if (slug.includes("evangelica") || slug.includes("biblica") || slug.includes("catolica")) return "violet";
  if (slug.includes("amiga") || slug.includes("filha") || slug.includes("mae")) return "rose";
  if (slug.includes("amigo") || slug.includes("pai") || slug.includes("filho")) return "emerald";
  return "warm";
}

const worker = new Worker<ImageJobPayload>(QUEUES.IMAGE, processarJob, {
  connection: redis(),
  concurrency: 2,
});

worker.on("failed", async (job, err) => {
  console.error(`[imagery] job ${job?.id} falhou:`, err.message);
  await logJob({
    tipo: "generate_image",
    status: "failed",
    payload: job?.data ?? {},
    erro: err.message,
  });
});

console.log(`▶ Worker imagery rodando (queue: ${QUEUES.IMAGE})`);
