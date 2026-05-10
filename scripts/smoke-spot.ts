/**
 * Smoke spot-check: gera POEMA + CURTA pra validar metaTitle/metaDescription dentro do range.
 * Não salva no DB — só log.
 */

import { prisma } from "@nivertotal/db";
import { generateMensagem } from "@nivertotal/ai";

const TESTS = [
  { clusterSlug: "para-amiga", personaSlug: "julia-poeta", tipo: "POEMA" as const },
  { clusterSlug: "no-whatsapp", personaSlug: "marcos-pai", tipo: "CURTA" as const },
];

async function main() {
  for (let i = 0; i < TESTS.length; i++) {
    const test = TESTS[i]!;
    console.log(`\n━━━━━ [${i + 1}/${TESTS.length}] ${test.personaSlug} → ${test.clusterSlug} (${test.tipo}) ━━━━━`);
    const cluster = await prisma.cluster.findFirst({ where: { slug: test.clusterSlug, ativo: true } });
    const persona = await prisma.persona.findUnique({ where: { slug: test.personaSlug } });
    if (!cluster || !persona) { console.warn("missing"); continue; }

    const recentes = await prisma.mensagem.findMany({
      where: { clusterId: cluster.id, status: { in: ["PUBLISHED", "REVIEW"] } },
      orderBy: { criadoEm: "desc" }, take: 5, select: { conteudo: true },
    });
    const titulosExistentes = await prisma.mensagem.findMany({
      where: { status: { in: ["PUBLISHED", "REVIEW"] } },
      orderBy: { criadoEm: "desc" }, take: 50, select: { titulo: true },
    });

    try {
      const result = await generateMensagem({
        vozPrompt: persona.vozPrompt,
        cluster: { nome: cluster.nome, headKeyword: cluster.headKeyword, tipo: cluster.tipo },
        similares: recentes.map((m) => m.conteudo),
        tipo: test.tipo,
        titulosEvitar: titulosExistentes.map((m) => m.titulo),
      });
      console.log(`H1 (${result.payload.titulo.length}): ${result.payload.titulo}`);
      console.log(`metaTitle (${result.payload.metaTitle.length}): ${result.payload.metaTitle}`);
      console.log(`metaDesc (${result.payload.metaDescription.length}): ${result.payload.metaDescription}`);
      console.log(`Words: ${result.wordCount} | Score: ${(result.qualidade.score * 100).toFixed(0)}% (${result.qualidade.status}) | Retries: ${result.tentativas} | R$ ${result.custo.estimadoBRL.toFixed(4)}`);
      for (const issue of result.qualidade.issues) console.log(`  - [${issue.tipo}] ${issue.detalhe}`);
    } catch (e) {
      console.error("❌", e instanceof Error ? e.message : e);
    }
  }
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
