/**
 * Carrega os redirects ativos do DB e injeta no middleware via build.
 * Roda no SSR no carregamento · cache em memória do Next.
 *
 * Esse arquivo é importado APENAS pela app route `/api/redirect/[...path]`
 * (não pelo middleware, que precisa rodar em edge runtime sem Prisma).
 */

import { prisma } from "@nivertotal/db";

let cache: { byOrigin: Map<string, { destino: string; status: number }>; loadedAt: number } | null = null;
const TTL_MS = 60_000;

export async function getRedirectsCache() {
  const now = Date.now();
  if (cache && now - cache.loadedAt < TTL_MS) return cache;

  const all = await prisma.redirect.findMany({
    where: { ativo: true },
    select: { origem: true, destino: true, status: true },
  });
  const byOrigin = new Map<string, { destino: string; status: number }>();
  for (const r of all) byOrigin.set(r.origem, { destino: r.destino, status: r.status });

  cache = { byOrigin, loadedAt: now };
  return cache;
}

export async function lookupRedirect(path: string) {
  const c = await getRedirectsCache();
  return c.byOrigin.get(path) ?? null;
}
