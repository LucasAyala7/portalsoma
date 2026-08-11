/**
 * Cross-links semânticos entre clusters — vai além de "siblings do mesmo tipo".
 *
 * Regras:
 * 1. IDADES (`de-N-anos`): sugere ±5 anos e ±10 anos vizinhas (idade próxima é intent parecida).
 * 2. RELACIONAMENTO tempo (`de-N-anos-de-namoro`, `de-N-anos-de-amizade`): idem por duração.
 * 3. BODAS (`bodas-*`): outras 3 bodas populares.
 * 4. DESTINATARIO família próxima: mãe↔pai↔avó, filha↔filho, marido↔esposa, tia↔tio, sobrinho↔sobrinha.
 * 5. TOM: evangelica↔bíblica↔católica↔crista; engraçada↔curta↔bonita↔simples.
 * 6. CANAL: status↔whatsapp.
 *
 * Retorna array de slugs de cluster (max 6). Ordenados por afinidade decrescente.
 */

const RELATED_MAP: Record<string, string[]> = {
  // Família — casais
  "para-mae": ["para-pai", "para-avo", "para-sogra", "para-madrinha", "para-tia"],
  "para-pai": ["para-mae", "para-avo", "para-sogro", "para-padrinho", "para-tio"],
  "para-marido": ["para-esposa", "para-namorado", "de-10-anos-de-namoro", "de-5-anos-de-namoro", "romantica"],
  "para-esposa": ["para-marido", "para-namorada", "de-10-anos-de-namoro", "de-5-anos-de-namoro", "romantica"],
  "para-namorado": ["para-namorada", "para-marido", "de-1-ano-de-namoro", "de-2-anos-de-namoro", "romantica"],
  "para-namorada": ["para-namorado", "para-esposa", "de-1-ano-de-namoro", "de-2-anos-de-namoro", "romantica"],

  // Família — irmãos/filhos
  "para-filho": ["para-filha", "para-neto", "para-afilhado", "para-sobrinho", "para-genro"],
  "para-filha": ["para-filho", "para-neta", "para-afilhada", "para-sobrinha", "para-nora"],
  "para-irma": ["para-irmao", "para-prima", "para-amiga", "para-cunhada"],
  "para-irmao": ["para-irma", "para-primo", "para-amigo", "para-cunhado"],
  "para-sobrinho": ["para-sobrinha", "para-afilhado", "para-neto", "para-filho"],
  "para-sobrinha": ["para-sobrinho", "para-afilhada", "para-neta", "para-filha"],
  "para-neto": ["para-neta", "para-sobrinho", "para-filho", "para-afilhado"],
  "para-neta": ["para-neto", "para-sobrinha", "para-filha", "para-afilhada"],
  "para-tia": ["para-tio", "para-madrinha", "para-mae", "para-sogra"],
  "para-tio": ["para-tia", "para-padrinho", "para-pai", "para-sogro"],
  "para-avo": ["para-mae", "para-pai", "para-idoso", "de-80-anos", "de-70-anos"],
  "para-padrinho": ["para-madrinha", "para-afilhado", "para-tio", "para-padre"],
  "para-madrinha": ["para-padrinho", "para-afilhada", "para-tia", "para-mae"],
  "para-afilhado": ["para-afilhada", "para-padrinho", "para-sobrinho", "para-filho"],
  "para-afilhada": ["para-afilhado", "para-madrinha", "para-sobrinha", "para-filha"],

  // Amigos
  "para-amiga": ["para-amigo", "para-irma", "para-prima", "de-10-anos-de-amizade", "de-20-anos-de-amizade"],
  "para-amigo": ["para-amiga", "para-irmao", "para-primo", "de-10-anos-de-amizade", "de-20-anos-de-amizade"],
  "para-colega": ["para-chefe", "para-cliente", "para-amiga", "para-amigo"],
  "para-chefe": ["para-colega", "para-cliente", "formal"],
  "para-cliente": ["para-chefe", "para-colega", "formal"],
  "para-idoso": ["para-avo", "de-80-anos", "de-90-anos", "de-100-anos", "de-70-anos"],

  // Religião / sogros / genro/nora
  "para-pastor": ["para-padre", "para-pastora", "evangelica", "biblica"],
  "para-pastora": ["para-pastor", "para-padre", "evangelica", "biblica"],
  "para-padre": ["para-pastor", "catolica", "biblica"],
  "para-sogra": ["para-sogro", "para-mae", "para-madrinha"],
  "para-sogro": ["para-sogra", "para-pai", "para-padrinho"],
  "para-nora": ["para-genro", "para-filha", "para-cunhada"],
  "para-genro": ["para-nora", "para-filho", "para-cunhado"],
  "para-cunhada": ["para-cunhado", "para-irma", "para-nora"],
  "para-cunhado": ["para-cunhada", "para-irmao", "para-genro"],
  "para-comadre": ["para-madrinha", "para-amiga", "para-tia"],

  // TOM
  "evangelica": ["biblica", "catolica", "crista", "gospel"],
  "biblica": ["evangelica", "catolica", "abencoada", "crista"],
  "catolica": ["biblica", "evangelica", "crista"],
  "crista": ["evangelica", "biblica", "catolica"],
  "gospel": ["evangelica", "biblica"],
  "abencoada": ["biblica", "evangelica"],
  "espirita": ["biblica", "abencoada", "reflexiva"],
  "romantica": ["bonita", "para-marido", "para-esposa", "para-namorado", "para-namorada"],
  "engracada": ["curta", "simples", "para-status"],
  "curta": ["engracada", "simples", "para-status", "no-whatsapp"],
  "simples": ["curta", "bonita"],
  "bonita": ["romantica", "reflexiva", "simples"],
  "reflexiva": ["bonita", "bíblica", "abencoada"],
  "coragem": ["reflexiva", "abencoada", "biblica"],

  // CANAL
  "para-status": ["no-whatsapp", "curta", "engracada"],
  "no-whatsapp": ["para-status", "curta"],
};

/** Idades: pega ±5, ±10 e outras próximas. */
function getAgeRelated(slug: string): string[] {
  const m = slug.match(/^de-(\d+)-anos$/);
  if (!m) return [];
  const age = parseInt(m[1]!, 10);
  const neighbors = [age - 5, age + 5, age - 10, age + 10, age - 15, age + 15];
  return neighbors.filter((a) => a >= 1 && a <= 100).map((a) => `de-${a}-anos`);
}

function getNamoroAmizadeRelated(slug: string): string[] {
  const mnamoro = slug.match(/^de-(\d+)-anos?-de-(namoro|amizade|relacionamento)$/);
  if (mnamoro) {
    const yrs = parseInt(mnamoro[1]!, 10);
    const kind = mnamoro[2]!;
    const singular = yrs === 1 ? "ano" : "anos";
    return [yrs - 1, yrs + 1, yrs - 2, yrs + 2, yrs + 5]
      .filter((y) => y >= 1)
      .map((y) => `de-${y}-${y === 1 ? "ano" : "anos"}-de-${kind}`);
  }
  return [];
}

function getBodasRelated(slug: string): string[] {
  if (!slug.startsWith("bodas-")) return [];
  // Cross-link com bodas populares
  return [
    "bodas-de-prata-25-anos",
    "bodas-de-ouro-50-anos",
    "bodas-de-cristal-15-anos",
    "bodas-de-estanho-10-anos",
    "bodas-de-pinho-32-anos",
  ].filter((s) => s !== slug);
}

/** Retorna até 6 slugs de clusters relacionados (order = afinidade DESC). */
export function relatedClusterSlugs(slug: string): string[] {
  const map = RELATED_MAP[slug] ?? [];
  const age = getAgeRelated(slug);
  const namoro = getNamoroAmizadeRelated(slug);
  const bodas = getBodasRelated(slug);
  const all = [...map, ...age, ...namoro, ...bodas];
  return [...new Set(all)].slice(0, 6);
}
