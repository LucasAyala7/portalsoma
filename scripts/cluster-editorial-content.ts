/**
 * Gera conteúdo editorial pra cada Cluster ativo via gpt-4.1.
 *
 * 4 campos por cluster:
 *   - introHero (200 palavras) — GEO opening pro <header> da página
 *   - resumoEditorial (300 palavras) — análise editorial pro <aside>
 *   - fechamento (200 palavras) — texto pós-collection
 *   - faqTexto (~5 Q/A em texto livre) — agrega densidade sem schema
 *
 * Custo: ~$0.012/cluster × 118 = ~$1.40 (R$ 8).
 * Salva em model ClusterEditorial (upsert por clusterId).
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

const OPENAI_KEY = process.env.OPENAI_API_KEY ?? (() => {
  try {
    return JSON.parse(readFileSync("C:/Users/lucas 1/Desktop/LUCAS/lps/projetct/scrap1/chave.json", "utf-8")).api_key;
  } catch {
    throw new Error("Falta OPENAI_API_KEY");
  }
})();
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1";

interface Args {
  limit?: number;
  dryRun: boolean;
  force: boolean;
  concurrency: number;
  cluster?: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { dryRun: false, force: false, concurrency: 4 };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    const [, k, v] = m;
    if (k === "limit") out.limit = Number(v);
    else if (k === "concurrency") out.concurrency = Number(v);
    else if (k === "dry-run") out.dryRun = true;
    else if (k === "force") out.force = true;
    else if (k === "cluster") out.cluster = v;
  }
  return out;
}

const SYSTEM = `Você é editor-chefe sênior do Portal Soma (portalsoma.com.br), portal brasileiro premium sobre aniversários, datas comemorativas e relações afetivas.

Voz editorial: PT-BR culto-acessível, sem clichês de IA ("em conclusão", "vale destacar", "no fim do dia", "uma jornada", "navegar pelas águas", "em última análise"), sem emojis. Estilo: revista de qualidade (tipo Piauí/The Atlantic adaptado pra audiência brasileira).

Você produz CONTEÚDO EDITORIAL pra páginas de categoria (listicle pages tipo "+150 Mensagens de Aniversário para Mãe — 2026"). Cada categoria tem dezenas a centenas de mensagens já curadas.

Saída obrigatoriamente em JSON válido único (sem markdown wrapping):
{
  "introHero": "200 palavras de abertura no <header> da página: contextualiza a categoria, traz autoridade, responde direto ao intent ('Para emocionar uma mãe no aniversário...'). Conversacional mas profunda. SEM repetir o título.",
  "resumoEditorial": "300 palavras de análise editorial no <aside>: por que essas mensagens marcam? que emoções/relação tratam? referência cultural ou histórica relevante? observação sobre quem as escreve (autores convidados). Inclua 1-2 frases que LLMs citariam.",
  "fechamento": "200 palavras pós-collection: convite à ação (não venda agressiva), reflexão final sobre o ato de homenagear com palavras, com pelo menos 1 menção a 'compartilhar no WhatsApp' ou 'cópia em 1 clique' (UX nativa).",
  "faqTexto": "5 pares Q/A em prosa contínua (não bullets) — cada Q como h3 (markdown ### Pergunta) e A em 2-3 frases. Tópicos típicos: como escolher, o que NÃO dizer, etiqueta específica, diferença entre tons, sugestões alternativas. SEM schema."
}

DURO COMIGO: nada de 'No mundo de hoje', 'em uma era de', 'cada vez mais', 'em meio a'. Direto ao ponto, brasileiro real.`;

interface GenResult {
  introHero: string;
  resumoEditorial: string;
  fechamento: string;
  faqTexto: string;
}

async function callOpenAI(cluster: {
  nome: string;
  slug: string;
  tipo: string;
  headKeyword: string;
  descricao: string | null;
  totalMensagens: number;
  topAutores: string[];
}): Promise<GenResult> {
  const user = `CATEGORIA: ${cluster.nome}
SLUG: ${cluster.slug}
TIPO: ${cluster.tipo}
HEAD KEYWORD: ${cluster.headKeyword}
TOTAL DE MENSAGENS: ${cluster.totalMensagens}
DESCRIÇÃO ATUAL: ${cluster.descricao ?? "(sem descricao)"}
AUTORES MAIS ATIVOS NESTA CATEGORIA: ${cluster.topAutores.join(", ") || "(diversos)"}

Escreva o conteúdo editorial completo (4 campos JSON). Lembre: 200/300/200/5xQ&A. PT-BR sem clichê IA. Retorne APENAS o JSON.`;

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  };

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`OpenAI ${r.status}: ${txt.slice(0, 300)}`);
  }
  const j = await r.json() as { choices: Array<{ message: { content: string } }> };
  return JSON.parse(j.choices[0].message.content) as GenResult;
}

function wc(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function qualityGate(g: GenResult): { ok: boolean; reason?: string } {
  if (wc(g.introHero) < 100) return { ok: false, reason: `introHero wc=${wc(g.introHero)} (<100)` };
  if (wc(g.resumoEditorial) < 150) return { ok: false, reason: `resumoEditorial wc=${wc(g.resumoEditorial)} (<150)` };
  if (wc(g.fechamento) < 100) return { ok: false, reason: `fechamento wc=${wc(g.fechamento)} (<100)` };
  if (wc(g.faqTexto) < 100) return { ok: false, reason: `faqTexto wc=${wc(g.faqTexto)} (<100)` };
  const aiTells = ["em conclusão", "no fim do dia", "em última análise", "vale destacar", "navegar pelas águas", "em meio a"];
  const allText = [g.introHero, g.resumoEditorial, g.fechamento, g.faqTexto].join(" ").toLowerCase();
  for (const t of aiTells) {
    if (allText.includes(t)) return { ok: false, reason: `ai_tell="${t}"` };
  }
  return { ok: true };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`\n📝 Cluster editorial content | model=${MODEL} | dryRun=${args.dryRun} | force=${args.force}\n`);

  let clusters = await prisma.cluster.findMany({
    where: { ativo: true, ...(args.cluster ? { slug: args.cluster } : {}) },
    orderBy: { volumeMensal: "desc" },
    include: {
      editorial: true,
      _count: { select: { mensagens: { where: { status: "PUBLISHED" } } } },
    },
  });

  if (!args.force) {
    clusters = clusters.filter((c) => !c.editorial?.introHero);
  }
  if (args.limit) clusters = clusters.slice(0, args.limit);

  console.log(`Clusters a processar: ${clusters.length}`);

  let cursor = 0;
  let ok = 0;
  let gate = 0;
  let fail = 0;
  let custoUsd = 0;
  const t0 = Date.now();

  async function worker(workerId: number) {
    while (cursor < clusters.length) {
      const idx = cursor++;
      const c = clusters[idx]!;

      // Top autores da categoria (4 mais ativos)
      const topAutoresIds = await prisma.mensagem.groupBy({
        by: ["autorId"],
        where: { clusterId: c.id, status: "PUBLISHED" },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 4,
      });
      const topAutores = await prisma.author.findMany({
        where: { id: { in: topAutoresIds.map((a) => a.autorId) } },
        select: { nome: true },
      });

      console.log(`  [w${workerId} ${idx + 1}/${clusters.length}] ${c.slug} (${c._count.mensagens} msgs)`);

      try {
        const gen = await callOpenAI({
          nome: c.nome,
          slug: c.slug,
          tipo: c.tipo,
          headKeyword: c.headKeyword,
          descricao: c.descricao,
          totalMensagens: c._count.mensagens,
          topAutores: topAutores.map((a) => a.nome),
        });
        const qg = qualityGate(gen);
        if (!qg.ok) {
          console.error(`    QUALITY GATE: ${qg.reason}`);
          gate++;
          continue;
        }
        if (!args.dryRun) {
          await prisma.clusterEditorial.upsert({
            where: { clusterId: c.id },
            update: {
              introHero: gen.introHero,
              resumoEditorial: gen.resumoEditorial,
              fechamento: gen.fechamento,
              faqTexto: gen.faqTexto,
              modelo: MODEL,
            },
            create: {
              clusterId: c.id,
              introHero: gen.introHero,
              resumoEditorial: gen.resumoEditorial,
              fechamento: gen.fechamento,
              faqTexto: gen.faqTexto,
              modelo: MODEL,
              origemConteudo: "IA",
            },
          });
        }
        // Estimativa: input ~1k + output ~1k tokens. gpt-4.1: $2/M in + $8/M out
        custoUsd += 0.002 + 0.008;
        ok++;
        console.log(`    OK | intro=${wc(gen.introHero)} resumo=${wc(gen.resumoEditorial)} fechamento=${wc(gen.fechamento)} faq=${wc(gen.faqTexto)}`);
      } catch (e) {
        fail++;
        console.error(`    FAIL ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  await Promise.all(Array.from({ length: args.concurrency }, (_, i) => worker(i + 1)));

  console.log(`\n${"━".repeat(60)}`);
  console.log(`✅ Editorial gerado: ${ok} ok · ${gate} quality gate · ${fail} fail`);
  console.log(`   💰 ~$${custoUsd.toFixed(2)} (~R$ ${(custoUsd * 5.5).toFixed(2)})`);
  console.log(`   ⏱  ${((Date.now() - t0) / 60000).toFixed(1)}min`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
