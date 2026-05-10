/**
 * Quality gate v2 — valida titulo/metaTitle/metaDescription/conteudo separadamente.
 *
 * Critérios:
 *   - SEO char limits: metaTitle 54-60, metaDescription 124-140, titulo ≤90
 *   - Banned phrases (clichês do site WP atual)
 *   - Length compliance por TIPO (CURTA/MEDIA/LONGA/POEMA)
 *   - Similaridade com mensagens recentes do mesmo cluster
 *   - POEMA: exige quebras de linha (formato versificado)
 *   - Emojis: máximo 1 (era 2 — apertou)
 *   - Hashtags: zero
 *   - Placeholder não substituído (ex: [NOME])
 *   - Sem markdown leak (#, ```)
 *
 * Score 0-1. ≥0.75 PASS, ≥0.4 REVIEW, < 0.4 FAIL.
 *
 * NOTA: uniqueness DB-wide (hash de titulo/metaTitle) é validada no call site
 * via Prisma — quality-gate fica puro (sem I/O).
 */

import type { TipoMensagem } from "./prompts";

const BANNED_OPENINGS = [
  /^hoje\s+celebro/i,
  /^neste\s+dia\s+(t[ãa]o\s+)?especial/i,
  /^mais\s+um\s+ano\s+de\s+vida/i,
  /^feliz\s+anivers[áa]rio,?\s+querid[oa]/i,
  /^que\s+neste\s+dia/i,
  /^em\s+mais\s+(este|um)\s+dia/i,
  /^parab[ée]ns,?\s+querid[oa]/i,
  /^parab[ée]ns,?\s+pelo\s+seu\s+(dia|anivers)/i,
];

const BANNED_CLOSINGS = [
  /que\s+deus\s+te\s+aben[çc]oe[\s.,!]*$/i,
  /que\s+deus\s+aben[çc][oõ]e\s+sua\s+vida[\s.,!]*$/i,
  /felicidades\s+sempre[\s.,!]*$/i,
  /te\s+amo\s+muito\s+muito[\s.,!]*$/i,
];

const BANNED_PHRASES = [
  /\bfeliz\s+anivers[áa]rio,?\s+meu\s+amor\b.{0,40}\bque\s+deus\b/i,
];

const PLACEHOLDER_RE = /\[(nome|idade|destinatario|nome_pessoa|idade_pessoa|nome_do_aniversariante)\]/i;
const HASHTAG_RE = /#\w+/g;
const EMOJI_RE = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F000}-\u{1FAFF}]/gu;
const MARKDOWN_LEAK_RE = /(^|\n)#{1,6}\s|```|^\*\*[^*]+\*\*$/m;

export type { TipoMensagem };

export interface QualityIssue {
  tipo:
    | "banned_opening"
    | "banned_closing"
    | "banned_phrase"
    | "length_conteudo"
    | "length_titulo"
    | "length_metatitle"
    | "length_metadescription"
    | "similarity"
    | "placeholder"
    | "hashtag"
    | "emoji_excess"
    | "markdown_leak"
    | "poema_format"
    | "keyword_missing"
    | "keyword_stuffing";
  detalhe: string;
  peso: number;
}

export interface QualityResult {
  score: number;
  status: "PASS" | "REVIEW" | "FAIL";
  issues: QualityIssue[];
}

export interface CheckInput {
  titulo: string;
  metaTitle: string;
  metaDescription: string;
  conteudo: string;
  tipo: TipoMensagem;
  /** keyword principal do cluster — checa presença natural sem stuffing */
  headKeyword?: string;
  /** mensagens recentes do mesmo cluster (paráfrase check) */
  similares?: string[];
  /** 0-1, default 0.55 */
  similaridadeMax?: number;
}

const PALAVRAS_POR_TIPO: Record<TipoMensagem, { min: number; max: number; tolMax: number }> = {
  CURTA: { min: 50, max: 100, tolMax: 25 },
  MEDIA: { min: 90, max: 170, tolMax: 30 },
  LONGA: { min: 170, max: 300, tolMax: 50 },
  POEMA: { min: 50, max: 200, tolMax: 30 },
};

const TITULO_MAX = 90;
// SEO ranges — Lucas: "title entre 54-60, LIMITE SEMPRE 60". Hard max 60, soft min 50.
// metaDescription: "entre 124-140, LIMITE SEMPRE 140". Hard max 140, soft min 115.
const METATITLE_IDEAL_MIN = 54;
const METATITLE_SOFT_MIN = 50;
const METATITLE_MAX = 60;
const METADESC_IDEAL_MIN = 124;
const METADESC_SOFT_MIN = 115;
const METADESC_MAX = 140;

export function checkQuality(input: CheckInput): QualityResult {
  const issues: QualityIssue[] = [];
  const conteudo = input.conteudo.trim();
  const titulo = input.titulo.trim();
  const metaTitle = input.metaTitle.trim();
  const metaDesc = input.metaDescription.trim();

  // 1. Char limits SEO
  if (titulo.length > TITULO_MAX) {
    issues.push({
      tipo: "length_titulo",
      detalhe: `Título com ${titulo.length} chars (max ${TITULO_MAX})`,
      peso: 0.25,
    });
  }
  if (titulo.length < 20) {
    issues.push({
      tipo: "length_titulo",
      detalhe: `Título com ${titulo.length} chars (min 20)`,
      peso: 0.2,
    });
  }

  // metaTitle: HARD max 60 (Lucas req), SOFT min 50 (ideal 54-60, mas 50-53 aceito como REVIEW)
  if (metaTitle.length > METATITLE_MAX) {
    issues.push({
      tipo: "length_metatitle",
      detalhe: `metaTitle com ${metaTitle.length} chars (LIMITE 60, está longo)`,
      peso: 0.5,
    });
  } else if (metaTitle.length < METATITLE_SOFT_MIN) {
    issues.push({
      tipo: "length_metatitle",
      detalhe: `metaTitle com ${metaTitle.length} chars (mínimo 50, ideal 54-60)`,
      peso: 0.4,
    });
  } else if (metaTitle.length < METATITLE_IDEAL_MIN) {
    issues.push({
      tipo: "length_metatitle",
      detalhe: `metaTitle com ${metaTitle.length} chars (ideal ≥54, aceito ≥50)`,
      peso: 0.1,
    });
  }

  // metaDescription: HARD max 140 (Lucas req), SOFT min 115 (ideal 124-140)
  if (metaDesc.length > METADESC_MAX) {
    issues.push({
      tipo: "length_metadescription",
      detalhe: `metaDescription com ${metaDesc.length} chars (LIMITE 140, está longo)`,
      peso: 0.5,
    });
  } else if (metaDesc.length < METADESC_SOFT_MIN) {
    issues.push({
      tipo: "length_metadescription",
      detalhe: `metaDescription com ${metaDesc.length} chars (mínimo 115, ideal 124-140)`,
      peso: 0.4,
    });
  } else if (metaDesc.length < METADESC_IDEAL_MIN) {
    issues.push({
      tipo: "length_metadescription",
      detalhe: `metaDescription com ${metaDesc.length} chars (ideal ≥124, aceito ≥115)`,
      peso: 0.1,
    });
  }

  // 2. Banned openings (no conteudo, primeiros 80 chars)
  const head = conteudo.slice(0, 80);
  for (const re of BANNED_OPENINGS) {
    if (re.test(head)) {
      issues.push({
        tipo: "banned_opening",
        detalhe: `Abertura clichê: ${re.source}`,
        peso: 0.4,
      });
      break;
    }
  }

  // 3. Banned closings
  const tail = conteudo.slice(-80);
  for (const re of BANNED_CLOSINGS) {
    if (re.test(tail)) {
      issues.push({
        tipo: "banned_closing",
        detalhe: `Fechamento clichê: ${re.source}`,
        peso: 0.3,
      });
      break;
    }
  }

  // 4. Banned phrases compostas
  for (const re of BANNED_PHRASES) {
    if (re.test(conteudo)) {
      issues.push({ tipo: "banned_phrase", detalhe: re.source, peso: 0.25 });
    }
  }

  // 5. Placeholder não substituído (em qualquer campo)
  const allText = `${titulo}\n${metaTitle}\n${metaDesc}\n${conteudo}`;
  if (PLACEHOLDER_RE.test(allText)) {
    issues.push({
      tipo: "placeholder",
      detalhe: "Placeholder [...] não substituído",
      peso: 0.5,
    });
  }

  // 6. Hashtags
  const hashtags = conteudo.match(HASHTAG_RE);
  if (hashtags && hashtags.length > 0) {
    issues.push({
      tipo: "hashtag",
      detalhe: `${hashtags.length} hashtag(s)`,
      peso: 0.2,
    });
  }

  // 7. Emojis em excesso (máx 1)
  const emojis = conteudo.match(EMOJI_RE);
  if (emojis && emojis.length > 1) {
    issues.push({
      tipo: "emoji_excess",
      detalhe: `${emojis.length} emojis`,
      peso: 0.2,
    });
  }

  // 8. Markdown leak no conteudo (não devia ter ## headings nem ```)
  if (MARKDOWN_LEAK_RE.test(conteudo)) {
    issues.push({
      tipo: "markdown_leak",
      detalhe: "Resíduo de markdown (## ou ```)",
      peso: 0.2,
    });
  }

  // 9. Length compliance por TIPO
  const palavras = conteudo.split(/\s+/).filter(Boolean).length;
  const limite = PALAVRAS_POR_TIPO[input.tipo];
  if (palavras < limite.min) {
    issues.push({
      tipo: "length_conteudo",
      detalhe: `Curto demais (${palavras} palavras < ${limite.min} pra ${input.tipo})`,
      peso: 0.3,
    });
  } else if (palavras > limite.max + limite.tolMax) {
    issues.push({
      tipo: "length_conteudo",
      detalhe: `Longo demais (${palavras} palavras > ${limite.max + limite.tolMax} pra ${input.tipo})`,
      peso: 0.2,
    });
  }

  // 10. POEMA: exige formato versificado (≥3 quebras de linha)
  if (input.tipo === "POEMA") {
    const quebras = (conteudo.match(/\n/g) || []).length;
    if (quebras < 3) {
      issues.push({
        tipo: "poema_format",
        detalhe: `POEMA precisa de versos quebrados (${quebras} quebras < 3)`,
        peso: 0.4,
      });
    }
    // poema com parágrafos longos demais (>120 chars sem quebra) sugere prosa disfarçada
    const linhasLongas = conteudo.split("\n").filter((l) => l.trim().length > 120).length;
    if (linhasLongas > 1) {
      issues.push({
        tipo: "poema_format",
        detalhe: `POEMA com ${linhasLongas} linhas muito longas (>120 chars) — soa em prosa`,
        peso: 0.2,
      });
    }
  }

  // 11. Keyword check (presença + sem stuffing) — só se headKeyword fornecido
  if (input.headKeyword) {
    const kwNorm = normalize(input.headKeyword);
    const kwTokens = kwNorm.split(/\s+/).filter((t) => t.length > 2);
    const allNorm = normalize(`${titulo} ${metaTitle} ${metaDesc} ${conteudo}`);

    const presente = kwTokens.every((tok) => allNorm.includes(tok));
    if (!presente) {
      issues.push({
        tipo: "keyword_missing",
        detalhe: `Keyword "${input.headKeyword}" ausente em todos os campos`,
        peso: 0.25,
      });
    }

    // Stuffing: keyword exata 4+ vezes no conteudo
    const conteudoNorm = normalize(conteudo);
    const occurrences = countOccurrences(conteudoNorm, kwNorm);
    if (occurrences >= 4) {
      issues.push({
        tipo: "keyword_stuffing",
        detalhe: `Keyword "${input.headKeyword}" repetida ${occurrences}x (stuffing)`,
        peso: 0.25,
      });
    }
  }

  // 12. Similaridade com mensagens existentes do cluster
  if (input.similares && input.similares.length > 0) {
    const maxSim = input.similaridadeMax ?? 0.55;
    for (const sim of input.similares) {
      const score = jaccardSimilarity(conteudo, sim);
      if (score > maxSim) {
        issues.push({
          tipo: "similarity",
          detalhe: `Similaridade ${(score * 100).toFixed(0)}% com mensagem existente`,
          peso: Math.min(0.6, score),
        });
        break;
      }
    }
  }

  const totalPeso = issues.reduce((acc, i) => acc + i.peso, 0);
  const score = Math.max(0, 1 - totalPeso);

  let status: QualityResult["status"];
  if (score >= 0.75) status = "PASS";
  else if (score >= 0.4) status = "REVIEW";
  else status = "FAIL";

  return { score, status, issues };
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count++;
    pos += needle.length;
  }
  return count;
}

function jaccardSimilarity(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const bigramsA = new Set<string>();
  for (let i = 0; i < tokensA.length - 1; i++) bigramsA.add(`${tokensA[i]} ${tokensA[i + 1]}`);
  const bigramsB = new Set<string>();
  for (let i = 0; i < tokensB.length - 1; i++) bigramsB.add(`${tokensB[i]} ${tokensB[i + 1]}`);

  let intersect = 0;
  for (const bg of bigramsA) if (bigramsB.has(bg)) intersect++;
  const union = bigramsA.size + bigramsB.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}
