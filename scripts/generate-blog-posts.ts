/**
 * Gera 30 posts editoriais (long-form 1500-2500 palavras) pra blog do Portal Soma.
 * Usa OpenAI gpt-5 (Lucas tem saldo). Insert no DB como PUBLISHED.
 *
 * Pra rodar:
 *   DATABASE_URL="postgresql://...:55432/portalsoma" tsx scripts/generate-blog-posts.ts [--limit=5] [--draft]
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
    const data = JSON.parse(readFileSync("C:/Users/lucas 1/Desktop/LUCAS/lps/projetct/scrap1/chave.json", "utf-8"));
    return data.api_key;
  } catch {
    throw new Error("Falta OPENAI_API_KEY (env ou chave.json)");
  }
}

// =====================================================
// PLAN: 6 tópicos por categoria × 5 categorias = 30 posts
// Cada tópico tem: angle, ideal_persona (slug), keyword_hint
// =====================================================

interface Topic {
  catSlug: string;
  titulo: string;
  angle: string;
  personaSlug: string | null;
  authorSlug: string;
  tags: string[];
}

const PLAN: Topic[] = [
  // === SIGNIFICADO DA DATA ===
  { catSlug: "significado-da-data", titulo: "O que sua data de aniversário diz sobre você", angle: "psicológico + cultural; sem astrologia esotérica, foco em construção de identidade", personaSlug: "profa-beatriz-coelho", authorSlug: "lucas-ayala", tags: ["psicologia","identidade","aniversário","autoconhecimento"] },
  { catSlug: "significado-da-data", titulo: "Aniversários como ritos de passagem na cultura brasileira", angle: "antropológico, comparando ritual brasileiro vs outras culturas (15 anos, bodas, 60+)", personaSlug: "profa-beatriz-coelho", authorSlug: "lucas-ayala", tags: ["cultura","ritual","tradição","brasil"] },
  { catSlug: "significado-da-data", titulo: "Por que muita gente passou a odiar aniversário (e como mudar isso)", angle: "ensaio honesto sobre ansiedade etária, FOMO de não-celebração, e caminhos de reconciliação", personaSlug: "rafael-andrade", authorSlug: "lucas-ayala", tags: ["emoções","ansiedade","aceitação","celebração"] },
  { catSlug: "significado-da-data", titulo: "Aniversários redondos: o peso simbólico dos 30, 40, 50", angle: "por que números redondos pesam mais; psicologia do milestone; ritos contemporâneos", personaSlug: "profa-beatriz-coelho", authorSlug: "lucas-ayala", tags: ["milestone","30-anos","40-anos","50-anos"] },
  { catSlug: "significado-da-data", titulo: "Como aniversários moldam a memória autobiográfica", angle: "neurociência leve da memória + por que datas marcantes ancoram identidade", personaSlug: "profa-beatriz-coelho", authorSlug: "lucas-ayala", tags: ["memória","cérebro","autobiografia","psicologia"] },
  { catSlug: "significado-da-data", titulo: "Aniversário e espiritualidade: celebrar a vida em diferentes tradições", angle: "panorama: tradição cristã (evangélica/católica), espírita, judaica, oriental; sem prosélitismo", personaSlug: "pastor-antonio", authorSlug: "lucas-ayala", tags: ["espiritualidade","fé","tradições","celebração"] },

  // === ETIQUETA ===
  { catSlug: "etiqueta-do-aniversario", titulo: "Como parabenizar no WhatsApp sem soar genérico", angle: "manual prático contra a maldição do 'parabéns!' seco; estrutura de mensagem que toca", personaSlug: "marcos-almeida", authorSlug: "lucas-ayala", tags: ["whatsapp","mensagem","etiqueta","comunicação"] },
  { catSlug: "etiqueta-do-aniversario", titulo: "Esqueci o aniversário de alguém — e agora?", angle: "guia honesto de reparação, com timing, palavras certas e o que evitar", personaSlug: "tia-fatima", authorSlug: "lucas-ayala", tags: ["etiqueta","reparação","amizade","gafes"] },
  { catSlug: "etiqueta-do-aniversario", titulo: "Dar os parabéns ao chefe: o que funciona e o que constrange", angle: "etiqueta corporativa: o que dizer, em qual canal, e quando ficar quieto", personaSlug: "marcos-almeida", authorSlug: "lucas-ayala", tags: ["corporativo","chefe","etiqueta","trabalho"] },
  { catSlug: "etiqueta-do-aniversario", titulo: "Mensagem de aniversário para ex: vale a pena? Quando?", angle: "framework decisório (relação atual, tempo, contexto); exemplos do que evitar", personaSlug: "julia-marques", authorSlug: "lucas-ayala", tags: ["ex","relacionamento","comunicação","limites"] },
  { catSlug: "etiqueta-do-aniversario", titulo: "Festa surpresa: quando vale e quando é egoísta", angle: "checklist de quando o gesto serve à pessoa vs ao gesteador", personaSlug: "tia-fatima", authorSlug: "lucas-ayala", tags: ["festa","surpresa","etiqueta","afeto"] },
  { catSlug: "etiqueta-do-aniversario", titulo: "Convites de aniversário: o que dizer e o que NUNCA dizer", angle: "redação prática, com exemplos do bom e do constrangedor", personaSlug: "marcos-almeida", authorSlug: "lucas-ayala", tags: ["convite","festa","comunicação","redação"] },

  // === PRESENTES ===
  { catSlug: "presentes-e-mimos", titulo: "Presentes que valem mais que dinheiro: 10 ideias afetivas", angle: "lista curada com explicação do PORQUÊ cada um marca", personaSlug: "rafael-andrade", authorSlug: "lucas-ayala", tags: ["presentes","afeto","ideias","economia"] },
  { catSlug: "presentes-e-mimos", titulo: "Como escolher presente pra mãe que diz 'não quero nada'", angle: "decodificando o subtexto materno; alternativas de 'experiência' ao 'objeto'", personaSlug: "vo-lurdes", authorSlug: "lucas-ayala", tags: ["mãe","presentes","família","afeto"] },
  { catSlug: "presentes-e-mimos", titulo: "Presentes para amigos de longa data: a regra dos 3 anos", angle: "framework de gradação por tempo de relação; exemplos práticos", personaSlug: "rafael-andrade", authorSlug: "lucas-ayala", tags: ["amizade","presentes","relações","tempo"] },
  { catSlug: "presentes-e-mimos", titulo: "Presentes corporativos: acertar sem invadir o pessoal", angle: "etiqueta + sugestões neutras de alto impacto", personaSlug: "marcos-almeida", authorSlug: "lucas-ayala", tags: ["corporativo","etiqueta","presentes","trabalho"] },
  { catSlug: "presentes-e-mimos", titulo: "Presentes minimalistas: a alegria do 'nada pra arrumar'", angle: "tendência minimalista; lista de experiências, serviços, consumíveis", personaSlug: "julia-marques", authorSlug: "lucas-ayala", tags: ["minimalismo","experiências","sustentável","presentes"] },
  { catSlug: "presentes-e-mimos", titulo: "Presentes para crianças: idade, fase e intenção emocional", angle: "guia por faixa etária (0-3, 4-7, 8-12); evitando armadilhas do consumismo", personaSlug: "vo-lurdes", authorSlug: "lucas-ayala", tags: ["crianças","educação","presentes","desenvolvimento"] },

  // === CELEBRAÇÃO E FESTA ===
  { catSlug: "celebracao-e-festa", titulo: "Festas íntimas vs grandes: prós e contras de cada formato", angle: "comparativo honesto pra ajudar a decidir; quem se beneficia de cada", personaSlug: "tia-fatima", authorSlug: "lucas-ayala", tags: ["festa","celebração","planejamento","intimidade"] },
  { catSlug: "celebracao-e-festa", titulo: "Como organizar festa de aniversário sem stress", angle: "checklist de 7 etapas; o que delegar, o que cortar, o que não economizar", personaSlug: "marcos-almeida", authorSlug: "lucas-ayala", tags: ["planejamento","festa","organização","stress"] },
  { catSlug: "celebracao-e-festa", titulo: "Temas de festa adulta: além do tropical e do anos 80", angle: "10 temas frescos com sugestões de decoração, dress code, música", personaSlug: "tia-fatima", authorSlug: "lucas-ayala", tags: ["temas","festa","decoração","ideias"] },
  { catSlug: "celebracao-e-festa", titulo: "Aniversário online: como uma chamada de vídeo vira comemoração real", angle: "rituais digitais que funcionam; estrutura de 1h pra não cair em silêncio", personaSlug: "marcos-almeida", authorSlug: "lucas-ayala", tags: ["online","videocall","distância","celebração"] },
  { catSlug: "celebracao-e-festa", titulo: "Decoração de aniversário em casa: ideias acessíveis e marcantes", angle: "10 setups de baixo custo com alto impacto visual", personaSlug: "tia-fatima", authorSlug: "lucas-ayala", tags: ["decoração","faça-você-mesmo","casa","festa"] },
  { catSlug: "celebracao-e-festa", titulo: "Aniversário no restaurante: organizar sem dor de cabeça", angle: "guia logístico: reserva, divisão da conta, surpresa, etiqueta", personaSlug: "marcos-almeida", authorSlug: "lucas-ayala", tags: ["restaurante","festa","organização","etiqueta"] },

  // === RELAÇÕES E AFETO ===
  { catSlug: "relacoes-e-afeto", titulo: "O aniversário como termômetro de relações", angle: "quem lembra, quem manda mensagem, quem aparece — o que isso revela", personaSlug: "vo-lurdes", authorSlug: "lucas-ayala", tags: ["relações","afeto","amizade","percepção"] },
  { catSlug: "relacoes-e-afeto", titulo: "Reconciliação no aniversário: a oportunidade que poucos usam", angle: "psicologia da data como abertura simbólica pra reaproximação", personaSlug: "rafael-andrade", authorSlug: "lucas-ayala", tags: ["reconciliação","perdão","relações","amizade"] },
  { catSlug: "relacoes-e-afeto", titulo: "Aniversários de quem perdeu alguém: como honrar a data", angle: "luto + memória; rituais íntimos pra manter presença sem dor paralisante", personaSlug: "padre-henrique", authorSlug: "lucas-ayala", tags: ["luto","memória","saudade","ritual"] },
  { catSlug: "relacoes-e-afeto", titulo: "Aniversário e infância: como tratamos os pequenos define o adulto", angle: "psicologia infantil; o que fica gravado pra vida; sinais de excesso/falta", personaSlug: "vo-lurdes", authorSlug: "lucas-ayala", tags: ["infância","educação","memória","desenvolvimento"] },
  { catSlug: "relacoes-e-afeto", titulo: "Aniversário no casamento: o segundo desafio das datas", angle: "como casais lidam com aniversários individuais vs comuns; armadilhas e bons hábitos", personaSlug: "julia-marques", authorSlug: "lucas-ayala", tags: ["casamento","relacionamento","afeto","comunicação"] },
  { catSlug: "relacoes-e-afeto", titulo: "Amizades que sobrevivem ao tempo: o teste anual", angle: "o aniversário como momento de auditoria afetiva; quem permanece importa", personaSlug: "julia-marques", authorSlug: "lucas-ayala", tags: ["amizade","tempo","relações","afeto"] },
];

// =====================================================
// PROMPT BUILDERS
// =====================================================

const SYSTEM = `Você é redator editorial sênior do Portal Soma (portalsoma.com.br), um portal brasileiro sobre aniversários, datas comemorativas e relações afetivas. Escreve em PT-BR culto mas acessível, com voz humana — sem tiques de IA (não usa "em conclusão", "vale a pena destacar", "navegar pelas águas", "no fim do dia", "em última análise", "uma jornada"). Texto claro, parágrafos respiráveis, exemplos concretos. Estilo: revista de qualidade tipo Piauí ou The Atlantic adaptado pra audiência brasileira ampla.

Você produz posts de blog editorial de 1500-2500 palavras com estrutura:
- 1 parágrafo de abertura instigante (sem clichê)
- 4-6 seções H2 com argumento próprio
- H3 dentro de H2 quando faz sentido
- 1-2 listas bem feitas (não em todo H2)
- 1 blockquote citação de autoridade ou frase impactante por post
- 1 parágrafo de encerramento que leva o leitor a refletir (sem moralismo)

NÃO usa emojis. NÃO usa "como [persona]" no texto — só assina. NÃO menciona Portal Soma em primeira pessoa institucional ("nós do Portal Soma"); fala como autor.

Saída obrigatoriamente em JSON único válido com este schema (sem markdown wrapping, sem \`\`\`json):
{
  "title": "Título exato fornecido (não altere)",
  "metaTitle": "Título SEO 54-60 chars",
  "metaDescription": "Descrição 124-140 chars com call sutil",
  "resumo": "1 frase de 120-200 chars que captura a essência",
  "conteudo": "POST COMPLETO em Markdown",
  "slug": "kebab-case-ascii-com-no-maximo-80-chars"
}`;

function buildUserPrompt(topic: Topic, categoriaNome: string): string {
  return `CATEGORIA: ${categoriaNome}
TÍTULO: ${topic.titulo}
ANGLE: ${topic.angle}
TAGS-ALVO: ${topic.tags.join(", ")}

Escreva o post completo (1500-2500 palavras) com a estrutura editorial descrita no system. Retorne APENAS o JSON.`;
}

// =====================================================
// OPENAI CALL
// =====================================================

interface GenResult {
  title: string;
  metaTitle: string;
  metaDescription: string;
  resumo: string;
  conteudo: string;
  slug: string;
}

async function callOpenAI(topic: Topic, categoriaNome: string): Promise<GenResult> {
  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: buildUserPrompt(topic, categoriaNome) },
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
  const j = await r.json() as { choices: Array<{ message: { content: string } }>; usage?: { prompt_tokens: number; completion_tokens: number } };
  const raw = j.choices[0].message.content;
  const parsed = JSON.parse(raw) as GenResult;
  return parsed;
}

// =====================================================
// SLUG / QUALITY HELPERS
// =====================================================

function normalizeSlug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function qualityGate(post: GenResult): { ok: boolean; reason?: string } {
  const wc = countWords(post.conteudo);
  if (wc < 1200) return { ok: false, reason: `wordCount=${wc} (<1200)` };
  const h2Count = (post.conteudo.match(/^##\s/gm) || []).length;
  if (h2Count < 3) return { ok: false, reason: `h2_count=${h2Count} (<3)` };
  const aiTells = ["em conclusão", "vale a pena destacar", "no fim do dia", "em última análise"];
  for (const t of aiTells) {
    if (post.conteudo.toLowerCase().includes(t)) {
      return { ok: false, reason: `ai_tell="${t}"` };
    }
  }
  return { ok: true };
}

// =====================================================
// MAIN
// =====================================================

interface Args {
  limit?: number;
  draft: boolean;
  category?: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { draft: false };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    const [, k, v] = m;
    if (k === "limit") out.limit = Number(v);
    else if (k === "draft") out.draft = true;
    else if (k === "category") out.category = v;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`\n📝 Gerando blog posts | model=${MODEL} | status=${args.draft ? "DRAFT" : "PUBLISHED"} | limit=${args.limit ?? PLAN.length}\n`);

  const categorias = await prisma.blogCategory.findMany({ where: { ativo: true } });
  const catBySlug = new Map(categorias.map((c) => [c.slug, c]));

  const authors = await prisma.author.findMany({ where: { ativo: true } });
  const authorBySlug = new Map(authors.map((a) => [a.slug, a]));

  let topics = args.category ? PLAN.filter((t) => t.catSlug === args.category) : PLAN;
  if (args.limit) topics = topics.slice(0, args.limit);

  console.log(`Topics a processar: ${topics.length}`);
  const validSlugs = new Set(authors.map((a) => a.slug));
  for (const t of topics) {
    if (!catBySlug.has(t.catSlug)) {
      throw new Error(`Categoria não encontrada no DB: ${t.catSlug}`);
    }
    if (!validSlugs.has(t.authorSlug)) {
      console.warn(`  [warn] autor "${t.authorSlug}" não encontrado — usando primeiro disponível`);
      t.authorSlug = authors[0].slug;
    }
  }

  let cursor = 0;
  let ok = 0;
  let fail = 0;
  let custoUsdEstimado = 0;
  const concurrency = 3;
  const t0 = Date.now();

  async function worker(workerId: number) {
    while (cursor < topics.length) {
      const idx = cursor++;
      const topic = topics[idx]!;
      const cat = catBySlug.get(topic.catSlug)!;
      const autor = authorBySlug.get(topic.authorSlug)!;
      console.log(`  [w${workerId} ${idx + 1}/${topics.length}] generating "${topic.titulo.slice(0, 50)}..." (cat=${topic.catSlug})`);

      try {
        const gen = await callOpenAI(topic, cat.nome);
        const qg = qualityGate(gen);
        if (!qg.ok) {
          console.error(`  [w${workerId}] QUALITY FAIL: ${qg.reason} | ${topic.titulo}`);
          fail++;
          continue;
        }

        let slug = normalizeSlug(gen.slug || gen.title || topic.titulo);
        // colisão check
        let suffix = 0;
        while (true) {
          const cand = suffix === 0 ? slug : `${slug}-${suffix}`;
          const exists = await prisma.post.findUnique({ where: { slug: cand } });
          if (!exists) { slug = cand; break; }
          suffix++;
        }

        const wc = countWords(gen.conteudo);
        const tempoLeitura = Math.max(1, Math.round(wc / 200));

        await prisma.post.create({
          data: {
            slug,
            titulo: gen.title || topic.titulo,
            metaTitle: gen.metaTitle,
            metaDescription: gen.metaDescription,
            conteudo: gen.conteudo,
            resumo: gen.resumo,
            wordCount: wc,
            tempoLeitura,
            categoriaId: cat.id,
            autorId: autor.id,
            tags: topic.tags,
            status: args.draft ? "DRAFT" : "PUBLISHED",
            origem: "IA",
            publicadoEm: args.draft ? null : new Date(),
          },
        });
        ok++;
        // Estimativa custo gpt-5: in ~10k tokens × $1.25/M + out ~3k × $10/M = ~$0.045 / post
        custoUsdEstimado += 0.045;
        console.log(`  [w${workerId}] OK | slug=${slug} | wc=${wc} | t=${tempoLeitura}min`);
      } catch (e) {
        fail++;
        console.error(`  [w${workerId}] FAIL: ${topic.titulo} | ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i + 1)));

  const elapsed = (Date.now() - t0) / 1000;
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ BLOG GERADO: ${ok} novos · ${fail} fail`);
  console.log(`   💰 ~$${custoUsdEstimado.toFixed(2)} USD estimado (~R$ ${(custoUsdEstimado * 5.5).toFixed(2)})`);
  console.log(`   ⏱  ${(elapsed / 60).toFixed(1)}min`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
