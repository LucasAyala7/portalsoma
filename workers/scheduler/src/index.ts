/**
 * Worker scheduler — cron diário que enfileira jobs de geração distribuídos.
 *
 * Roda 2x/dia (8h e 14h) configurado via setInterval (em prod via cron Coolify).
 * Pra cada cluster com cota > 0, calcula faltante (cota - geradas hoje)
 * e enfileira N jobs com delays escalonados ao longo de 8h-22h.
 *
 * Como BullMQ delay é em ms, distribui:
 *   delay(i) = (i / total) * (windowEndMs - windowStartMs)
 *
 * Janela ativa: 08h às 22h (14h × 60 × 60 × 1000 = 50_400_000 ms)
 */

import { Queue } from "bullmq";
import { prisma } from "@nivertotal/db";
import { redis, QUEUES, logJob, type AiJobPayload } from "@nivertotal/workers-shared";

const aiQueue = new Queue<AiJobPayload>(QUEUES.AI, { connection: redis() });

const WINDOW_HOURS = 14; // 8h-22h
const WINDOW_MS = WINDOW_HOURS * 60 * 60 * 1000;
const LIMITE_GLOBAL_DIA = parseInt(process.env.LIMITE_GLOBAL_DIA ?? "25", 10);

/**
 * Executa 1 ciclo de planejamento — chama cota faltante + enfileira jobs.
 */
async function tick() {
  const t0 = Date.now();
  console.log(`\n[scheduler] tick iniciado ${new Date().toISOString()}`);

  // Quantas mensagens já criamos hoje?
  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);
  const criadasHoje = await prisma.mensagem.count({
    where: {
      criadoEm: { gte: inicioHoje },
      origem: "IA",
    },
  });
  const restantesGlobal = Math.max(0, LIMITE_GLOBAL_DIA - criadasHoje);
  console.log(`[scheduler] criadas hoje (IA): ${criadasHoje} / limite ${LIMITE_GLOBAL_DIA}, restam ${restantesGlobal}`);

  if (restantesGlobal === 0) {
    console.log("[scheduler] cota global atingida, nada a fazer");
    return;
  }

  // Pega clusters com cotaDiaria > 0, ordenados por volume
  const clusters = await prisma.cluster.findMany({
    where: { ativo: true, cotaDiaria: { gt: 0 } },
    orderBy: { volumeMensal: "desc" },
    include: {
      _count: {
        select: {
          mensagens: {
            where: { criadoEm: { gte: inicioHoje }, origem: "IA" },
          },
        },
      },
    },
  });

  // Calcula faltante de cada cluster
  const planejamento: { clusterId: string; clusterSlug: string; faltam: number }[] = [];
  for (const c of clusters) {
    const faltam = Math.max(0, c.cotaDiaria - c._count.mensagens);
    if (faltam > 0) planejamento.push({ clusterId: c.id, clusterSlug: c.slug, faltam });
  }

  // Limita pelo global
  let totalEnqueued = 0;
  const jobs: { clusterId: string; clusterSlug: string }[] = [];
  for (const p of planejamento) {
    if (totalEnqueued >= restantesGlobal) break;
    const podeEnfileirar = Math.min(p.faltam, restantesGlobal - totalEnqueued);
    for (let i = 0; i < podeEnfileirar; i++) {
      jobs.push({ clusterId: p.clusterId, clusterSlug: p.clusterSlug });
    }
    totalEnqueued += podeEnfileirar;
  }

  console.log(`[scheduler] planejados ${jobs.length} jobs em ${planejamento.length} clusters`);
  if (jobs.length === 0) return;

  // Embaralha pra alternar clusters (não cluster A todo, depois B todo)
  for (let i = jobs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [jobs[i]!, jobs[j]!] = [jobs[j]!, jobs[i]!];
  }

  // Enfileira jobs com delays escalonados
  // Cria primeiro Mensagem DRAFT vazia, depois enfileira generation
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]!;
    const delay = Math.round((i / jobs.length) * WINDOW_MS);

    // Cria Mensagem DRAFT placeholder (worker generator preenche)
    const equipe = await prisma.author.findUnique({ where: { slug: "equipe-editorial" } });
    if (!equipe) throw new Error("autor equipe-editorial não encontrado");

    const mensagem = await prisma.mensagem.create({
      data: {
        slug: `pending-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        titulo: "(gerando...)",
        conteudo: "",
        clusterId: job.clusterId,
        autorId: equipe.id,
        status: "DRAFT",
        tier: "TIER_3",
        origem: "IA",
      },
    });

    await aiQueue.add(
      "generate",
      { mensagemId: mensagem.id },
      {
        delay,
        attempts: 2,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 500,
      },
    );
  }

  await logJob({
    tipo: "scheduler_tick",
    status: "success",
    payload: { totalEnqueued, restantesGlobal, planejamento },
    duracao: Date.now() - t0,
  });

  console.log(`[scheduler] ✓ ${totalEnqueued} jobs enfileirados em ${Date.now() - t0}ms`);
}

// === Loop ===
async function main() {
  console.log(`▶ Worker scheduler iniciado (limite global: ${LIMITE_GLOBAL_DIA}/dia)`);

  // Roda imediatamente ao subir
  await tick().catch((e) => console.error("[scheduler] erro:", e));

  // Cron simples: roda a cada 6h (4 ticks/dia, mas quem regula é o limite global)
  setInterval(
    () => {
      tick().catch((e) => console.error("[scheduler] erro:", e));
    },
    6 * 60 * 60 * 1000,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
