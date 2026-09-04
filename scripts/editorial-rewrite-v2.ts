/**
 * Reescreve o editorial dos clusters com voz HUMANA verificavel.
 *
 * Diferenca vs v1 (cluster-editorial-content.ts):
 *  - Banlist expandida com os tells detectados em auditoria (quem busca, lacos,
 *    traduzir, nuances, trajetoria, palavras certas, transcende, antes de tudo...)
 *  - Prompt exige CENA CONCRETA na abertura (nao tese abstrata)
 *  - Quality gate automatico: rejeita e retenta se sair com tell banido
 *  - Frases curtas obrigatorias: max 26 palavras/frase em media
 *
 * Uso:
 *   tsx scripts/editorial-rewrite-v2.ts --limit=5 --dry-run
 *   tsx scripts/editorial-rewrite-v2.ts --concurrency=4
 *   tsx scripts/editorial-rewrite-v2.ts --cluster=para-mae
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
const __f = fileURLToPath(import.meta.url);
const __d = dirname(__f);
config({ path: resolve(__d, "..", ".env") });

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { llmJson, llmInfo, llmUsage } from "./lib/llm";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [[m[1], m[2] ?? "true"]] : [];
  }),
);
const LIMIT = args.limit ? Number(args.limit) : undefined;
const DRY = args["dry-run"] === "true";
const CONCURRENCY = args.concurrency ? Number(args.concurrency) : 4;
const ONLY = args.cluster;
const SO_PENDENTES = args.pendentes === "true";

// Tells detectados na auditoria + classicos de LLM
const BANIDOS = [
  "quem busca",
  "lacos",
  "laços",
  "traduzir",
  "nuance",
  "trajetoria",
  "trajetória",
  "palavras certas",
  "transcend",
  "antes de tudo",
  "e possivel optar",
  "é possível optar",
  "nao e apenas",
  "não é apenas",
  "mais do que apenas",
  "em ultima analise",
  "em última análise",
  "vale ressaltar",
  "vale destacar",
  "no fim do dia",
  "em conclusao",
  "em conclusão",
  "jornada",
  "navegar",
  "no mundo de hoje",
  "cada vez mais",
  "em meio a",
  "em uma era",
  "verdadeiro presente",
  "inesquecivel",
  "inesquecível",
  "repleto de",
  "celebrar a vida",
  "momento unico",
  "momento único",
  "gesto de carinho",
  "demonstrar afeto",
  "reafirmar",
  "essencia",
  "essência",
  "universo",
  "peca-chave",
  "peça-chave",
  "papel fundamental",
  "nao se trata apenas",
  "não se trata apenas",
  "por sua vez",
  "dessa forma",
  "assim sendo",
];

const SYSTEM = `Você escreve textos editoriais para o Portal Soma, site brasileiro de mensagens de aniversário.

COMO ESCREVER (isso é o mais importante):
Você escreve como um jornalista de revista que conhece gente de verdade. Abre com uma CENA, um detalhe concreto, uma situação que o leitor reconhece. Nunca abre com tese abstrata.

PADRAO RUIM (soa IA): abertura que define o conceito em abstrato, com adjetivo empilhado.
   Formato típico: "Celebrar [X] e, antes de tudo, reconhecer o valor de uma [substantivo] longa e cheia de [adjetivo]."

PADRAO BOM (soa gente): abertura que coloca o leitor numa cena, ou que nega um lugar-comum.
   Formato típico: "[Situação concreta]. [Observação que contraria o óbvio]."

ATENÇÃO CRÍTICA: esses são PADRÕES DE FORMA, não conteúdo. Você deve escrever sobre a categoria
que receber no pedido do usuário, e SOMENTE sobre ela. Nunca reaproveite exemplo de outra
categoria. Se a categoria for "10 anos de namoro", o texto fala de 10 anos de namoro do início
ao fim.

REGRAS DURAS:
1. Frases curtas. Média de 15 palavras. Nunca passe de 25.
2. Zero jargão de ensaio. Nada de conectivos de ensaio acadêmico (portanto, dessa forma, por sua vez, assim sendo).
3. Use "a gente" e "você". Escreva pra uma pessoa, não pra um público.
4. Cite situações reais: grupo de família no WhatsApp, foto antiga, almoço de domingo, cartão que ninguém lê.
5. Contraste específico vale mais que adjetivo. Em vez de dizer que a data é importante, mostre o detalhe concreto que a torna importante PARA ESSA CATEGORIA.
6. Pode ter opinião. Pode discordar do senso comum. Pode ser levemente engraçado.
7. Nunca use travessão longo. Use vírgula, ponto ou dois-pontos.
8. OBRIGATORIO: escreva com TODOS os acentos do português brasileiro (a, e, i, o, u com acento; c-cedilha; til). Palavras como voce, ja, la, apos, tambem, aniversário, memoria, familia, historia DEVEM sair acentuadas corretamente. Texto sem acento e rejeitado.

PALAVRAS E EXPRESSÕES PROIBIDAS (se usar qualquer uma, o texto é rejeitado):
${BANIDOS.join(", ")}

Retorne JSON válido único, sem markdown:
{
  "introHero": "160-200 palavras. Abre com cena ou observacao concreta sobre essa relacao ou idade. Depois orienta: que tom funciona, o que evitar. Termina posicionando a lista que vem abaixo.",
  "resumoEditorial": "110-140 palavras. Nota de bastidor editorial: por que essas mensagens especificas foram escolhidas, o que separa uma boa de uma generica nessa categoria.",
  "fechamento": "150-180 palavras. Fecha a pagina. Reflexao curta sobre o ato de escrever pra alguem. Menciona naturalmente copiar e mandar no WhatsApp. Sem CTA agressivo.",
  "faqTexto": "5 perguntas reais que a pessoa faria, cada uma como '### Pergunta' seguida de resposta de 2-3 frases diretas. Perguntas de gente: Posso mandar por audio? E se a gente brigou? Quanto e curto demais? Nada de pergunta corporativa."
}`;

interface Gen {
  introHero: string;
  resumoEditorial: string;
  fechamento: string;
  faqTexto: string;
}

function violacoes(txt: string): string[] {
  const low = txt.toLowerCase();
  return BANIDOS.filter((b) => low.includes(b));
}

function avgWordsPerSentence(txt: string): number {
  const frases = txt
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
  if (frases.length === 0) return 0;
  const total = frases.reduce((acc, f) => acc + f.split(/\s+/).length, 0);
  return total / frases.length;
}

async function gerar(
  clusterNome: string,
  tipo: string,
  totalMsgs: number,
  tentativa = 1,
): Promise<Gen | null> {
  const user = `Categoria: "${clusterNome}" (tipo: ${tipo})
Quantidade de mensagens ja publicadas nessa categoria: ${totalMsgs}
URL: portalsoma.com.br/mensagem-de-aniversario/...

Escreva o editorial dessa categoria seguindo TODAS as regras. Lembre: abre com cena concreta, frases curtas, zero jargao.`;

  const parsed = await llmJson<Gen>({
    system: SYSTEM,
    user,
    maxTokens: 14000,
    temperature: 1.0,
  });
  if (!parsed) return null;

  const todo = [parsed.introHero, parsed.resumoEditorial, parsed.fechamento, parsed.faqTexto].join(" ");
  const viol = violacoes(todo);
  const avg = avgWordsPerSentence(parsed.introHero ?? "");
  // Gate de acentuacao: texto pt-BR real tem >2% de chars acentuados
  const acentos = (todo.match(/[áàâãéêíóôõúüç]/gi) ?? []).length;
  const ratioAcento = todo.length > 0 ? acentos / todo.length : 0;
  const semAcento = ratioAcento < 0.015;

  // Gate de relevancia tematica: o texto precisa falar da categoria pedida.
  // Sem isso o modelo copia o exemplo do system prompt (contaminacao few-shot).
  const introLow = (parsed.introHero ?? "").toLowerCase();
  const termosTema = clusterNome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[()]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !["para", "anos", "meses", "bodas", "com"].includes(t));
  const introNorm = introLow.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const temaPresente =
    termosTema.length === 0 || termosTema.some((t) => introNorm.includes(t));
  // Numero no nome (idade, tempo) tambem conta como ancora tematica
  const numTema = clusterNome.match(/\d+/)?.[0];
  const numPresente = numTema ? introNorm.includes(numTema) : false;
  const foraDoTema = !temaPresente && !numPresente;

  if (viol.length > 0 || avg > 26 || semAcento || foraDoTema) {
    if (tentativa < 3) {
      console.log(
        `    retry ${tentativa} (${viol.length ? "tells: " + viol.slice(0, 3).join(",") : semAcento ? "sem acentos" : foraDoTema ? "fora do tema" : `frases longas avg=${avg.toFixed(1)}`})`,
      );
      return gerar(clusterNome, tipo, totalMsgs, tentativa + 1);
    }
    console.log(`    GATE FAIL apos 3 tentativas: ${viol.slice(0, 5).join(", ")}`);
    return null;
  }
  return parsed;
}

async function main() {
  console.log(`[editorial-v2] model=${llmInfo.model} (${llmInfo.provider}) dry=${DRY} concurrency=${CONCURRENCY}`);

  const clusters = await prisma.cluster.findMany({
    where: {
      ativo: true,
      ...(ONLY ? { slug: ONLY } : {}),
      ...(SO_PENDENTES ? { editorial: { modelo: "PENDENTE_V2" } } : {}),
    },
    select: {
      id: true,
      slug: true,
      nome: true,
      tipo: true,
      _count: { select: { mensagens: { where: { status: "PUBLISHED" } } } },
    },
    orderBy: { volumeMensal: "desc" },
    take: LIMIT,
  });
  console.log(`[editorial-v2] clusters alvo: ${clusters.length}`);

  let ok = 0;
  let fail = 0;
  let cursor = 0;
  const t0 = Date.now();

  async function worker(wid: number) {
    while (cursor < clusters.length) {
      const idx = cursor++;
      const c = clusters[idx]!;
      try {
        const g = await gerar(c.nome, c.tipo, c._count.mensagens);
        if (!g) {
          fail++;
          console.log(`  [w${wid} ${idx + 1}/${clusters.length}] FAIL ${c.slug}`);
          continue;
        }
        if (!DRY) {
          await prisma.clusterEditorial.upsert({
            where: { clusterId: c.id },
            create: {
              clusterId: c.id,
              introHero: g.introHero,
              resumoEditorial: g.resumoEditorial,
              fechamento: g.fechamento,
              faqTexto: g.faqTexto,
              modelo: llmInfo.model,
              origemConteudo: "IA",
            },
            update: {
              introHero: g.introHero,
              resumoEditorial: g.resumoEditorial,
              fechamento: g.fechamento,
              faqTexto: g.faqTexto,
              modelo: llmInfo.model,
            },
          });
        }
        ok++;
        console.log(
          `  [w${wid} ${idx + 1}/${clusters.length}] OK ${c.slug} intro=${g.introHero.length}c avg=${avgWordsPerSentence(g.introHero).toFixed(1)}w`,
        );
        if (DRY && idx < 2) console.log(`      >> ${g.introHero.slice(0, 240)}...`);
      } catch (e) {
        fail++;
        console.log(
          `  [w${wid} ${idx + 1}/${clusters.length}] ERR ${c.slug}: ${e instanceof Error ? e.message.slice(0, 120) : e}`,
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1)));
  console.log(`\n[editorial-v2] done: ${ok} ok, ${fail} fail em ${((Date.now() - t0) / 60000).toFixed(1)} min`);
  console.log(`[tokens] in=${llmUsage.tokensIn} out=${llmUsage.tokensOut} calls=${llmUsage.calls}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
