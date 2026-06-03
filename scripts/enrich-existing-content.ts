/**
 * Enriquece SEO+GEO das mensagens PUBLISHED top-engajamento do Portal Soma.
 *
 * Roda só metadata (metaTitle 54-60 chars + metaDescription 124-140 chars).
 * NÃO mexe em titulo nem em conteudo.
 *
 * Seleção: top 30% PUBLISHED ordenado por score = likes + copies + shares + visualizacoes/10
 * Modelo: gpt-5 (saldo Lucas) com prompt GEO/SEO BR
 *
 * Pra rodar:
 *   # 1. Dry-run primeiro (não toca DB, só imprime):
 *   DATABASE_URL="postgresql://...:55432/portalsoma" \
 *     workers/imagery/node_modules/.bin/tsx scripts/enrich-existing-content.ts --limit=10 --dry-run
 *
 *   # 2. Full run depois:
 *   DATABASE_URL="postgresql://...:55432/portalsoma" \
 *     workers/imagery/node_modules/.bin/tsx scripts/enrich-existing-content.ts --concurrency=4
 *
 * Args:
 *   --limit=N         processa só N mensagens (default: todas as top 30%)
 *   --dry-run         não escreve no DB, só loga
 *   --concurrency=N   workers paralelos (default: 4)
 *   --only-missing    só mensagens com metaTitle null/vazio (default: false)
 *   --refresh-all     considera TODAS PUBLISHED, não só top 30% (default: false)
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local = dirname(__filename_local);
config({ path: resolve(__dirname_local, "..", ".env") });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const OPENAI_KEY = process.env.OPENAI_API_KEY ?? readKeyFromChave();
const MODEL = process.env.OPENAI_MODEL ?? "gpt-5";

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
// PROMPT GEO + SEO BR
// =====================================================

const SYSTEM = `Você é especialista em GEO (Generative Engine Optimization) e SEO BR do Portal Soma (portalsoma.com.br) — portal brasileiro de mensagens de aniversário e datas comemorativas.

Seu trabalho: gerar metaTitle e metaDescription PT-BR de uma mensagem já publicada, com objetivos duplos:
1) SEO clássico: CTR alto na SERP do Google BR
2) GEO: ser CITÁVEL por motores generativos (Google AI Mode/Overviews, ChatGPT search, Perplexity, Gemini) — frases auto-suficientes, claim concreto, sem clickbait vazio

REGRAS DURAS:
- Português BR ortografia atualizada (Acordo Ortográfico). Ex: "ideia" sem trema, "linguiça" com ç.
- Linguagem culta-mas-acessível. Sem rebuscamento desnecessário, sem gírias de baixa.
- NUNCA usar emoji.
- NUNCA usar reticências (...) artificiais. Sem "navegar pelas águas", "jornada", "no fim do dia", "em conclusão", "vale destacar".
- NUNCA mentir sobre a mensagem (ex: prometer "10 frases" se for só 1).
- NUNCA prometer download/PDF/lista quando não há.
- Sazonalidade BR só quando RELEVANTE ao conteúdo (Dia das Mães em mensagens para mãe, Dia dos Pais para pai, Dia do Amigo para amizade, etc). Se não couber, NÃO forçar.
- metaTitle: 54-60 chars (alvo 57). Inclui keyword principal natural, sem stuffing. Pode ter " | Portal Soma" no final se couber (cortar se exceder 60).
- metaDescription: 124-140 chars (alvo 132). Frase com benefício + contexto + sutil call-to-action ("leia", "veja", "encontre", "use"). Sem ponto final obrigatório se não couber.
- Diferencial GEO: meta deve responder a INTENT — "quem é destinatário?", "qual tom?", "pra qual ocasião?". Densidade semântica > keyword stuffing.

FORMATO: o usuário envia a mensagem atual + metadata atual. Você devolve APENAS JSON válido (sem markdown wrap, sem \`\`\`):

{
  "metaTitle": "...",
  "metaDescription": "...",
  "notes": "1 frase curta sobre o que mudou vs metadata anterior, ou 'mantido (já bom)'"
}

Se o metaTitle/metaDescription anterior já estiver bom (tamanho ok, GEO ok), pode refinar SUTILMENTE — não reescrever só por reescrever. Sinalize em notes.`;

interface MsgInput {
  id: string;
  slug: string;
  titulo: string;
  conteudo: string;
  resumo: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  clusterNome: string;
  clusterHeadKw: string;
  complementoNome: string | null;
  score: number;
}

function buildUserPrompt(m: MsgInput): string {
  const trechoConteudo = m.conteudo.length > 600 ? m.conteudo.slice(0, 600) + "..." : m.conteudo;
  return `CLUSTER: ${m.clusterNome}${m.complementoNome ? " > " + m.complementoNome : ""}
HEAD KEYWORD DO CLUSTER: ${m.clusterHeadKw}

TÍTULO H1 (não alterar): ${m.titulo}
SLUG (URL): /${m.slug}

CONTEÚDO DA MENSAGEM (referência):
${trechoConteudo}

RESUMO ATUAL: ${m.resumo ?? "(vazio)"}
META TITLE ATUAL: ${m.metaTitle ?? "(vazio)"} (${m.metaTitle?.length ?? 0} chars)
META DESC ATUAL: ${m.metaDescription ?? "(vazio)"} (${m.metaDescription?.length ?? 0} chars)

Gere/refine metaTitle (54-60 chars) e metaDescription (124-140 chars) seguindo as REGRAS DURAS do system. Retorne APENAS JSON.`;
}

// =====================================================
// OPENAI
// =====================================================

interface GenResult {
  metaTitle: string;
  metaDescription: string;
  notes?: string;
}

async function callOpenAI(m: MsgInput): Promise<GenResult> {
  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: buildUserPrompt(m) },
    ],
    response_format: { type: "json_object" },
  };
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`OpenAI ${r.status}: ${txt.slice(0, 300)}`);
  }
  const j = (await r.json()) as { choices: Array<{ message: { content: string } }> };
  const raw = j.choices[0].message.content;
  return JSON.parse(raw) as GenResult;
}

// =====================================================
// QUALITY GATE / FIXERS
// =====================================================

function trimToRange(s: string, min: number, max: number): { value: string; status: "ok" | "trimmed" | "too_short" } {
  const trimmed = s.trim().replace(/\s+/g, " ");
  if (trimmed.length >= min && trimmed.length <= max) return { value: trimmed, status: "ok" };
  if (trimmed.length > max) {
    // corta no último espaço antes do max pra não quebrar palavra
    let cut = trimmed.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    if (lastSpace > min) cut = cut.slice(0, lastSpace);
    return { value: cut.replace(/[,;.\-]+$/, ""), status: "trimmed" };
  }
  return { value: trimmed, status: "too_short" };
}

function validate(gen: GenResult): { ok: boolean; metaTitle: string; metaDescription: string; reason?: string } {
  if (!gen.metaTitle || !gen.metaDescription) {
    return { ok: false, metaTitle: "", metaDescription: "", reason: "campos ausentes" };
  }
  const mt = trimToRange(gen.metaTitle, 40, 65);
  const md = trimToRange(gen.metaDescription, 110, 145);
  if (mt.status === "too_short") {
    return { ok: false, metaTitle: mt.value, metaDescription: md.value, reason: `metaTitle muito curto (${mt.value.length})` };
  }
  if (md.status === "too_short") {
    return { ok: false, metaTitle: mt.value, metaDescription: md.value, reason: `metaDescription muito curta (${md.value.length})` };
  }
  // emoji guard
  if (/\p{Emoji_Presentation}|\p{Extended_Pictographic}/u.test(mt.value + md.value)) {
    return { ok: false, metaTitle: mt.value, metaDescription: md.value, reason: "contém emoji" };
  }
  return { ok: true, metaTitle: mt.value, metaDescription: md.value };
}

// =====================================================
// ARGS
// =====================================================

interface Args {
  limit?: number;
  dryRun: boolean;
  concurrency: number;
  onlyMissing: boolean;
  refreshAll: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { dryRun: false, concurrency: 4, onlyMissing: false, refreshAll: false };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    const [, k, v] = m;
    if (k === "limit") out.limit = Number(v);
    else if (k === "dry-run") out.dryRun = true;
    else if (k === "concurrency") out.concurrency = Number(v) || 4;
    else if (k === "only-missing") out.onlyMissing = true;
    else if (k === "refresh-all") out.refreshAll = true;
  }
  return out;
}

// =====================================================
// MAIN
// =====================================================

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`\nEnrich SEO+GEO | model=${MODEL} | dry-run=${args.dryRun} | concurrency=${args.concurrency} | only-missing=${args.onlyMissing} | refresh-all=${args.refreshAll}\n`);

  // 1. Conta total PUBLISHED
  const totalPublished = await prisma.mensagem.count({ where: { status: "PUBLISHED" } });
  console.log(`Total mensagens PUBLISHED no DB: ${totalPublished}`);

  // 2. Top 30% por score = likes + copies + shares + visualizacoes/10
  //    Postgres raw query pra ordenar pelo score composto
  const top30Pct = Math.ceil(totalPublished * 0.3);
  console.log(`Top 30% = ~${top30Pct} mensagens`);

  type Row = {
    id: string;
    slug: string;
    titulo: string;
    conteudo: string;
    resumo: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    clusterId: string;
    complementoId: string | null;
    score: number;
  };

  const onlyMissingClause = args.onlyMissing
    ? `AND (m."metaTitle" IS NULL OR m."metaTitle" = '' OR LENGTH(m."metaTitle") < 40)`
    : ``;
  const limitClause = args.refreshAll ? totalPublished : top30Pct;

  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `
    SELECT
      m.id, m.slug, m.titulo, m.conteudo, m.resumo,
      m."metaTitle", m."metaDescription",
      m."clusterId", m."complementoId",
      (m.likes + m.copies + m.shares + (m.visualizacoes / 10.0)) AS score
    FROM "Mensagem" m
    WHERE m.status = 'PUBLISHED'
    ${onlyMissingClause}
    ORDER BY score DESC, m."publicadoEm" DESC NULLS LAST
    LIMIT ${limitClause}
    `
  );

  let targets = rows;
  if (args.limit) targets = targets.slice(0, args.limit);

  console.log(`Mensagens a processar: ${targets.length}`);
  if (targets.length === 0) {
    console.log("Nada a fazer.");
    await prisma.$disconnect();
    return;
  }

  // 3. Pré-fetch clusters/complementos pra contexto
  const clusterIds = [...new Set(targets.map((t) => t.clusterId))];
  const complementoIds = [...new Set(targets.map((t) => t.complementoId).filter(Boolean) as string[])];
  const clusters = await prisma.cluster.findMany({
    where: { id: { in: clusterIds } },
    select: { id: true, nome: true, headKeyword: true },
  });
  const complementos = await prisma.complemento.findMany({
    where: { id: { in: complementoIds } },
    select: { id: true, nome: true },
  });
  const clusterById = new Map(clusters.map((c) => [c.id, c]));
  const compById = new Map(complementos.map((c) => [c.id, c]));

  // 4. Worker pool
  let cursor = 0;
  let ok = 0;
  let fail = 0;
  let skip = 0;
  let custoUsdEstimado = 0;
  const t0 = Date.now();

  async function worker(workerId: number) {
    while (cursor < targets.length) {
      const idx = cursor++;
      const row = targets[idx]!;
      const c = clusterById.get(row.clusterId);
      if (!c) {
        console.warn(`  [w${workerId}] cluster ${row.clusterId} não encontrado, pulando ${row.slug}`);
        skip++;
        continue;
      }
      const comp = row.complementoId ? compById.get(row.complementoId) : null;

      const input: MsgInput = {
        id: row.id,
        slug: row.slug,
        titulo: row.titulo,
        conteudo: row.conteudo,
        resumo: row.resumo,
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
        clusterNome: c.nome,
        clusterHeadKw: c.headKeyword,
        complementoNome: comp?.nome ?? null,
        score: Number(row.score) || 0,
      };

      try {
        const gen = await callOpenAI(input);
        const val = validate(gen);
        // Estimativa custo gpt-5: in ~1k tokens × $1.25/M + out ~150 tokens × $10/M = ~$0.003/msg (margem pra ~$0.005)
        custoUsdEstimado += 0.005;

        if (!val.ok) {
          console.warn(`  [w${workerId} ${idx + 1}/${targets.length}] SKIP ${row.slug} | ${val.reason}`);
          skip++;
          continue;
        }

        if (args.dryRun) {
          console.log(
            `  [w${workerId} ${idx + 1}/${targets.length}] DRY ${row.slug}\n      MT (${val.metaTitle.length}): ${val.metaTitle}\n      MD (${val.metaDescription.length}): ${val.metaDescription}\n      notes: ${gen.notes ?? "-"}`
          );
        } else {
          await prisma.mensagem.update({
            where: { id: row.id },
            data: {
              metaTitle: val.metaTitle,
              metaDescription: val.metaDescription,
            },
          });
          console.log(
            `  [w${workerId} ${idx + 1}/${targets.length}] OK ${row.slug} | MT=${val.metaTitle.length}c MD=${val.metaDescription.length}c`
          );
        }
        ok++;
      } catch (e) {
        fail++;
        console.error(`  [w${workerId} ${idx + 1}/${targets.length}] FAIL ${row.slug} | ${e instanceof Error ? e.message : e}`);
      }

      // Progress log a cada 50
      const done = ok + fail + skip;
      if (done % 50 === 0 && done > 0) {
        const elapsedMin = (Date.now() - t0) / 60000;
        const rate = done / elapsedMin;
        const eta = (targets.length - done) / rate;
        console.log(
          `  >>> Progress: ${done}/${targets.length} | ok=${ok} fail=${fail} skip=${skip} | ${rate.toFixed(1)} msg/min | ETA ${eta.toFixed(1)}min | ~$${custoUsdEstimado.toFixed(2)}`
        );
      }
    }
  }

  await Promise.all(Array.from({ length: args.concurrency }, (_, i) => worker(i + 1)));

  const elapsed = (Date.now() - t0) / 1000;
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`ENRICH SEO+GEO ${args.dryRun ? "(DRY-RUN)" : "(APLICADO)"}: ${ok} ok · ${skip} skip · ${fail} fail`);
  console.log(`   Custo estimado: ~$${custoUsdEstimado.toFixed(2)} USD (~R$ ${(custoUsdEstimado * 5.5).toFixed(2)})`);
  console.log(`   Tempo: ${(elapsed / 60).toFixed(1)} min`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
