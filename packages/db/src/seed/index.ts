/**
 * Seed orchestrator.
 * Roda: nicho → clusters → complementos → autores reais → personas + autores virtuais.
 *
 * Uso:
 *   pnpm db:seed
 */

import { prisma } from "../index.js";
import { NICHO_SEED, CLUSTERS_SEED } from "./taxonomia";
import { PERSONAS_SEED } from "./personas";
import { MENSAGENS_SEED } from "./mensagens";
import { IMAGENS_SEED } from "./imagens";

async function seedNichoETaxonomia() {
  console.log("\n[seed] nicho + clusters + complementos");

  const nicho = await prisma.nicho.upsert({
    where: { slug: NICHO_SEED.slug },
    create: NICHO_SEED,
    update: {
      nome: NICHO_SEED.nome,
      headTerm: NICHO_SEED.headTerm,
      volumeMensal: NICHO_SEED.volumeMensal,
      descricao: NICHO_SEED.descricao,
      metaTitle: NICHO_SEED.metaTitle,
      metaDesc: NICHO_SEED.metaDesc,
    },
  });
  console.log(`  ✓ nicho ${nicho.slug}`);

  let clustersCount = 0;
  let complementosCount = 0;

  for (const c of CLUSTERS_SEED) {
    const cluster = await prisma.cluster.upsert({
      where: { nichoId_slug: { nichoId: nicho.id, slug: c.slug } },
      create: {
        slug: c.slug,
        nome: c.nome,
        prefixoSlug: c.prefixoSlug,
        tipo: c.tipo,
        headKeyword: c.headKeyword,
        volumeMensal: c.volumeMensal,
        permiteEmpilhar: c.volumeMensal >= 1000,
        descricao: c.descricao,
        nichoId: nicho.id,
      },
      update: {
        nome: c.nome,
        headKeyword: c.headKeyword,
        volumeMensal: c.volumeMensal,
        permiteEmpilhar: c.volumeMensal >= 1000,
      },
    });
    clustersCount++;

    if (c.complementos) {
      for (const cp of c.complementos) {
        await prisma.complemento.upsert({
          where: { clusterId_slug: { clusterId: cluster.id, slug: cp.slug } },
          create: {
            slug: cp.slug,
            nome: cp.nome,
            headKeyword: cp.headKeyword,
            volumeMensal: cp.volumeMensal,
            descricao: cp.descricao,
            clusterId: cluster.id,
          },
          update: {
            nome: cp.nome,
            headKeyword: cp.headKeyword,
            volumeMensal: cp.volumeMensal,
          },
        });
        complementosCount++;
      }
    }
  }

  console.log(`  ✓ ${clustersCount} clusters`);
  console.log(`  ✓ ${complementosCount} complementos`);
}

async function seedAutoresReais() {
  console.log("\n[seed] autores reais (Lucas, Carlos)");
  const reais = [
    {
      slug: "lucas-ayala",
      nome: "Lucas Ayala",
      real: true,
      email: "lucas@portalsoma.com.br",
      bio: "Fundador do Portal Soma. Escreve sobre o que toca o coração — porque uma boa mensagem pode mudar um dia inteiro.",
    },
    {
      slug: "equipe-editorial",
      nome: "Equipe Editorial",
      real: true,
      bio: "O time que cuida das mensagens do Portal Soma — escolhendo, revisando e garantindo que cada uma chegue com o cuidado que merece.",
    },
  ];

  for (const a of reais) {
    await prisma.author.upsert({
      where: { slug: a.slug },
      create: a,
      update: { nome: a.nome, bio: a.bio },
    });
  }
  console.log(`  ✓ ${reais.length} autores reais`);
}

async function seedPersonas() {
  console.log("\n[seed] personas (autores virtuais)");
  for (const p of PERSONAS_SEED) {
    const author = await prisma.author.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        nome: p.nome,
        real: false,
        bio: p.bio,
      },
      update: { nome: p.nome, bio: p.bio },
    });

    await prisma.persona.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        nome: p.nome,
        vozPrompt: p.vozPrompt,
        fotoPrompt: p.fotoPrompt,
        caracteristicas: p.caracteristicas,
        pesos: p.pesos,
        autorId: author.id,
      },
      update: {
        vozPrompt: p.vozPrompt,
        fotoPrompt: p.fotoPrompt,
        caracteristicas: p.caracteristicas,
        pesos: p.pesos,
      },
    });
  }
  console.log(`  ✓ ${PERSONAS_SEED.length} personas`);
}

async function seedMensagens() {
  console.log("\n[seed] mensagens manuais");

  const equipe = await prisma.author.findUnique({ where: { slug: "equipe-editorial" } });
  if (!equipe) throw new Error("Autor equipe-editorial não encontrado");

  // Likes/copies/shares fictícios pra dar vida ao front
  // (números proporcionais ao tier — destacadas viram trending)
  function gerarEngajamento(tier?: string, destacada?: boolean) {
    const base = destacada ? 8 : tier === "TIER_1" ? 5 : tier === "TIER_2" ? 2 : 1;
    return {
      likes: Math.floor(15 * base + Math.random() * 30 * base),
      copies: Math.floor(20 * base + Math.random() * 40 * base),
      shares: Math.floor(8 * base + Math.random() * 20 * base),
      visualizacoes: Math.floor(80 * base + Math.random() * 200 * base),
    };
  }

  let count = 0;
  for (const m of MENSAGENS_SEED) {
    const cluster = await prisma.cluster.findFirst({
      where: { slug: m.clusterSlug, ativo: true },
    });
    if (!cluster) {
      console.warn(`  ⚠ cluster "${m.clusterSlug}" não encontrado, pulando`);
      continue;
    }
    const complemento = m.complementoSlug
      ? await prisma.complemento.findFirst({
          where: { slug: m.complementoSlug, clusterId: cluster.id, ativo: true },
        })
      : null;
    const persona = await prisma.persona.findUnique({ where: { slug: m.personaSlug } });
    if (!persona) {
      console.warn(`  ⚠ persona "${m.personaSlug}" não encontrada, pulando`);
      continue;
    }
    const autor = persona.autorId
      ? await prisma.author.findUnique({ where: { id: persona.autorId } })
      : equipe;

    const engaj = gerarEngajamento(m.tier, m.destacada);

    await prisma.mensagem.upsert({
      where: { slug: m.slug },
      create: {
        slug: m.slug,
        titulo: m.titulo,
        conteudo: m.conteudo,
        resumo: m.resumo,
        clusterId: cluster.id,
        complementoId: complemento?.id,
        autorId: autor?.id ?? equipe.id,
        personaId: persona.id,
        status: "PUBLISHED",
        tier: m.tier ?? "TIER_3",
        origem: "MANUAL",
        publicadoEm: new Date(),
        qualidade: 0.92,
        likes: engaj.likes,
        copies: engaj.copies,
        shares: engaj.shares,
        visualizacoes: engaj.visualizacoes,
      },
      update: {
        titulo: m.titulo,
        conteudo: m.conteudo,
        resumo: m.resumo,
        complementoId: complemento?.id,
        // counts NÃO são sobrescritos em re-seed — preserva engajamento real
        // que cresce a partir do baseline criado no primeiro seed
      },
    });
    count++;
  }

  console.log(`  ✓ ${count} mensagens`);
}

async function seedImagens() {
  console.log("\n[seed] imagens hero (placeholders Unsplash)");
  let count = 0;
  for (const img of IMAGENS_SEED) {
    const mensagem = await prisma.mensagem.findUnique({ where: { slug: img.mensagemSlug } });
    if (!mensagem) {
      console.warn(`  ⚠ mensagem "${img.mensagemSlug}" não encontrada, pulando`);
      continue;
    }
    if (mensagem.imagemHeroId) continue; // já tem imagem, não sobrescreve

    const imagem = await prisma.image.create({
      data: {
        url: img.url,
        formato: img.formato ?? "hero",
        width: img.width,
        height: img.height,
        alt: img.alt,
        modelo: "unsplash-placeholder",
        custo: 0,
      },
    });
    await prisma.mensagem.update({
      where: { id: mensagem.id },
      data: { imagemHeroId: imagem.id },
    });
    count++;
  }
  console.log(`  ✓ ${count} imagens vinculadas`);
}

async function main() {
  console.log("======================================");
  console.log("Portal Soma — Seed");
  console.log("======================================");

  await seedNichoETaxonomia();
  await seedAutoresReais();
  await seedPersonas();
  await seedMensagens();
  await seedImagens();

  console.log("\n✅ Seed concluído\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
