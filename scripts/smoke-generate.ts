/**
 * Smoke test v2: gera 4 mensagens reais cobrindo todos os tipos (CURTA/MEDIA/LONGA/POEMA).
 * Mostra titulo + metaTitle + metaDescription + conteudo + qualidade + custo.
 * Salva como REVIEW (com hashes) pra Lucas ver no admin.
 */

import { prisma } from "@nivertotal/db";
import { generateMensagem } from "@nivertotal/ai";

interface TestCase {
  clusterSlug: string;
  complementoSlug?: string;
  personaSlug: string;
  tipo: "CURTA" | "MEDIA" | "LONGA" | "POEMA";
}

const TESTS: TestCase[] = [
  // 1. Júlia (poeta) → para-amiga, POEMA
  {
    clusterSlug: "para-amiga",
    personaSlug: "julia-poeta",
    tipo: "POEMA",
  },
  // 2. Pastor Antônio → para-mae/evangelica, LONGA
  {
    clusterSlug: "para-mae",
    complementoSlug: "evangelica",
    personaSlug: "pastor-antonio",
    tipo: "LONGA",
  },
  // 3. Marcos descolado → no-whatsapp, CURTA
  {
    clusterSlug: "no-whatsapp",
    personaSlug: "marcos-pai",
    tipo: "CURTA",
  },
  // 4. Profa. Beatriz → para-irma, MEDIA
  {
    clusterSlug: "para-irma",
    personaSlug: "profa-beatriz",
    tipo: "MEDIA",
  },
];

async function main() {
  console.log("\n🧪 SMOKE TEST v2 — Gerando 4 mensagens cobrindo todos os tipos\n");

  const equipe = await prisma.author.findUnique({ where: { slug: "equipe-editorial" } });
  if (!equipe) throw new Error("autor equipe-editorial não encontrado");

  let custoTotal = 0;
  let aceitas = 0;

  for (let i = 0; i < TESTS.length; i++) {
    const test = TESTS[i]!;
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[${i + 1}/${TESTS.length}] ${test.personaSlug} → ${test.clusterSlug}${test.complementoSlug ? "/" + test.complementoSlug : ""} (${test.tipo})`);

    const cluster = await prisma.cluster.findFirst({
      where: { slug: test.clusterSlug, ativo: true },
    });
    if (!cluster) {
      console.warn(`⚠ cluster "${test.clusterSlug}" não encontrado`);
      continue;
    }

    const complemento = test.complementoSlug
      ? await prisma.complemento.findFirst({
          where: { slug: test.complementoSlug, clusterId: cluster.id, ativo: true },
        })
      : null;

    const persona = await prisma.persona.findUnique({ where: { slug: test.personaSlug } });
    if (!persona) {
      console.warn(`⚠ persona "${test.personaSlug}" não encontrada`);
      continue;
    }

    // Mensagens recentes do cluster (anti-similaridade)
    const recentes = await prisma.mensagem.findMany({
      where: { clusterId: cluster.id, status: { in: ["PUBLISHED", "REVIEW"] } },
      orderBy: { criadoEm: "desc" },
      take: 5,
      select: { conteudo: true },
    });

    // Títulos cross-cluster pra evitar repetição (limite 50 mais recentes)
    const titulosExistentes = await prisma.mensagem.findMany({
      where: { status: { in: ["PUBLISHED", "REVIEW"] } },
      orderBy: { criadoEm: "desc" },
      take: 50,
      select: { titulo: true },
    });

    const t0 = Date.now();
    try {
      const result = await generateMensagem({
        vozPrompt: persona.vozPrompt,
        cluster: {
          nome: cluster.nome,
          headKeyword: cluster.headKeyword,
          tipo: cluster.tipo,
        },
        complemento: complemento
          ? { nome: complemento.nome, headKeyword: complemento.headKeyword }
          : null,
        similares: recentes.map((m) => m.conteudo),
        tipo: test.tipo,
        titulosEvitar: titulosExistentes.map((m) => m.titulo),
      });

      const elapsed = Date.now() - t0;
      custoTotal += result.custo.estimadoBRL;

      console.log(`\n📝 H1 (${result.payload.titulo.length} chars): ${result.payload.titulo}`);
      console.log(`🔖 metaTitle (${result.payload.metaTitle.length} chars): ${result.payload.metaTitle}`);
      console.log(`📄 metaDescription (${result.payload.metaDescription.length} chars): ${result.payload.metaDescription}`);
      console.log(`\n📖 CONTEÚDO (${result.wordCount} palavras):\n${result.payload.conteudo}`);
      console.log(`\n💬 RESUMO: ${result.payload.resumo}`);
      console.log(`\n📊 Qualidade: ${(result.qualidade.score * 100).toFixed(0)}% (${result.qualidade.status})`);
      if (result.qualidade.issues.length > 0) {
        console.log(`   Issues:`);
        for (const issue of result.qualidade.issues) {
          console.log(`   - [${issue.tipo}] ${issue.detalhe} (peso ${issue.peso})`);
        }
      }
      console.log(`\n⏱  ${elapsed}ms · 💰 R$ ${result.custo.estimadoBRL.toFixed(4)} · 🔄 ${result.tentativas} tentativa(s)`);
      console.log(`   Tokens: in=${result.custo.inputTokens} out=${result.custo.outputTokens} cache=${result.custo.cacheReadTokens}`);
      console.log(`   Hashes: t=${result.hashes.titulo} mt=${result.hashes.metaTitle} c=${result.hashes.conteudo}`);

      // Check de uniqueness DB-wide via hashes
      const dupTitulo = await prisma.mensagem.findFirst({ where: { hashTitulo: result.hashes.titulo } });
      const dupMetaTitle = await prisma.mensagem.findFirst({ where: { hashMetaTitle: result.hashes.metaTitle } });
      if (dupTitulo) console.log(`   ⚠ DUPLICATE titulo hash com /${dupTitulo.slug}`);
      if (dupMetaTitle) console.log(`   ⚠ DUPLICATE metaTitle hash com /${dupMetaTitle.slug}`);

      // Salva no DB pra Lucas ver no admin (com hashes pra futuras checks)
      const slug = `smoke-${Date.now()}-${i}`;
      await prisma.mensagem.create({
        data: {
          slug,
          titulo: result.payload.titulo,
          metaTitle: result.payload.metaTitle,
          metaDescription: result.payload.metaDescription,
          conteudo: result.payload.conteudo,
          resumo: result.payload.resumo,
          tipo: test.tipo,
          wordCount: result.wordCount,
          hashTitulo: dupTitulo ? null : result.hashes.titulo,
          hashMetaTitle: dupMetaTitle ? null : result.hashes.metaTitle,
          hashConteudo: result.hashes.conteudo,
          clusterId: cluster.id,
          complementoId: complemento?.id,
          autorId: persona.autorId ?? equipe.id,
          personaId: persona.id,
          status: "REVIEW",
          tier: "TIER_3",
          origem: "IA",
          qualidade: result.qualidade.score,
        },
      });
      aceitas++;
    } catch (e) {
      console.error(`❌ Erro:`, e instanceof Error ? e.message : e);
    }
    console.log();
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n✅ SMOKE TEST v2 CONCLUÍDO`);
  console.log(`   ${aceitas}/${TESTS.length} aceitas`);
  console.log(`   💰 Custo total: R$ ${custoTotal.toFixed(4)}`);
  console.log(`\n🌐 Veja no Prisma Studio: http://127.0.0.1:5555`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
