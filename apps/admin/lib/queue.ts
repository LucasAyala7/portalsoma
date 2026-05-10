/**
 * Helpers pra produção de jobs BullMQ.
 * Workers consomem essas filas (apps/workers/*).
 */

import { Queue } from "bullmq";
import IORedis from "ioredis";

let _conn: IORedis | null = null;
function conn(): IORedis {
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

let _ai: Queue | null = null;
let _img: Queue | null = null;
let _ws: Queue | null = null;
let _pub: Queue | null = null;

export function aiQueue() {
  if (!_ai) _ai = new Queue(QUEUES.AI, { connection: conn() });
  return _ai;
}
export function imageQueue() {
  if (!_img) _img = new Queue(QUEUES.IMAGE, { connection: conn() });
  return _img;
}
export function webstoryQueue() {
  if (!_ws) _ws = new Queue(QUEUES.WEBSTORY, { connection: conn() });
  return _ws;
}
export function publishQueue() {
  if (!_pub) _pub = new Queue(QUEUES.PUBLISH, { connection: conn() });
  return _pub;
}

export async function addAiJob(payload: { mensagemId: string }) {
  await aiQueue().add("generate", payload, {
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 1000,
    removeOnFail: 500,
  });
}

export async function addImageJob(payload: { mensagemId: string; tier?: "TIER_1" | "TIER_2" | "TIER_3" }) {
  await imageQueue().add("generate-image", payload, {
    attempts: 2,
    removeOnComplete: 500,
    removeOnFail: 200,
  });
}

export async function addWebStoryJob(payload: { tema: string; clusterSlug: string }) {
  await webstoryQueue().add("generate-story", payload, {
    attempts: 1,
    removeOnComplete: 200,
  });
}

export async function addPublishJob(payload: { mensagemId: string }) {
  await publishQueue().add("publish", payload, {
    attempts: 3,
    removeOnComplete: 1000,
  });
}
