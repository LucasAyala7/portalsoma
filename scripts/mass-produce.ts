/**
 * Mass production v1 — gera N mensagens por cluster prioritário (com URL legado/tráfego)
 * com mix balanceado de tipos e rotação de personas. Salva em REVIEW.
 *
 * USO:
 *   tsx scripts/mass-produce.ts --per-cluster=5 --priority-only --concurrency=5
 *   tsx scripts/mass-produce.ts --per-cluster=10 --concurrency=4 --max-clusters=20
 *
 * Mix de tipos por cluster (em 5 msgs): 1 POEMA, 2 CURTA, 1 MEDIA, 1 LONGA
 * Em 10 msgs: 2 POEMA, 3 CURTA, 4 MEDIA, 1 LONGA
 *
 * Personas rotacionadas em ordem (vó, pastor, padre, julia, marcos, fátima, beatriz, coach).
 */

import { prisma } from "@nivertotal/db";
import { generateMensagem } from "@nivertotal/ai";
import { readFileSync } from "node:fs";

const args = parseArgs(process.argv.slice(2));
const PER_CLUSTER = Number(args["per-cluster"] ?? "5");
const CONCURRENCY = Number(args["concurrency"] ?? "4");
const PRIORITY_ONLY = !!args["priority-only"];
const MAX_CLUSTERS = args["max-clusters"] ? Number(args["max-clusters"]) : Infinity;
const SKIP_EXISTING = args["skip-existing"] !== "false"; // default true

interface Job {
  cluster: { id: string; slug: string; nome: string; headKeyword: string; tipo: string };
  complemento: { id: string; nome: string; headKeyword: string } | null;
  personaSlug: string;
  tipo: "CURTA" | "MEDIA" | "LONGA" | "POEMA";
}

function tiposPorCount(n: number): Array<Job["tipo"]> {
  // Mix: 15% POEMA, 30% CURTA, 40% MEDIA, 15% LONGA — exato pro gap solicitado.
  if (n <= 0) return [];
  if (n === 1) return ["MEDIA"];
  if (n === 2) return ["CURTA", "MEDIA"];
  if (n === 3) return ["POEMA", "CURTA", "MEDIA"];
  const poemas = Math.max(1, Math.round(n * 0.15));
  const curtas = Math.max(1, Math.round(n * 0.30));
  const longas = Math.max(1, Math.round(n * 0.15));
  const medias = Math.max(0, n - poemas - curtas - longas);
  const out: Job["tipo"][] = [];
  for (let i = 0; i < poemas; i++) out.push("POEMA");
  for (let i = 0; i < curtas; i++) out.push("CURTA");
  for (let i = 0; i < medias; i++) out.push("MEDIA");
  for (let i = 0; i < longas; i++) out.push("LONGA");
  return out;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) out[m[1]!] = m[2] ?? "true";
  }
  return out;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function main() {
  console.log(`\n🏭 MASS PRODUCE — per-cluster=${PER_CLUSTER} concurrency=${CONCURRENCY} priority-only=${PRIORITY_ONLY}\n`);

  // Pool de personas
  const personas = await prisma.persona.findMany({ select: { id: true, slug: true, vozPrompt: true, autorId: true }, where: { ativo: true } });
  if (personas.length === 0) throw new Error("Nenhuma persona ativa");
  console.log(`Personas disponíveis: ${personas.length}`);

  // Equipe editorial fallback
  const equipe = await prisma.author.findUnique({ where: { slug: "equipe-editorial" } });
  if (!equipe) throw new Error("autor equipe-editorial não encontrado");

  // Slugs prioritários (com tráfego do crawled)
  let prioritySlugs = new Set<string>();
  if (PRIORITY_ONLY) {
    try {
      const data = JSON.parse(readFileSync("C:/Users/lucas 1/Desktop/LUCAS/nivertotal/inputs/wp-export/crawled-content.json", "utf-8")) as Array<{ oldUrl: string }>;
      // Extrair slug antigo e mapear pra slug novo
      const slugMap = await buildSlugMap();
      for (const it of data) {
        const url = it.oldUrl.replace(/^\/mensagem-de-aniversario\//, "").replace(/\/$/, "");
        const oldSlug = url.split("/")[0];
        if (oldSlug && slugMap[oldSlug]) prioritySlugs.add(slugMap[oldSlug]);
      }
      console.log(`Slugs prioritários (com tráfego): ${prioritySlugs.size}`);
    } catch (e) {
      console.warn("Falha ao ler crawled-content.json — usando todos os clusters", e instanceof Error ? e.message : e);
    }
  }

  // Lista de clusters alvo
  const whereClusters = PRIORITY_ONLY && prioritySlugs.size > 0 ? { slug: { in: [...prioritySlugs] }, ativo: true } : { ativo: true };
  const clusters = await prisma.cluster.findMany({ where: whereClusters, take: Number.isFinite(MAX_CLUSTERS) ? MAX_CLUSTERS : undefined });
  console.log(`Clusters alvo: ${clusters.length}\n`);

  // Constrói lista de jobs (modo gap-fill: gera só DIFERENÇA pra reach PER_CLUSTER)
  const jobs: Job[] = [];
  let personaCursor = 0;
  for (const cluster of clusters) {
    let gap = PER_CLUSTER;
    if (SKIP_EXISTING) {
      const count = await prisma.mensagem.count({ where: { clusterId: cluster.id, status: { in: ["PUBLISHED", "REVIEW"] } } });
      if (count >= PER_CLUSTER) {
        console.log(`  [skip] ${cluster.slug} já tem ${count} mensagens`);
        continue;
      }
      gap = PER_CLUSTER - count;
    }
    const tipos = tiposPorCount(gap);
    for (const tipo of tipos) {
      const persona = personas[personaCursor % personas.length]!;
      personaCursor++;
      jobs.push({
        cluster: { id: cluster.id, slug: cluster.slug, nome: cluster.nome, headKeyword: cluster.headKeyword, tipo: cluster.tipo },
        complemento: null,
        personaSlug: persona.slug,
        tipo,
      });
    }
  }

  // Shuffle pra distribuir carga (não martelar mesmo cluster sequencialmente)
  const shuffled = shuffle(jobs);
  console.log(`Total de jobs: ${shuffled.length}`);
  const custoEstim = shuffled.length * 0.13;
  console.log(`Custo estimado: R$ ${custoEstim.toFixed(2)}\n`);

  let ok = 0, fail = 0, skipDup = 0, custoReal = 0;
  const t0 = Date.now();
  let lastReport = Date.now();

  // Worker pool
  let cursor = 0;
  async function worker(workerId: number) {
    while (cursor < shuffled.length) {
      const idx = cursor++;
      const job = shuffled[idx]!;
      try {
        const persona = personas.find((p) => p.slug === job.personaSlug)!;

        // Mensagens recentes do cluster
        const recentes = await prisma.mensagem.findMany({
          where: { clusterId: job.cluster.id, status: { in: ["PUBLISHED", "REVIEW"] } },
          orderBy: { criadoEm: "desc" },
          take: 5,
          select: { conteudo: true },
        });

        // Títulos cross-cluster pra evitar repetição (50 mais recentes)
        const titulosExistentes = await prisma.mensagem.findMany({
          where: { status: { in: ["PUBLISHED", "REVIEW"] } },
          orderBy: { criadoEm: "desc" },
          take: 50,
          select: { titulo: true },
        });

        const result = await generateMensagem({
          vozPrompt: persona.vozPrompt,
          cluster: job.cluster,
          complemento: job.complemento,
          similares: recentes.map((m) => m.conteudo),
          tipo: job.tipo,
          titulosEvitar: titulosExistentes.map((m) => m.titulo),
        });

        custoReal += result.custo.estimadoBRL;

        // Check uniqueness DB-wide via hashes
        const dupTitulo = await prisma.mensagem.findFirst({ where: { hashTitulo: result.hashes.titulo }, select: { id: true } });
        const dupMetaTitle = await prisma.mensagem.findFirst({ where: { hashMetaTitle: result.hashes.metaTitle }, select: { id: true } });
        if (dupTitulo) {
          skipDup++;
          console.log(`[w${workerId} ${idx + 1}/${shuffled.length}] ⚠ DUP titulo em ${job.cluster.slug} — descartado`);
          continue;
        }

        const baseSlug = slugify(result.payload.titulo);
        const slug = `${baseSlug}-${result.hashes.titulo.slice(0, 6)}`;

        await prisma.mensagem.create({
          data: {
            slug,
            titulo: result.payload.titulo,
            metaTitle: result.payload.metaTitle,
            metaDescription: result.payload.metaDescription,
            conteudo: result.payload.conteudo,
            resumo: result.payload.resumo,
            tipo: job.tipo,
            wordCount: result.wordCount,
            hashTitulo: result.hashes.titulo,
            hashMetaTitle: dupMetaTitle ? null : result.hashes.metaTitle,
            hashConteudo: result.hashes.conteudo,
            clusterId: job.cluster.id,
            autorId: persona.autorId ?? equipe!.id,
            personaId: persona.id,
            status: "REVIEW",
            tier: "TIER_3",
            origem: "IA",
            qualidade: result.qualidade.score,
          },
        });

        ok++;
        if (Date.now() - lastReport > 30000) {
          const taxa = (ok + fail + skipDup) / ((Date.now() - t0) / 1000);
          console.log(`[progress] ${ok + fail + skipDup}/${shuffled.length} | ok=${ok} fail=${fail} dup=${skipDup} | R$ ${custoReal.toFixed(2)} | ${taxa.toFixed(2)}/s`);
          lastReport = Date.now();
        }
      } catch (e) {
        fail++;
        console.error(`[w${workerId} ${idx + 1}/${shuffled.length}] ❌ ${job.cluster.slug}/${job.tipo}:`, e instanceof Error ? e.message : e);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  const elapsed = (Date.now() - t0) / 1000;
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ MASS PRODUCE CONCLUÍDO`);
  console.log(`   ${ok} OK · ${fail} FAIL · ${skipDup} DUP`);
  console.log(`   💰 R$ ${custoReal.toFixed(2)} (vs estimado R$ ${custoEstim.toFixed(2)})`);
  console.log(`   ⏱  ${(elapsed / 60).toFixed(1)}min`);

  await prisma.$disconnect();
}

/**
 * Mapa estático slug-antigo → slug-novo. Build a partir dos redirects 301 do DB.
 */
async function buildSlugMap(): Promise<Record<string, string>> {
  const redirects = await prisma.redirect.findMany({ where: { status: 301, ativo: true }, select: { origem: true, destino: true } });
  const map: Record<string, string> = {};
  for (const r of redirects) {
    const oldParts = r.origem.replace(/^\/mensagem-de-aniversario\//, "").replace(/\/$/, "").split("/");
    const newParts = r.destino.replace(/^\/mensagem-de-aniversario\//, "").replace(/\/$/, "").split("/");
    if (oldParts[0] && newParts[0] && !map[oldParts[0]]) map[oldParts[0]] = newParts[0];
  }
  return map;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
