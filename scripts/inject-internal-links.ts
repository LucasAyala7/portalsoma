/**
 * Injeta 1-3 internal links contextuais em mensagens PUBLISHED com wordCount >= 400.
 * Sem IA — deterministic mapping baseado em:
 *   - Mesma cluster/nicho
 *   - Mensagens irmãs do mesmo autor
 *   - Complementos relacionados (quando aplicável)
 *   - Em frase contextual (não "veja aqui")
 *
 * Estratégia: pra cada mensagem long-form, escolhe 2 frases de transição (parágrafo
 * intermediário, não primeira nem última) e envolve em link Markdown pra alvo relevante.
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local = dirname(__filename_local);
config({ path: resolve(__dirname_local, "..", ".env") });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Args {
  limit?: number;
  dryRun: boolean;
  minWords: number;
  maxLinks: number;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { dryRun: false, minWords: 400, maxLinks: 2 };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    const [, k, v] = m;
    if (k === "limit") out.limit = Number(v);
    else if (k === "dry-run") out.dryRun = true;
    else if (k === "min-words") out.minWords = Number(v);
    else if (k === "max-links") out.maxLinks = Number(v);
  }
  return out;
}

// =====================================================
// LINK CANDIDATE SCORING
// =====================================================

interface MensagemLite {
  id: string;
  slug: string;
  titulo: string;
  conteudo: string;
  autorId: string;
  clusterId: string;
  complementoId: string | null;
  likes: number;
  copies: number;
  cluster: { slug: string; nicho: { slug: string } };
}

/**
 * Pra mensagem-alvo, escolhe 2 candidatos relevantes pra linkar:
 *   - Prefer: mesma cluster OU mesmo autor
 *   - Sort: por popularidade (likes + copies)
 *   - Exclude: a própria mensagem + slugs já linkados no conteudo
 */
function pickCandidates(target: MensagemLite, pool: MensagemLite[], maxLinks: number): MensagemLite[] {
  const targetUrl = `/${target.cluster.nicho.slug}/${target.cluster.slug}/${target.slug}/`;
  const conteudoLower = target.conteudo.toLowerCase();
  const alreadyLinked = new Set<string>();
  // Detecta links já existentes
  const linkMatches = target.conteudo.matchAll(/\]\(([^)]+)\)/g);
  for (const m of linkMatches) alreadyLinked.add(m[1]);

  return pool
    .filter((m) => m.id !== target.id)
    .filter((m) => {
      const url = `/${m.cluster.nicho.slug}/${m.cluster.slug}/${m.slug}/`;
      return url !== targetUrl && !alreadyLinked.has(url);
    })
    .map((m) => {
      let score = (m.likes ?? 0) + (m.copies ?? 0);
      if (m.clusterId === target.clusterId) score += 1000;
      if (m.complementoId && m.complementoId === target.complementoId) score += 500;
      if (m.autorId === target.autorId) score += 200;
      return { m, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxLinks)
    .map((x) => x.m);
}

// =====================================================
// SENTENCE SPLITTING + INJECTION
// =====================================================

/** Splits conteudo em "tokens": parágrafos com índices. */
function splitParagraphs(conteudo: string): { para: string; idx: number }[] {
  const paras = conteudo.split(/\n\n+/);
  return paras.map((p, idx) => ({ para: p.trim(), idx })).filter((x) => x.para.length > 0);
}

/** Encontra uma frase com a palavra-âncora (case-insensitive), envolve em link Markdown. */
function injectLinkInPara(para: string, anchorWords: string[], targetUrl: string): { newPara: string; injected: boolean } {
  // Primeira sentença do parágrafo (split em . ! ?)
  const sentences = para.split(/(?<=[.!?])\s+/);
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    for (const anchor of anchorWords) {
      const re = new RegExp(`\\b(${anchor})\\b`, "i");
      const match = re.exec(s);
      if (match && !s.includes("](")) {
        // Pega frase contextual (a anchor + algumas palavras antes/depois)
        const before = s.slice(0, match.index);
        const after = s.slice(match.index + match[0].length);
        // Construir frase pra linkar: anchor + ate 4 palavras seguintes
        const followWords = after.trim().split(/\s+/).slice(0, 4).join(" ");
        const phrase = followWords ? `${match[0]} ${followWords}` : match[0];
        // Encontra a phrase ORIGINAL no sentence (capitalização correta)
        const phraseRe = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        const phraseMatch = phraseRe.exec(s);
        if (phraseMatch) {
          sentences[i] =
            s.slice(0, phraseMatch.index) +
            `[${phraseMatch[0]}](${targetUrl})` +
            s.slice(phraseMatch.index + phraseMatch[0].length);
          return { newPara: sentences.join(" "), injected: true };
        }
      }
    }
  }
  return { newPara: para, injected: false };
}

/** Anchor words pro target — usa palavras-chave do título. */
function anchorWordsFor(target: MensagemLite): string[] {
  const titulo = target.titulo.toLowerCase();
  // Pega substantivos chave (4+ chars, não stopwords)
  const stopwords = new Set(["para","mais","como","muito","minha","minha","mensagem","você","feliz","aniversario","aniversário","cheio","cheia","todo","toda","desejo","muito","melhor","linda","lindo","amada","amado"]);
  const words = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stopwords.has(w));
  return words.slice(0, 3);
}

// =====================================================
// MAIN
// =====================================================

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`\n🔗 Injetando internal links | minWords=${args.minWords} | maxLinks=${args.maxLinks} | dryRun=${args.dryRun}\n`);

  // Pool de candidatos: todas mensagens PUBLISHED (pra mapping global)
  const pool = await prisma.mensagem.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true, slug: true, titulo: true, conteudo: true,
      autorId: true, clusterId: true, complementoId: true,
      likes: true, copies: true,
      cluster: { select: { slug: true, nicho: { select: { slug: true } } } },
    },
  });
  console.log(`Pool: ${pool.length} mensagens publicadas`);

  // Alvos: mensagens long-form sem muitos links já
  const targets = pool.filter((m) => {
    const wc = m.conteudo.trim().split(/\s+/).length;
    const linkCount = (m.conteudo.match(/\]\(\//g) || []).length;
    return wc >= args.minWords && linkCount < args.maxLinks;
  });
  console.log(`Alvos long-form: ${targets.length}`);

  let processed = 0;
  let injected = 0;
  let skipped = 0;

  const limit = args.limit ?? targets.length;
  for (let i = 0; i < Math.min(limit, targets.length); i++) {
    const target = targets[i];
    const candidates = pickCandidates(target, pool, args.maxLinks);
    if (candidates.length === 0) {
      skipped++;
      continue;
    }

    const paragraphs = splitParagraphs(target.conteudo);
    // Skip primeiro e último parágrafo (estética)
    const eligibleParas = paragraphs.slice(1, -1).filter((p) => p.para.length > 80);
    if (eligibleParas.length === 0) {
      skipped++;
      continue;
    }

    let conteudoFinal = target.conteudo;
    let linksAdded = 0;
    const usedParaIdxs = new Set<number>();

    for (const cand of candidates) {
      if (linksAdded >= args.maxLinks) break;
      const candUrl = `/${cand.cluster.nicho.slug}/${cand.cluster.slug}/${cand.slug}/`;
      const anchors = anchorWordsFor(cand);
      if (anchors.length === 0) continue;

      for (const ep of eligibleParas) {
        if (usedParaIdxs.has(ep.idx)) continue;
        const { newPara, injected: ok } = injectLinkInPara(ep.para, anchors, candUrl);
        if (ok) {
          // Substitui no conteudoFinal (1 só ocorrência do trecho original)
          conteudoFinal = conteudoFinal.replace(ep.para, newPara);
          usedParaIdxs.add(ep.idx);
          linksAdded++;
          break;
        }
      }
    }

    if (linksAdded === 0) {
      skipped++;
      continue;
    }

    if (args.dryRun) {
      console.log(`  [dry ${i + 1}] ${target.slug} — ${linksAdded} link(s)`);
    } else {
      await prisma.mensagem.update({
        where: { id: target.id },
        data: { conteudo: conteudoFinal },
      });
    }
    injected++;
    processed++;
    if (processed % 50 === 0) {
      console.log(`  [progress] ${processed}/${limit} | injected=${injected} skipped=${skipped}`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Internal links: ${injected} mensagens enriquecidas · ${skipped} skipped`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
