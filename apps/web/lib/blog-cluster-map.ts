/**
 * Mapeia artigos do blog para os clusters de mensagens relacionados.
 *
 * Objetivo: o blog deixa de ser ilha. Cada artigo passa autoridade para as
 * money pages e da ao leitor o proximo passo natural (ler sobre a data,
 * depois pegar a mensagem pronta).
 *
 * Resolucao em 3 camadas, da mais especifica para a mais generica:
 *  1. Mapa explicito por slug do post
 *  2. Heuristica por palavras no slug/titulo (bodas, idade, destinatario)
 *  3. Fallback por categoria do blog
 */

/** Mapa explicito: slug do post -> slugs de cluster. */
const POR_POST: Record<string, string[]> = {
  // Pautas GSC de bodas
  "tabela-de-bodas-completa-de-1-a-100-anos": [
    "bodas-de-papel-1-ano",
    "bodas-de-estanho-10-anos",
    "bodas-de-cristal-15-anos",
    "bodas-de-prata-25-anos",
    "bodas-de-ouro-50-anos",
    "bodas-de-perola-30-anos",
  ],
  "32-anos-de-casados-bodas-de-pinho": [
    "bodas-de-pinho-32-anos",
    "bodas-de-perola-30-anos",
    "bodas-de-esmeralda-35-anos",
    "para-marido",
    "para-esposa",
  ],
  "4-anos-de-namoro-bodas-de-flores": [
    "de-4-anos-de-namoro",
    "bodas-de-flores-4-anos",
    "de-3-anos-de-namoro",
    "de-5-anos-de-namoro",
  ],
  "10-anos-de-namoro-bodas-e-como-comemorar": [
    "de-10-anos-de-namoro",
    "bodas-de-estanho-10-anos",
    "para-namorado",
    "para-namorada",
  ],
  "bodas-de-flores-4-anos-significado-e-comemoracao": [
    "bodas-de-flores-4-anos",
    "de-4-anos-de-namoro",
    "bodas-de-madeira-5-anos",
  ],
  "bodas-de-pinho-32-anos-significado": [
    "bodas-de-pinho-32-anos",
    "bodas-de-perola-30-anos",
    "bodas-de-esmeralda-35-anos",
  ],
  "10-anos-de-casamento-bodas-de-estanho": [
    "bodas-de-estanho-10-anos",
    "de-10-anos-de-namoro",
    "bodas-de-cristal-15-anos",
    "para-marido",
    "para-esposa",
  ],
  "bodas-de-cristal-15-anos-de-casamento": [
    "bodas-de-cristal-15-anos",
    "bodas-de-estanho-10-anos",
    "bodas-de-prata-25-anos",
  ],
  "dia-da-nora-quando-e-e-o-que-dizer": ["para-nora", "para-sogra", "para-genro"],
  "45-anos-o-que-muda-nessa-idade": ["de-45-anos", "de-40-anos", "de-50-anos"],
  "bodas-de-prata-25-anos-como-celebrar": [
    "bodas-de-prata-25-anos",
    "bodas-de-perola-30-anos",
    "bodas-de-ouro-50-anos",
    "de-25-anos",
  ],
  "bodas-de-ouro-50-anos-de-casamento": [
    "bodas-de-ouro-50-anos",
    "bodas-de-prata-25-anos",
    "para-avo",
    "de-50-anos",
  ],

  // Posts editoriais antigos
  "como-parabenizar-no-whatsapp-sem-soar-generico": ["no-whatsapp", "para-status", "curta"],
  "dar-os-parabens-ao-chefe-o-que-funciona-e-o-que-constrange": [
    "para-chefe",
    "para-colega",
    "para-lider",
  ],
  "mensagem-de-aniversario-para-ex-vale-a-pena-quando": ["para-namorada", "para-namorado", "curta"],
  "esqueci-o-aniversario-de-alguem-e-agora": ["curta", "no-whatsapp", "para-amiga"],
  "como-escolher-presente-pra-mae-que-diz-nao-quero-nada": ["para-mae", "para-sogra", "para-avo"],
  "presentes-para-amigos-de-longa-data-a-regra-dos-3-anos": [
    "para-amiga",
    "para-amigo",
    "de-10-anos-de-amizade",
  ],
  "presentes-para-criancas-idade-fase-e-intencao-emocional": [
    "para-filho",
    "para-filha",
    "para-sobrinho",
    "para-sobrinha",
  ],
  "presentes-corporativos-acertar-sem-invadir-o-pessoal": ["para-chefe", "para-colega", "para-cliente"],
  "amizades-que-sobrevivem-ao-tempo-o-teste-anual": [
    "para-amiga",
    "para-amigo",
    "de-10-anos-de-amizade",
    "de-5-anos-de-amizade",
  ],
  "aniversario-e-infancia-como-tratamos-os-pequenos-define-o-adulto": [
    "para-filho",
    "para-filha",
    "de-1-ano",
    "de-10-meses",
  ],
  "aniversario-no-casamento-o-segundo-desafio-das-datas": [
    "para-marido",
    "para-esposa",
    "bodas-de-estanho-10-anos",
  ],
  "aniversarios-de-quem-perdeu-alguem-como-honrar-a-data": ["para-mae", "para-pai", "para-avo"],
  "reconciliacao-no-aniversario-a-oportunidade-que-poucos-usam": [
    "para-irma",
    "para-irmao",
    "para-amiga",
  ],
  "aniversarios-redondos-o-peso-simbolico-dos-30-40-50": ["de-30-anos", "de-40-anos", "de-50-anos"],
  "aniversario-e-espiritualidade-celebrar-a-vida-em-diferentes-tradicoes": [
    "evangelica",
    "biblica",
    "catolica",
    "espirita",
  ],
  "por-que-muita-gente-passou-a-odiar-aniversario-e-como-mudar-isso": [
    "engracada",
    "curta",
    "reflexiva",
  ],
};

/** Fallback por categoria do blog. */
const POR_CATEGORIA: Record<string, string[]> = {
  "significado-da-data": ["de-30-anos", "de-50-anos", "bodas-de-prata-25-anos", "de-15-anos"],
  "etiqueta-do-aniversario": ["no-whatsapp", "para-chefe", "curta", "para-colega"],
  "presentes-e-mimos": ["para-mae", "para-amiga", "para-marido", "para-esposa"],
  "celebracao-e-festa": ["de-15-anos", "de-50-anos", "bodas-de-prata-25-anos", "para-amiga"],
  "relacoes-e-afeto": ["para-amiga", "para-mae", "para-irma", "para-marido"],
};

/** Heuristica: extrai clusters do slug/titulo quando nao ha mapa explicito. */
function porHeuristica(slug: string): string[] {
  const out: string[] = [];

  // Bodas: "bodas-de-X-N-anos" ou "N-anos-de-casamento"
  const bodasNome = slug.match(/bodas-de-([a-z]+)/);
  if (bodasNome) out.push(`bodas-de-${bodasNome[1]}`);

  // Idade: "N-anos"
  const idade = slug.match(/(\d+)-anos/);
  if (idade) {
    const n = Number(idade[1]);
    out.push(`de-${n}-anos`);
    if (n >= 5) out.push(`de-${n - 5}-anos`);
    out.push(`de-${n + 5}-anos`);
  }

  // Destinatario mencionado no slug
  const destinatarios = [
    "mae", "pai", "filha", "filho", "amiga", "amigo", "irma", "irmao",
    "marido", "esposa", "namorado", "namorada", "avo", "neta", "neto",
    "sobrinho", "sobrinha", "chefe", "colega", "nora", "genro", "sogra", "sogro",
    "enteada", "afilhada", "afilhado", "padrinho", "madrinha", "idoso",
  ];
  for (const d of destinatarios) {
    if (slug.includes(d)) out.push(`para-${d}`);
  }

  return out;
}

/**
 * Retorna ate `max` slugs de cluster relacionados ao post.
 * Ordem: mapa explicito > heuristica > fallback por categoria.
 */
export function clustersParaPost(
  postSlug: string,
  categoriaSlug: string,
  max = 6,
): string[] {
  const explicito = POR_POST[postSlug] ?? [];
  const heur = explicito.length >= 3 ? [] : porHeuristica(postSlug);
  const fallback =
    explicito.length + heur.length >= 3 ? [] : (POR_CATEGORIA[categoriaSlug] ?? []);

  return [...new Set([...explicito, ...heur, ...fallback])].slice(0, max);
}

/**
 * Caminho inverso: dado um cluster, quais posts do blog fazem sentido.
 * Usado no rodape das paginas de categoria.
 */
export function postsParaCluster(clusterSlug: string, max = 3): string[] {
  const hits: string[] = [];
  for (const [postSlug, clusters] of Object.entries(POR_POST)) {
    if (clusters.includes(clusterSlug)) hits.push(postSlug);
    if (hits.length >= max) break;
  }
  return hits;
}
