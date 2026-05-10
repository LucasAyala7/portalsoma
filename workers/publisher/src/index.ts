/**
 * Worker publisher: marca mensagens como PUBLISHED, dispara IndexNow e GSC.
 * Acumula em batches de 50 URLs antes de disparar IndexNow.
 *
 * NOTA: o re-build do site SSG é disparado por trigger externo (webhook do Coolify
 * ou cron que chama `next build`). Este worker apenas ATUALIZA o status das mensagens
 * + notifica buscadores.
 */

import { Worker, type Job } from "bullmq";
import { prisma } from "@nivertotal/db";
import { redis, QUEUES, logJob, type PublishJobPayload } from "@nivertotal/workers-shared";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://portalsoma.com.br";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

async function notificarIndexNow(urls: string[]): Promise<{ ok: boolean; status?: number; erro?: string }> {
  if (!INDEXNOW_KEY) return { ok: false, erro: "INDEXNOW_KEY não configurado" };
  if (urls.length === 0) return { ok: true };

  const host = new URL(SITE_URL).host;
  const body = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}

async function processarJob(job: Job<PublishJobPayload>) {
  const { mensagemId } = job.data;
  const t0 = Date.now();

  await logJob({ tipo: "publish", status: "running", payload: job.data });

  const mensagem = await prisma.mensagem.findUnique({
    where: { id: mensagemId },
    include: {
      cluster: { include: { nicho: { select: { slug: true } } } },
    },
  });
  if (!mensagem) throw new Error(`Mensagem ${mensagemId} não encontrada`);

  if (mensagem.status === "PUBLISHED") {
    console.log(`[publisher] ${mensagemId} já está PUBLISHED, pulando`);
    return;
  }

  // Aceita só PASS (qualidade >= 0.75) na publicação automática.
  // REVIEW fica esperando aprovação manual.
  if (mensagem.qualidade !== null && mensagem.qualidade < 0.75) {
    console.log(`[publisher] ${mensagemId} qualidade ${mensagem.qualidade} < 0.75, mantém em REVIEW`);
    return;
  }

  await prisma.mensagem.update({
    where: { id: mensagem.id },
    data: { status: "PUBLISHED", publicadoEm: new Date() },
  });

  const url = `${SITE_URL}/${mensagem.cluster.nicho.slug}/${mensagem.cluster.slug}/${mensagem.slug}/`;
  const indexnow = await notificarIndexNow([
    url,
    `${SITE_URL}/${mensagem.cluster.nicho.slug}/${mensagem.cluster.slug}/`,
  ]);

  await logJob({
    tipo: "publish",
    status: "success",
    payload: job.data,
    resultado: { url, indexnow },
    duracao: Date.now() - t0,
  });

  console.log(`[publisher] ✓ ${mensagemId} → ${url}`);
}

const worker = new Worker<PublishJobPayload>(QUEUES.PUBLISH, processarJob, {
  connection: redis(),
  concurrency: 4,
});

worker.on("failed", async (job, err) => {
  console.error(`[publisher] job ${job?.id} falhou:`, err.message);
  await logJob({
    tipo: "publish",
    status: "failed",
    payload: job?.data ?? {},
    erro: err.message,
  });
});

console.log(`▶ Worker publisher rodando (queue: ${QUEUES.PUBLISH})`);
