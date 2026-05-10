import IORedis from "ioredis";

let _conn: IORedis | null = null;
export function redis(): IORedis {
  if (_conn) return _conn;
  _conn = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
  return _conn;
}

export const QUEUES = {
  AI: "nivertotal-generate-content",
  IMAGE: "nivertotal-generate-image",
  WEBSTORY: "nivertotal-generate-webstory",
  PUBLISH: "nivertotal-publish",
} as const;

export interface AiJobPayload {
  mensagemId: string;
}

export interface ImageJobPayload {
  mensagemId: string;
  tier?: "TIER_1" | "TIER_2" | "TIER_3";
}

export interface WebStoryJobPayload {
  tema: string;
  clusterSlug: string;
}

export interface PublishJobPayload {
  mensagemId: string;
}

export async function logJob(input: {
  tipo: string;
  status: "running" | "success" | "failed";
  payload: unknown;
  resultado?: unknown;
  custo?: number;
  duracao?: number;
  erro?: string;
}) {
  const { prisma } = await import("@nivertotal/db");
  await prisma.jobLog.create({
    data: {
      tipo: input.tipo,
      status: input.status,
      payload: input.payload as object,
      resultado: input.resultado as object | undefined,
      custo: input.custo,
      duracao: input.duracao,
      erro: input.erro,
    },
  });
}
