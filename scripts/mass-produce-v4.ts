/**
 * Mass production v3 — gera ~1000 mensagens NOVAS pro Portal Soma usando OpenAI gpt-5.
 *
 * DIFERENÇAS vs v1/v2:
 *  - Status default: DRAFT (Lucas/scheduler promove depois — drip publish).
 *  - Distribuição ponderada por volumeMensal: top 10 ganham 30 msgs, próximos 20 ganham 20, resto 10.
 *  - Total alvo ≈ 1000 mensagens em ~50 clusters.
 *  - Mix tipos: 30% CURTA, 40% MEDIA, 15% LONGA, 15% POEMA.
 *  - Chamada OpenAI inline (gpt-5 chat completions, JSON mode) com prompt persona-aware.
 *  - Quality gate em wordCount por tipo + clichês + AI tells + slug ASCII.
 *  - Dedup hashTitulo + hashConteudo (sha256 16 chars).
 *  - Concorrência 4 default, progress log a cada 50.
 *
 * USO:
 *   # 1) Dry-run primeiro (sem gravar)
 *   DATABASE_URL="postgresql://portalsoma:PsDBfe468cc45eac6ea9@localhost:55432/portalsoma?schema=public" \
 *     workers/imagery/node_modules/.bin/tsx scripts/mass-produce-v3.ts --limit=10 --dry-run
 *
 *   # 2) Cluster específico (debug)
 *   DATABASE_URL="..." workers/imagery/node_modules/.bin/tsx scripts/mass-produce-v3.ts \
 *     --cluster=para-mae --limit=5 --dry-run
 *
 *   # 3) Full run (~1000 msgs, ~$6 = ~R$33)
 *   DATABASE_URL="..." workers/imagery/node_modules/.bin/tsx scripts/mass-produce-v3.ts --concurrency=4
 *
 * Args:
 *   --limit=N         processa só N jobs (default: ~1000)
 *   --dry-run         não escreve no DB
 *   --cluster=slug    restringe a UM cluster (ignora distribuição)
 *   --concurrency=N   workers paralelos (default: 4)
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local = dirname(__filename_local);
config({ path: resolve(__dirname_local, "..", ".env") });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API_KEY = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
const API_BASE = process.env.LLM_API_BASE ?? "https://api.deepseek.com/v1";
const MODEL = process.env.LLM_MODEL ?? "deepseek-chat";
if (!API_KEY) throw new Error("Falta LLM_API_KEY");

function readKeyFromChave(): string {
  try {
    const data = JSON.parse(
      readFileSync("C:/Users/lucas 1/Desktop/LUCAS/lps/projetct/scrap1/chave.json", "utf-8")
    );
    return data.api_key;
  } catch {
    throw new Error("Falta OPENAI_API_KEY (env ou chave.json)");
  }
}

// =====================================================
// ARGS
// =====================================================

interface Args {
  limit?: number;
  dryRun: boolean;
  cluster?: string;
  concurrency: number;
  target: number;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { dryRun: false, concurrency: 4, target: 1000 };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    const [, k, v] = m;
    if (k === "limit") out.limit = Number(v);
    else if (k === "dry-run") out.dryRun = true;
    else if (k === "cluster") out.cluster = v;
    else if (k === "concurrency") out.concurrency = Number(v) || 4;
    else if (k === "target") out.target = Number(v) || 1000;
  }
  return out;
}

// =====================================================
// HELPERS
// =====================================================

type Tipo = "CURTA" | "MEDIA" | "LONGA" | "POEMA";

const TIPO_WORDCOUNT: Record<Tipo, { min: number; max: number }> = {
  CURTA: { min: 25, max: 85 },
  MEDIA: { min: 85, max: 160 },
  LONGA: { min: 160, max: 320 },
  POEMA: { min: 30, max: 220 },
};

// Mix 30/40/15/15 — para uma cota de N, distribui os tipos
function tiposForCota(n: number): Tipo[] {
  if (n <= 0) return [];
  const curtas = Math.max(1, Math.round(n * 0.30));
  const medias = Math.max(1, Math.round(n * 0.40));
  const longas = Math.max(1, Math.round(n * 0.15));
  const poemas = Math.max(0, n - curtas - medias - longas);
  const out: Tipo[] = [];
  for (let i = 0; i < curtas; i++) out.push("CURTA");
  for (let i = 0; i < medias; i++) out.push("MEDIA");
  for (let i = 0; i < longas; i++) out.push("LONGA");
  for (let i = 0; i < poemas; i++) out.push("POEMA");
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

function normalizeSlug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function normalizeForHash(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hash16(s: string): string {
  return createHash("sha256").update(normalizeForHash(s)).digest("hex").slice(0, 16);
}

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

// =====================================================
// QUALITY GATE
// =====================================================

const CLICHES_PROIBIDOS = [
  "você é especial pra mim",
  "voce e especial pra mim",
  "que deus te abençoe sempre",
  "que deus te abencoe sempre",
  "feliz aniversário, meu amor",
  "feliz aniversario, meu amor",
  "parabéns pra você",
  "parabens pra voce",
];

const AI_TELLS = [
  "em conclusão",
  "em conclusao",
  "no fim do dia",
  "em última análise",
  "em ultima analise",
  "vale a pena destacar",
  "vale destacar",
  "navegar pelas águas",
  "navegar pelas aguas",
  "uma jornada",
  "uma verdadeira jornada",
];

function qualityGate(
  payload: { titulo: string; metaTitle: string; metaDescription: string; conteudo: string; resumo: string },
  tipo: Tipo
): { ok: boolean; reason?: string; wordCount: number } {
  const wc = countWords(payload.conteudo);
  const range = TIPO_WORDCOUNT[tipo];
  if (wc < range.min) return { ok: false, reason: `wordCount=${wc} <${range.min} pra ${tipo}`, wordCount: wc };
  if (wc > range.max) return { ok: false, reason: `wordCount=${wc} >${range.max} pra ${tipo}`, wordCount: wc };

  const conteudoNorm = payload.conteudo.toLowerCase();
  const inicio = conteudoNorm.slice(0, 80);
  for (const cliche of CLICHES_PROIBIDOS) {
    if (inicio.includes(cliche)) return { ok: false, reason: `clichê inicial: "${cliche}"`, wordCount: wc };
  }
  for (const tell of AI_TELLS) {
    if (conteudoNorm.includes(tell)) return { ok: false, reason: `AI tell: "${tell}"`, wordCount: wc };
  }
  // Emoji guard
  if (/\p{Emoji_Presentation}|\p{Extended_Pictographic}/u.test(payload.titulo + payload.conteudo + payload.metaTitle + payload.metaDescription)) {
    return { ok: false, reason: "contém emoji", wordCount: wc };
  }
  // metaTitle/Description sanity (não bloqueante se um pouco fora)
  if (!payload.titulo?.trim()) return { ok: false, reason: "titulo vazio", wordCount: wc };
  if (!payload.metaTitle?.trim() || payload.metaTitle.length > 80) return { ok: false, reason: `metaTitle inválido (${payload.metaTitle?.length ?? 0})`, wordCount: wc };
  if (!payload.metaDescription?.trim() || payload.metaDescription.length > 170) return { ok: false, reason: `metaDescription inválida (${payload.metaDescription?.length ?? 0})`, wordCount: wc };

  return { ok: true, wordCount: wc };
}

// =====================================================
// PROMPT
// =====================================================

const SYSTEM_BASE = `Você é redator brasileiro especialista em mensagens de aniversário e datas comemorativas, escrevendo para o Portal Soma (portalsoma.com.br).

Voz: PT-BR culto-acessível, com calor humano e densidade emocional. Sem rebuscamento desnecessário. Sem clichês de cartão de visita. Sem AI tells.

REGRAS DURAS (descumprimento = rejeição):
- NÃO comece o texto com "Você é especial pra mim", "Que Deus te abençoe sempre", "Feliz aniversário, meu amor", "Parabéns pra você" ou variações. Comece de forma INCOMUM — uma imagem concreta, uma lembrança, uma metáfora simples.
- NÃO use emoji em NENHUM campo.
- NÃO use "uma jornada", "em conclusão", "no fim do dia", "em última análise", "vale destacar", "navegar pelas águas".
- NÃO use reticências artificiais (...).
- NÃO prometa "pdf", "lista de 10", "download" se não houver.
- Ortografia PT-BR atualizada (sem trema, com acordo ortográfico).

VOZ DA PERSONA: o usuário envia "VOZ DA PERSONA" como instrução adicional — incorpore SEM mencionar a persona pelo nome no texto.

TIPO DA MENSAGEM (cumprir wordCount):
- CURTA: 25-85 palavras. Uma ideia central, forte, sem enchimento.
- MEDIA: 85-160 palavras. Desenvolve a ideia em 2-3 parágrafos.
- LONGA: 160-320 palavras. Três a quatro parágrafos com profundidade emocional, ainda assim sem encher linguiça.
- POEMA: 30-220 palavras. Versos com ritmo (não rima forçada). Imagens concretas. Métrica livre ok.

SAÍDA OBRIGATÓRIA: JSON único válido (sem markdown wrap, sem \`\`\`json), com este schema:
{
  "titulo": "Título atrativo, 5-12 palavras, sem clichê (não repita literalmente a head keyword)",
  "metaTitle": "Título SEO 54-60 chars (pode ter ' | Portal Soma' se couber em 60)",
  "metaDescription": "Descrição SEO 124-140 chars, com call sutil",
  "resumo": "1 frase 90-200 chars que captura a essência (sem repetir titulo literal)",
  "conteudo": "O TEXTO DA MENSAGEM (no tipo solicitado, sem markdown headings, parágrafos separados por \\n\\n; em POEMA use \\n entre versos e \\n\\n entre estrofes)",
  "tags": ["tag1","tag2","tag3"]
}`;

interface PromptInput {
  cluster: { nome: string; headKeyword: string; tipo: string };
  complemento: { nome: string; headKeyword: string } | null;
  personaNome: string;
  vozPrompt: string;
  tipo: Tipo;
  titulosEvitar: string[];
}

function buildUserPrompt(p: PromptInput): string {
  const ctx = p.complemento ? `${p.cluster.nome} > ${p.complemento.nome}` : p.cluster.nome;
  const headKw = p.complemento?.headKeyword ?? p.cluster.headKeyword;
  const evitar = p.titulosEvitar.length
    ? `\n\nTÍTULOS JÁ EXISTENTES NO PORTAL (NÃO REPITA NEM VARIE SUTILMENTE — crie algo distinto):\n- ${p.titulosEvitar.slice(0, 30).join("\n- ")}`
    : "";
  return `CONTEXTO: ${ctx}
HEAD KEYWORD (referência semântica, não use literalmente no título): ${headKw}
TIPO: ${p.tipo} (cumprir wordCount obrigatoriamente)

VOZ DA PERSONA (${p.personaNome}):
${p.vozPrompt.slice(0, 1200)}
${evitar}

Gere a mensagem completa seguindo TODAS as regras do system. Retorne APENAS o JSON.`;
}

// =====================================================
// OPENAI CALL
// =====================================================

interface GenPayload {
  titulo: string;
  metaTitle: string;
  metaDescription: string;
  resumo: string;
  conteudo: string;
  tags: string[];
}

async function callOpenAI(p: PromptInput): Promise<GenPayload> {
  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_BASE },
      { role: "user", content: buildUserPrompt(p) },
    ],
    response_format: { type: "json_object" },
  };
  const r = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`OpenAI ${r.status}: ${txt.slice(0, 300)}`);
  }
  const j = (await r.json()) as { choices: Array<{ message: { content: string } }> };
  const raw = j.choices[0]!.message.content;
  return JSON.parse(raw) as GenPayload;
}

// =====================================================
// DISTRIBUIÇÃO DE COTAS
// =====================================================

interface ClusterRow {
  id: string;
  slug: string;
  nome: string;
  headKeyword: string;
  tipo: string;
}

/**
 * Distribuição ponderada: top 10 = 30 msgs, próximos 20 = 20 msgs, resto = 10.
 * Default top 50 clusters por volumeMensal → 300 + 400 + 300 = 1000 msgs.
 */
function distribuirCotas(clusters: ClusterRow[], target: number): Map<string, number> {
  const cotas = new Map<string, number>();
  if (clusters.length === 0) return cotas;

  // Pesos default pra 1000 msgs em 50 clusters
  // top 10 → 30 cada (300), 11-30 → 20 cada (400), 31-50 → 10 cada (200) = 900
  // ajustar pra bater 1000 distribuindo +5 nos top 10 e +5 no meio
  const N = clusters.length;
  const top = Math.min(10, N);
  const mid = Math.min(20, Math.max(0, N - top));
  const tail = Math.max(0, N - top - mid);

  const baseTop = 30;
  const baseMid = 20;
  const baseTail = 10;

  let total = top * baseTop + mid * baseMid + tail * baseTail;
  // Ajuste linear pra bater target
  const factor = total > 0 ? target / total : 1;

  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i]!;
    let base: number;
    if (i < top) base = baseTop;
    else if (i < top + mid) base = baseMid;
    else base = baseTail;
    cotas.set(c.slug, Math.max(1, Math.round(base * factor)));
  }
  return cotas;
}

// =====================================================
// MAIN
// =====================================================

interface Job {
  cluster: ClusterRow;
  personaId: string;
  personaSlug: string;
  personaNome: string;
  vozPrompt: string;
  autorId: string;
  tipo: Tipo;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`\n=== MASS PRODUCE v3 ===`);
  console.log(`model=${MODEL} | dry-run=${args.dryRun} | concurrency=${args.concurrency} | target=${args.target}\n`);

  // 1. Personas ativas (8 personas + autores reais com afinidade)
  const personas = await prisma.persona.findMany({
    where: { ativo: true },
    select: { id: true, slug: true, nome: true, vozPrompt: true, autorId: true },
  });
  if (personas.length === 0) throw new Error("Nenhuma persona ativa no DB");
  console.log(`Personas ativas: ${personas.length} (${personas.map((p) => p.slug).join(", ")})`);

  // Fallback de autor pra personas sem autorId
  const equipe = await prisma.author.findFirst({ where: { slug: "equipe-editorial" } });
  const autores = await prisma.author.findMany({ where: { ativo: true, real: true }, select: { id: true, slug: true, nome: true } });
  const fallbackAutorId = equipe?.id ?? autores[0]?.id;
  if (!fallbackAutorId) throw new Error("Sem author fallback");

  // 2. Selecionar clusters
  let clusters: ClusterRow[];
  if (args.cluster) {
    const c = await prisma.cluster.findFirst({
      where: { slug: args.cluster, ativo: true },
      select: { id: true, slug: true, nome: true, headKeyword: true, tipo: true },
    });
    if (!c) throw new Error(`Cluster slug "${args.cluster}" não encontrado/ativo`);
    clusters = [{ ...c, tipo: c.tipo as unknown as string }];
  } else {
    const raw = await prisma.cluster.findMany({
      where: { ativo: true },
      orderBy: { volumeMensal: "desc" },
      take: 50,
      select: { id: true, slug: true, nome: true, headKeyword: true, tipo: true },
    });
    clusters = raw.map((c) => ({ ...c, tipo: c.tipo as unknown as string }));
  }
  console.log(`Clusters alvo: ${clusters.length}`);

  // 3. Distribuir cotas
  const cotas = args.cluster
    ? new Map<string, number>([[clusters[0]!.slug, args.limit ?? 20]])
    : distribuirCotas(clusters, args.target);

  // Print distribuição resumida
  const cotasArr = clusters.map((c) => ({ slug: c.slug, nome: c.nome, cota: cotas.get(c.slug) ?? 0 }));
  const totalCotas = cotasArr.reduce((s, x) => s + x.cota, 0);
  console.log(`\nDistribuição (top 5):`);
  cotasArr.slice(0, 5).forEach((x) => console.log(`  ${x.slug.padEnd(28)} → ${x.cota}`));
  console.log(`Distribuição (tail 5):`);
  cotasArr.slice(-5).forEach((x) => console.log(`  ${x.slug.padEnd(28)} → ${x.cota}`));
  console.log(`Total cotas: ${totalCotas}\n`);

  // 4. Montar jobs
  const jobs: Job[] = [];
  let personaCursor = 0;
  for (const cluster of clusters) {
    const cota = cotas.get(cluster.slug) ?? 0;
    if (cota <= 0) continue;
    const tipos = tiposForCota(cota);
    for (const tipo of tipos) {
      // Round-robin com leve random shift
      const p = personas[(personaCursor + Math.floor(Math.random() * 2)) % personas.length]!;
      personaCursor++;
      jobs.push({
        cluster,
        personaId: p.id,
        personaSlug: p.slug,
        personaNome: p.nome,
        vozPrompt: p.vozPrompt,
        autorId: p.autorId ?? fallbackAutorId,
        tipo,
      });
    }
  }

  let jobsShuffled = shuffle(jobs);
  if (args.limit) jobsShuffled = jobsShuffled.slice(0, args.limit);
  console.log(`Total jobs: ${jobsShuffled.length}`);

  // Custo estimado: gpt-5 in ~2k tok × $1.25/M + out ~500 tok × $10/M ≈ $0.0075/msg
  // Conservador: $0.008 / msg
  const custoUsdEstim = jobsShuffled.length * 0.008;
  console.log(`Custo estimado: ~$${custoUsdEstim.toFixed(2)} USD (~R$ ${(custoUsdEstim * 5.5).toFixed(2)})\n`);

  if (jobsShuffled.length === 0) {
    console.log("Nada a fazer.");
    await prisma.$disconnect();
    return;
  }

  // 5. Worker pool
  let cursor = 0;
  let ok = 0;
  let fail = 0;
  let skipDup = 0;
  let skipGate = 0;
  let custoUsdReal = 0;
  const t0 = Date.now();

  async function worker(workerId: number) {
    while (cursor < jobsShuffled.length) {
      const idx = cursor++;
      const job = jobsShuffled[idx]!;
      try {
        // Títulos cross-cluster recentes do mesmo cluster pra evitar repetição
        const titulosExistentes = await prisma.mensagem.findMany({
          where: { clusterId: job.cluster.id },
          orderBy: { criadoEm: "desc" },
          take: 30,
          select: { titulo: true },
        });

        const payload = await callOpenAI({
          cluster: job.cluster,
          complemento: null,
          personaNome: job.personaNome,
          vozPrompt: job.vozPrompt,
          tipo: job.tipo,
          titulosEvitar: titulosExistentes.map((m) => m.titulo),
        });

        custoUsdReal += 0.008;

        const qg = qualityGate(payload, job.tipo);
        if (!qg.ok) {
          skipGate++;
          console.warn(`  [w${workerId} ${idx + 1}/${jobsShuffled.length}] GATE ${job.cluster.slug}/${job.tipo}: ${qg.reason}`);
          continue;
        }

        const hashTitulo = hash16(payload.titulo);
        const hashConteudo = hash16(payload.conteudo);
        const hashMetaTitle = hash16(payload.metaTitle);

        // Dedup DB-wide
        const [dupT, dupC] = await Promise.all([
          prisma.mensagem.findFirst({ where: { hashTitulo }, select: { id: true } }),
          prisma.mensagem.findFirst({ where: { hashConteudo }, select: { id: true } }),
        ]);
        if (dupT || dupC) {
          skipDup++;
          console.warn(`  [w${workerId} ${idx + 1}/${jobsShuffled.length}] DUP ${job.cluster.slug}/${job.tipo} (${dupT ? "titulo" : "conteudo"})`);
          continue;
        }

        // Slug único
        let baseSlug = normalizeSlug(payload.titulo);
        if (!baseSlug) baseSlug = `msg-${hashTitulo.slice(0, 8)}`;
        let slug = `${baseSlug}-${hashTitulo.slice(0, 6)}`;
        let suffix = 0;
        while (true) {
          const cand = suffix === 0 ? slug : `${slug}-${suffix}`;
          const exists = await prisma.mensagem.findUnique({ where: { slug: cand }, select: { id: true } });
          if (!exists) { slug = cand; break; }
          suffix++;
          if (suffix > 5) { slug = `${baseSlug}-${hashTitulo}-${Date.now()}`; break; }
        }

        if (args.dryRun) {
          console.log(`  [w${workerId} ${idx + 1}/${jobsShuffled.length}] DRY ${job.cluster.slug}/${job.tipo}/${job.personaSlug} wc=${qg.wordCount} | "${payload.titulo}"`);
        } else {
          // Check hashMetaTitle uniqueness (não bloqueante, só vira null se duplicado)
          const dupMt = await prisma.mensagem.findFirst({ where: { hashMetaTitle }, select: { id: true } });

          await prisma.mensagem.create({
            data: {
              slug,
              titulo: payload.titulo,
              metaTitle: payload.metaTitle,
              metaDescription: payload.metaDescription,
              conteudo: payload.conteudo,
              resumo: payload.resumo,
              tipo: job.tipo,
              wordCount: qg.wordCount,
              hashTitulo,
              hashMetaTitle: dupMt ? null : hashMetaTitle,
              hashConteudo,
              clusterId: job.cluster.id,
              autorId: job.autorId,
              personaId: job.personaId,
              status: "DRAFT",
              tier: "TIER_3",
              origem: "IA",
            },
          });
          console.log(`  [w${workerId} ${idx + 1}/${jobsShuffled.length}] OK ${job.cluster.slug}/${job.tipo}/${job.personaSlug} wc=${qg.wordCount} slug=${slug}`);
        }
        ok++;
      } catch (e) {
        fail++;
        console.error(`  [w${workerId} ${idx + 1}/${jobsShuffled.length}] FAIL ${job.cluster.slug}/${job.tipo}: ${e instanceof Error ? e.message : e}`);
      }

      // Progress a cada 50
      const done = ok + fail + skipDup + skipGate;
      if (done > 0 && done % 50 === 0) {
        const elapsedMin = (Date.now() - t0) / 60000;
        const rate = done / elapsedMin;
        const eta = (jobsShuffled.length - done) / rate;
        console.log(`  >>> Progress ${done}/${jobsShuffled.length} | ok=${ok} fail=${fail} dup=${skipDup} gate=${skipGate} | ${rate.toFixed(1)} msg/min | ETA ${eta.toFixed(1)}min | ~$${custoUsdReal.toFixed(2)}`);
      }
    }
  }

  await Promise.all(Array.from({ length: args.concurrency }, (_, i) => worker(i + 1)));

  const elapsed = (Date.now() - t0) / 1000;
  console.log(`\n${"=".repeat(60)}`);
  console.log(`MASS PRODUCE v3 ${args.dryRun ? "(DRY-RUN)" : "(APLICADO)"}`);
  console.log(`  ${ok} ok · ${skipDup} dup · ${skipGate} gate · ${fail} fail`);
  console.log(`  Custo: ~$${custoUsdReal.toFixed(2)} USD (~R$ ${(custoUsdReal * 5.5).toFixed(2)})`);
  console.log(`  Tempo: ${(elapsed / 60).toFixed(1)} min`);
  console.log(`  Status DEFAULT: DRAFT — Lucas/scheduler promove pra REVIEW/PUBLISHED depois`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
