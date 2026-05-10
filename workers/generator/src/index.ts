/**
 * Worker generator: consome a fila AI, gera mensagem com Claude+persona,
 * roda quality gate, atualiza Mensagem no DB.
 *
 * Lê: nivertotal:generate-content
 * Escreve em: Mensagem (conteudo, status, qualidade), JobLog
 *
 * Em caso de quality.status === "FAIL" depois do retry interno do generator,
 * a mensagem fica como REJECTED. Se REVIEW, marca pra Lucas revisar no admin.
 * Se PASS, marca como REVIEW também (publicação manual ou via worker publisher).
 */

import { Worker, type Job } from "bullmq";
import { prisma } from "@nivertotal/db";
import { generateMensagem, choosePersona } from "@nivertotal/ai";
import { redis, QUEUES, logJob, type AiJobPayload } from "@nivertotal/workers-shared";

async function processarJob(job: Job<AiJobPayload>) {
  const { mensagemId } = job.data;
  const t0 = Date.now();

  await logJob({
    tipo: "generate_content",
    status: "running",
    payload: { mensagemId },
  });

  const mensagem = await prisma.mensagem.findUnique({
    where: { id: mensagemId },
    include: {
      cluster: true,
      complemento: true,
      persona: true,
    },
  });

  if (!mensagem) throw new Error(`Mensagem ${mensagemId} não encontrada`);

  // Persona: usa a vinculada se existir, senão escolhe ponderada
  let persona = mensagem.persona;
  if (!persona) {
    const todasPersonas = await prisma.persona.findMany({ where: { ativo: true } });
    persona = choosePersona({
      personas: todasPersonas,
      clusterSlug: mensagem.cluster.slug,
      clusterTipo: mensagem.cluster.tipo,
      complementoSlug: mensagem.complemento?.slug,
    });
  }

  // Buscar mensagens recentes do mesmo cluster pra evitar similaridade
  const recentes = await prisma.mensagem.findMany({
    where: {
      clusterId: mensagem.clusterId,
      id: { not: mensagem.id },
      status: { in: ["PUBLISHED", "REVIEW"] },
    },
    orderBy: { criadoEm: "desc" },
    take: 5,
    select: { conteudo: true },
  });

  const result = await generateMensagem({
    vozPrompt: persona.vozPrompt,
    cluster: {
      nome: mensagem.cluster.nome,
      headKeyword: mensagem.cluster.headKeyword,
      tipo: mensagem.cluster.tipo,
    },
    complemento: mensagem.complemento
      ? {
          nome: mensagem.complemento.nome,
          headKeyword: mensagem.complemento.headKeyword,
        }
      : null,
    similares: recentes.map((m) => m.conteudo),
    comprimentoTipo: pickComprimento(),
  });

  // Define status baseado em quality
  const novoStatus =
    result.qualidade.status === "FAIL"
      ? "REJECTED"
      : result.qualidade.status === "REVIEW"
        ? "REVIEW"
        : "REVIEW"; // mesmo PASS vai pra REVIEW: gateway humano antes de publish
  // (publicação automática ficará no worker publisher se Lucas configurar autoaprovação)

  await prisma.mensagem.update({
    where: { id: mensagem.id },
    data: {
      titulo: result.payload.titulo,
      conteudo: result.payload.conteudo,
      resumo: result.payload.resumo,
      personaId: persona.id,
      autorId: persona.autorId ?? mensagem.autorId,
      qualidade: result.qualidade.score,
      status: novoStatus,
    },
  });

  await logJob({
    tipo: "generate_content",
    status: "success",
    payload: { mensagemId },
    resultado: {
      personaSlug: persona.slug,
      qualidade: result.qualidade,
      tentativas: result.tentativas,
      tokens: result.custo,
    },
    custo: result.custo.estimadoBRL,
    duracao: Date.now() - t0,
  });

  console.log(
    `[generator] ✓ ${mensagemId} (${persona.slug}) Q=${(result.qualidade.score * 100).toFixed(0)}% R$${result.custo.estimadoBRL.toFixed(4)}`,
  );
}

function pickComprimento(): "curta" | "media" | "longa" {
  const r = Math.random();
  if (r < 0.3) return "curta";
  if (r < 0.85) return "media";
  return "longa";
}

const worker = new Worker<AiJobPayload>(QUEUES.AI, processarJob, {
  connection: redis(),
  concurrency: 2, // 2 jobs paralelos = controla custo + RPM Anthropic
});

worker.on("completed", (job) => {
  console.log(`[generator] job ${job.id} concluído`);
});

worker.on("failed", async (job, err) => {
  console.error(`[generator] job ${job?.id} falhou:`, err.message);
  await logJob({
    tipo: "generate_content",
    status: "failed",
    payload: job?.data ?? {},
    erro: err.message,
  });
});

console.log(`▶ Worker generator rodando (queue: ${QUEUES.AI})`);
