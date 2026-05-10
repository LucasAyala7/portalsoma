/**
 * Taxonomia inicial baseada no SERP scrap (docs/01-analise-serp.md).
 * Estrutura: 1 Nicho → N Clusters → N Complementos.
 *
 * Convenção:
 *   - Cluster head ≥ 1k vol: permiteEmpilhar = true (libera complementos)
 *   - Complemento ≥ 100 vol: vira página própria
 */

export interface ClusterSeed {
  slug: string;
  nome: string;
  prefixoSlug: string;
  tipo: "DESTINATARIO" | "TOM" | "OCASIAO" | "CANAL" | "FALECIDO";
  headKeyword: string;
  volumeMensal: number;
  descricao?: string;
  complementos?: ComplementoSeed[];
}

export interface ComplementoSeed {
  slug: string;
  nome: string;
  headKeyword: string;
  volumeMensal: number;
  descricao?: string;
}

export const NICHO_SEED = {
  slug: "mensagem-de-aniversario",
  nome: "Mensagem de Aniversário",
  headTerm: "mensagem de aniversário",
  volumeMensal: 1_220_000,
  descricao:
    "Mensagens de aniversário emocionantes, evangélicas, engraçadas e únicas para todas as pessoas que você ama.",
  metaTitle: "Mensagens de Aniversário Para Compartilhar — Portal Soma",
  metaDesc:
    "Milhares de mensagens de aniversário originais para mãe, pai, amiga, filha, irmã e mais. Copie em 1 clique e compartilhe no WhatsApp.",
};

export const CLUSTERS_SEED: ClusterSeed[] = [
  // ============ DESTINATÁRIOS — AMIGOS (top volume) ============
  {
    slug: "para-amiga",
    nome: "Para Amiga",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para amiga",
    volumeMensal: 301_000,
    descricao: "Mensagens emocionantes para celebrar uma amiga especial.",
    complementos: [
      { slug: "especial", nome: "Especial", headKeyword: "mensagem de aniversário para amiga especial", volumeMensal: 49_500 },
      { slug: "querida", nome: "Querida", headKeyword: "mensagem de aniversário para amiga querida", volumeMensal: 8_100 },
      { slug: "evangelica", nome: "Evangélica", headKeyword: "mensagem evangélica de aniversário para amiga", volumeMensal: 5_400 },
      { slug: "que-mora-longe", nome: "Que Mora Longe", headKeyword: "mensagem de aniversário para amiga que mora longe", volumeMensal: 590 },
      { slug: "distante", nome: "Distante", headKeyword: "mensagem de aniversário para amiga distante", volumeMensal: 4_400 },
      { slug: "melhor-amiga", nome: "Melhor Amiga", headKeyword: "mensagem de aniversário para melhor amiga", volumeMensal: 9_900 },
    ],
  },
  {
    slug: "para-amigo",
    nome: "Para Amigo",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para amigo",
    volumeMensal: 301_000,
    complementos: [
      { slug: "especial", nome: "Especial", headKeyword: "mensagem de aniversário para amigo especial", volumeMensal: 49_500 },
      { slug: "querido", nome: "Querido", headKeyword: "mensagem de aniversário para amigo querido", volumeMensal: 720 },
    ],
  },

  // ============ DESTINATÁRIOS — FAMÍLIA ============
  {
    slug: "para-irma",
    nome: "Para Irmã",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para irmã",
    volumeMensal: 110_000,
    complementos: [
      { slug: "querida", nome: "Querida", headKeyword: "mensagem de aniversário para irmã querida", volumeMensal: 5_400 },
      { slug: "mais-velha", nome: "Mais Velha", headKeyword: "mensagem de aniversário para irmã mais velha", volumeMensal: 4_400 },
      { slug: "distante", nome: "Distante", headKeyword: "mensagem de aniversário para irmã distante", volumeMensal: 4_400 },
    ],
  },
  {
    slug: "para-filha",
    nome: "Para Filha",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para filha",
    volumeMensal: 90_500,
    complementos: [
      { slug: "amada", nome: "Amada", headKeyword: "mensagem de aniversário para filha amada", volumeMensal: 12_100 },
      { slug: "querida", nome: "Querida", headKeyword: "mensagem de aniversário para filha querida", volumeMensal: 480 },
      { slug: "15-anos", nome: "15 anos", headKeyword: "mensagem de aniversário para filha 15 anos", volumeMensal: 720 },
      { slug: "18-anos", nome: "18 anos", headKeyword: "mensagem de aniversário para filha 18 anos", volumeMensal: 110 },
      { slug: "que-cresceu", nome: "Que Cresceu", headKeyword: "mensagem de aniversário para filha que cresceu", volumeMensal: 880 },
    ],
  },
  {
    slug: "para-sobrinha",
    nome: "Para Sobrinha",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para sobrinha",
    volumeMensal: 74_000,
    complementos: [
      { slug: "querida", nome: "Querida", headKeyword: "mensagem de aniversário para sobrinha querida", volumeMensal: 6_600 },
      { slug: "pequena", nome: "Pequena", headKeyword: "mensagem de aniversário para sobrinha pequena", volumeMensal: 720 },
      { slug: "distante", nome: "Distante", headKeyword: "mensagem de aniversário para sobrinha que mora longe", volumeMensal: 590 },
    ],
  },
  {
    slug: "para-sobrinho",
    nome: "Para Sobrinho",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para sobrinho",
    volumeMensal: 74_000,
    complementos: [
      { slug: "querido", nome: "Querido", headKeyword: "mensagem de aniversário para sobrinho querido", volumeMensal: 4_400 },
      { slug: "distante", nome: "Distante", headKeyword: "mensagem de aniversário para sobrinho que mora longe", volumeMensal: 590 },
    ],
  },
  {
    slug: "para-filho",
    nome: "Para Filho",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para filho",
    volumeMensal: 74_000,
    complementos: [
      { slug: "adulto", nome: "Adulto", headKeyword: "mensagem de aniversário para filho adulto", volumeMensal: 6_600 },
      { slug: "abencoado", nome: "Abençoado", headKeyword: "mensagem de aniversário para filho abençoado", volumeMensal: 14_800 },
    ],
  },
  {
    slug: "para-mae",
    nome: "Para Mãe",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para mãe",
    volumeMensal: 60_500,
    complementos: [
      { slug: "evangelica", nome: "Evangélica", headKeyword: "mensagem evangélica de aniversário para mãe", volumeMensal: 27_100 },
      { slug: "de-filha", nome: "De Filha", headKeyword: "mensagem de aniversário de filha para mãe", volumeMensal: 22_200 },
      { slug: "de-filho", nome: "De Filho", headKeyword: "mensagem de aniversário de filho para mãe", volumeMensal: 22_200 },
      { slug: "querida", nome: "Querida", headKeyword: "mensagem de aniversário para mãe querida", volumeMensal: 480 },
      { slug: "60-anos", nome: "60 anos", headKeyword: "mensagem de aniversário para mãe 60 anos", volumeMensal: 200 },
      { slug: "80-anos", nome: "80 anos", headKeyword: "mensagem de aniversário para mãe 80 anos", volumeMensal: 140 },
    ],
  },
  {
    slug: "para-marido",
    nome: "Para Marido",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para marido",
    volumeMensal: 60_500,
    complementos: [
      { slug: "romantica", nome: "Romântica", headKeyword: "mensagem romântica de aniversário para marido", volumeMensal: 8_100 },
      { slug: "evangelica", nome: "Evangélica", headKeyword: "mensagem evangélica de aniversário para marido", volumeMensal: 3_600 },
    ],
  },
  {
    slug: "para-irmao",
    nome: "Para Irmão",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para irmão",
    volumeMensal: 49_500,
    complementos: [
      { slug: "querido", nome: "Querido", headKeyword: "mensagem de aniversário para irmão querido", volumeMensal: 880 },
      { slug: "distante", nome: "Distante", headKeyword: "mensagem de aniversário para irmão distante", volumeMensal: 4_400 },
    ],
  },
  {
    slug: "para-esposa",
    nome: "Para Esposa",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para esposa",
    volumeMensal: 40_500,
  },
  {
    slug: "para-prima",
    nome: "Para Prima",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para prima",
    volumeMensal: 33_100,
    complementos: [
      { slug: "querida", nome: "Querida", headKeyword: "mensagem de aniversário para prima querida", volumeMensal: 2_900 },
    ],
  },
  {
    slug: "para-cunhada",
    nome: "Para Cunhada",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para cunhada",
    volumeMensal: 33_100,
    complementos: [
      { slug: "querida", nome: "Querida", headKeyword: "mensagem de aniversário para cunhada querida", volumeMensal: 720 },
    ],
  },
  {
    slug: "para-pai",
    nome: "Para Pai",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para pai",
    volumeMensal: 22_200,
    complementos: [
      { slug: "querido", nome: "Querido", headKeyword: "mensagem de aniversário para pai querido", volumeMensal: 100 },
    ],
  },
  {
    slug: "para-tia",
    nome: "Para Tia",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para tia",
    volumeMensal: 22_200,
    complementos: [
      { slug: "querida", nome: "Querida", headKeyword: "mensagem de aniversário para tia querida", volumeMensal: 1_600 },
    ],
  },
  {
    slug: "para-afilhada",
    nome: "Para Afilhada",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para afilhada",
    volumeMensal: 22_200,
    complementos: [
      { slug: "querida", nome: "Querida", headKeyword: "mensagem de aniversário para afilhada querida", volumeMensal: 210 },
      { slug: "pequena", nome: "Pequena", headKeyword: "mensagem de aniversário para afilhada pequena", volumeMensal: 480 },
    ],
  },
  {
    slug: "para-namorado",
    nome: "Para Namorado",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para namorado",
    volumeMensal: 18_100,
  },
  {
    slug: "para-pastor",
    nome: "Para Pastor",
    prefixoSlug: "para-",
    tipo: "DESTINATARIO",
    headKeyword: "mensagem de aniversário para pastor",
    volumeMensal: 12_100,
  },

  // ============ DESTINATÁRIOS — sem complementos ============
  { slug: "para-comadre", nome: "Para Comadre", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para comadre", volumeMensal: 12_100 },
  { slug: "para-genro", nome: "Para Genro", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para genro", volumeMensal: 8_100 },
  { slug: "para-tio", nome: "Para Tio", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para tio", volumeMensal: 8_100 },
  { slug: "para-padre", nome: "Para Padre", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para padre", volumeMensal: 4_400 },
  { slug: "para-chefe", nome: "Para Chefe", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para chefe", volumeMensal: 6_600 },
  { slug: "para-cliente", nome: "Para Cliente", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para cliente", volumeMensal: 3_600 },
  { slug: "para-colega", nome: "Para Colega", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para colega", volumeMensal: 8_100 },
  { slug: "para-avo", nome: "Para Avó/Avô", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para avó", volumeMensal: 9_900 },
  { slug: "para-neto", nome: "Para Neto", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para neto", volumeMensal: 2_900 },
  { slug: "para-neta", nome: "Para Neta", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para neta", volumeMensal: 6_600 },
  { slug: "para-padrinho", nome: "Para Padrinho", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para padrinho", volumeMensal: 2_400 },
  { slug: "para-madrinha", nome: "Para Madrinha", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para madrinha", volumeMensal: 9_900 },
  { slug: "para-sogro", nome: "Para Sogro", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para sogro", volumeMensal: 2_400 },
  { slug: "para-sogra", nome: "Para Sogra", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para sogra", volumeMensal: 14_800 },
  { slug: "para-nora", nome: "Para Nora", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para nora", volumeMensal: 14_800 },
  { slug: "para-cunhado", nome: "Para Cunhado", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para cunhado", volumeMensal: 12_100 },
  { slug: "para-afilhado", nome: "Para Afilhado", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para afilhado", volumeMensal: 8_100 },
  { slug: "para-namorada", nome: "Para Namorada", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para namorada", volumeMensal: 5_400 },
  { slug: "para-pastora", nome: "Para Pastora", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para pastora", volumeMensal: 14_800 },

  // ============ FALECIDOS (silo próprio, tom luto) ============
  { slug: "para-mae-falecida", nome: "Para Mãe Falecida", prefixoSlug: "para-", tipo: "FALECIDO", headKeyword: "mensagem de aniversário para mãe falecida", volumeMensal: 390 },
  { slug: "para-pai-falecido", nome: "Para Pai Falecido", prefixoSlug: "para-", tipo: "FALECIDO", headKeyword: "mensagem de aniversário para pai falecido", volumeMensal: 140 },
  { slug: "para-amigo-falecido", nome: "Para Amigo Falecido", prefixoSlug: "para-", tipo: "FALECIDO", headKeyword: "mensagem para amigo que faleceu", volumeMensal: 1_300 },
  { slug: "para-quem-ja-faleceu", nome: "Para Quem Já Faleceu", prefixoSlug: "para-", tipo: "FALECIDO", headKeyword: "mensagem de aniversário para quem já faleceu", volumeMensal: 1_000 },

  // ============ OCASIÃO — IDADE ============
  {
    slug: "de-15-anos",
    nome: "De 15 anos",
    prefixoSlug: "de-",
    tipo: "OCASIAO",
    headKeyword: "mensagem de aniversário 15 anos",
    volumeMensal: 1_600,
    complementos: [
      { slug: "para-filha", nome: "Para Filha", headKeyword: "mensagem 15 anos para filha", volumeMensal: 720 },
      { slug: "para-sobrinha", nome: "Para Sobrinha", headKeyword: "mensagem 15 anos para sobrinha", volumeMensal: 260 },
      { slug: "para-menina", nome: "Para Menina", headKeyword: "mensagem 15 anos para menina", volumeMensal: 260 },
    ],
  },
  { slug: "de-18-anos", nome: "De 18 anos", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem de aniversário 18 anos", volumeMensal: 390 },
  { slug: "de-30-anos", nome: "De 30 anos", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem de aniversário 30 anos", volumeMensal: 140 },
  { slug: "de-50-anos", nome: "De 50 anos", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem de aniversário 50 anos", volumeMensal: 260 },
  { slug: "de-80-anos", nome: "De 80 anos", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem de aniversário 80 anos", volumeMensal: 140 },

  // ============ OCASIÃO — NAMORO ============
  { slug: "de-1-ano-de-namoro", nome: "1 ano de namoro", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 1 ano de namoro", volumeMensal: 720 },
  { slug: "de-2-anos-de-namoro", nome: "2 anos de namoro", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 2 anos de namoro", volumeMensal: 320 },
  { slug: "de-4-anos-de-namoro", nome: "4 anos de namoro", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 4 anos de namoro", volumeMensal: 110 },

  // ============ OCASIÃO — BODAS (URL diferente, sem prefix /aniversario/) ============
  // Estas viram clusters do mesmo Nicho mas com slug self-explaining
  // Convencao: slug começa com "bodas-de-" pra ter URL /mensagem-de-aniversario/bodas-de-prata-25-anos/
  // (mantemos no mesmo nicho pra simplicidade)
  { slug: "bodas-de-prata-25-anos", nome: "Bodas de Prata (25 anos)", prefixoSlug: "", tipo: "OCASIAO", headKeyword: "mensagem bodas de prata 25 anos", volumeMensal: 1_000 },
  { slug: "bodas-de-ouro-50-anos", nome: "Bodas de Ouro (50 anos)", prefixoSlug: "", tipo: "OCASIAO", headKeyword: "mensagem bodas de ouro 50 anos", volumeMensal: 590 },
  { slug: "bodas-de-estanho-10-anos", nome: "Bodas de Estanho (10 anos)", prefixoSlug: "", tipo: "OCASIAO", headKeyword: "mensagem 10 anos de casamento", volumeMensal: 1_900 },
  { slug: "bodas-de-cristal-15-anos", nome: "Bodas de Cristal (15 anos)", prefixoSlug: "", tipo: "OCASIAO", headKeyword: "mensagem 15 anos de casamento", volumeMensal: 1_600 },

  // ============ TONS (faceta — só lista) ============
  {
    slug: "evangelica",
    nome: "Evangélica",
    prefixoSlug: "",
    tipo: "TOM",
    headKeyword: "mensagem evangélica de aniversário",
    volumeMensal: 27_100,
    complementos: [
      { slug: "para-mae", nome: "Para Mãe", headKeyword: "mensagem evangélica para mãe", volumeMensal: 27_100 },
      { slug: "para-amiga", nome: "Para Amiga", headKeyword: "mensagem evangélica para amiga", volumeMensal: 5_400 },
    ],
  },
  { slug: "biblica", nome: "Bíblica", prefixoSlug: "", tipo: "TOM", headKeyword: "mensagem bíblica de aniversário", volumeMensal: 22_200 },
  { slug: "catolica", nome: "Católica", prefixoSlug: "", tipo: "TOM", headKeyword: "mensagem católica de aniversário", volumeMensal: 4_400 },
  { slug: "gospel", nome: "Gospel", prefixoSlug: "", tipo: "TOM", headKeyword: "mensagem gospel de aniversário", volumeMensal: 8_100 },
  { slug: "espirita", nome: "Espírita", prefixoSlug: "", tipo: "TOM", headKeyword: "mensagem espírita de aniversário", volumeMensal: 6_600 },
  { slug: "crista", nome: "Cristã", prefixoSlug: "", tipo: "TOM", headKeyword: "mensagem cristã de aniversário", volumeMensal: 6_600 },
  { slug: "engracada", nome: "Engraçada", prefixoSlug: "", tipo: "TOM", headKeyword: "mensagem engraçada de aniversário", volumeMensal: 5_400 },
  { slug: "curta", nome: "Curta", prefixoSlug: "", tipo: "TOM", headKeyword: "mensagem curta de aniversário", volumeMensal: 14_800 },
  { slug: "simples", nome: "Simples", prefixoSlug: "", tipo: "TOM", headKeyword: "mensagem simples de aniversário", volumeMensal: 5_400 },
  { slug: "bonita", nome: "Bonita", prefixoSlug: "", tipo: "TOM", headKeyword: "mensagem bonita de aniversário", volumeMensal: 8_100 },
  { slug: "reflexiva", nome: "Reflexiva", prefixoSlug: "", tipo: "TOM", headKeyword: "mensagem reflexiva de aniversário", volumeMensal: 9_900 },

  // ============ CANAIS ============
  { slug: "no-whatsapp", nome: "No WhatsApp", prefixoSlug: "", tipo: "CANAL", headKeyword: "mensagem de aniversário no whatsapp", volumeMensal: 33_100 },
  { slug: "para-status", nome: "Para Status", prefixoSlug: "", tipo: "CANAL", headKeyword: "mensagem de aniversário para status", volumeMensal: 14_800 },

  // ============================================================
  // EXPANSÃO baseada em DADOS REAIS GSC (Search Console)
  // Todas categorias com tráfego/impressões comprovadas
  // ============================================================

  // === IDADES ESPECÍFICAS (top 30 GSC inclui 45/65/75/95/100 anos) ===
  { slug: "de-25-anos", nome: "De 25 anos", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem de aniversário 25 anos", volumeMensal: 200 },
  { slug: "de-35-anos", nome: "De 35 anos", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem de aniversário 35 anos", volumeMensal: 150 },
  { slug: "de-40-anos", nome: "De 40 anos", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem de aniversário 40 anos", volumeMensal: 250 },
  { slug: "de-45-anos", nome: "De 45 anos", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem de aniversário 45 anos", volumeMensal: 200 },
  { slug: "de-60-anos", nome: "De 60 anos", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem de aniversário 60 anos", volumeMensal: 250 },
  { slug: "de-65-anos", nome: "De 65 anos", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem de aniversário 65 anos", volumeMensal: 180 },
  { slug: "de-70-anos", nome: "De 70 anos", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem de aniversário 70 anos", volumeMensal: 200 },
  { slug: "de-75-anos", nome: "De 75 anos", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem de aniversário 75 anos", volumeMensal: 200 },
  { slug: "de-90-anos", nome: "De 90 anos", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem de aniversário 90 anos", volumeMensal: 130 },
  { slug: "de-95-anos", nome: "De 95 anos", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem de aniversário 95 anos", volumeMensal: 100 },
  { slug: "de-100-anos", nome: "De 100 anos", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem de aniversário 100 anos", volumeMensal: 200 },

  // === NAMORO TEMPO ESTENDIDO (10-anos-namoro foi #1 no GSC com 173 cliques) ===
  { slug: "de-3-anos-de-namoro", nome: "3 anos de namoro", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 3 anos de namoro", volumeMensal: 210 },
  { slug: "de-5-anos-de-namoro", nome: "5 anos de namoro", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 5 anos de namoro", volumeMensal: 170 },
  { slug: "de-6-anos-de-namoro", nome: "6 anos de namoro", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 6 anos de namoro", volumeMensal: 50 },
  { slug: "de-7-anos-de-namoro", nome: "7 anos de namoro", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 7 anos de namoro", volumeMensal: 70 },
  { slug: "de-8-anos-de-namoro", nome: "8 anos de namoro", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 8 anos de namoro", volumeMensal: 30 },
  { slug: "de-10-anos-de-namoro", nome: "10 anos de namoro", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 10 anos de namoro", volumeMensal: 700 },

  // === AMIZADE TEMPO (cluster novo, 1/3/4 anos têm tráfego no GSC) ===
  { slug: "de-1-ano-de-amizade", nome: "1 ano de amizade", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 1 ano de amizade", volumeMensal: 320 },
  { slug: "de-2-anos-de-amizade", nome: "2 anos de amizade", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 2 anos de amizade", volumeMensal: 150 },
  { slug: "de-3-anos-de-amizade", nome: "3 anos de amizade", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 3 anos de amizade", volumeMensal: 180 },
  { slug: "de-4-anos-de-amizade", nome: "4 anos de amizade", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 4 anos de amizade", volumeMensal: 200 },
  { slug: "de-5-anos-de-amizade", nome: "5 anos de amizade", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 5 anos de amizade", volumeMensal: 100 },
  { slug: "de-10-anos-de-amizade", nome: "10 anos de amizade", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 10 anos de amizade", volumeMensal: 80 },

  // === MESVERSÁRIO (bebê) — 10/12 meses no GSC ===
  { slug: "de-1-mes", nome: "1 mês de vida", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 1 mês de vida bebê", volumeMensal: 150 },
  { slug: "de-3-meses", nome: "3 meses de vida", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 3 meses de vida bebê", volumeMensal: 100 },
  { slug: "de-6-meses", nome: "6 meses de vida", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 6 meses de vida bebê", volumeMensal: 200 },
  { slug: "de-9-meses", nome: "9 meses de vida", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 9 meses de vida bebê", volumeMensal: 80 },
  { slug: "de-10-meses", nome: "10 meses de vida", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 10 meses de vida bebê", volumeMensal: 80 },
  { slug: "de-12-meses", nome: "12 meses (1 aninho)", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 1 aninho de vida bebê", volumeMensal: 250 },

  // === BODAS EXTRAS (esmeralda+flores no GSC) ===
  { slug: "bodas-de-esmeralda-35-anos", nome: "Bodas de Esmeralda (35 anos)", prefixoSlug: "", tipo: "OCASIAO", headKeyword: "mensagem bodas de esmeralda 35 anos", volumeMensal: 250 },
  { slug: "bodas-de-flores-4-anos", nome: "Bodas de Flores (4 anos)", prefixoSlug: "", tipo: "OCASIAO", headKeyword: "mensagem bodas de flores 4 anos casamento", volumeMensal: 100 },
  { slug: "bodas-de-pinho-32-anos", nome: "Bodas de Pinho (32 anos)", prefixoSlug: "", tipo: "OCASIAO", headKeyword: "mensagem bodas de pinho 32 anos", volumeMensal: 480 },

  // === TONS EMOCIONAIS NOVOS (resiliência/perdão/milagre no GSC) ===
  { slug: "milagre", nome: "Milagre", prefixoSlug: "", tipo: "TOM", headKeyword: "mensagem de aniversário milagre da vida", volumeMensal: 80 },
  { slug: "perdao", nome: "Perdão", prefixoSlug: "", tipo: "TOM", headKeyword: "mensagem de aniversário com perdão", volumeMensal: 60 },
  { slug: "resiliencia", nome: "Resiliência", prefixoSlug: "", tipo: "TOM", headKeyword: "mensagem de aniversário sobre resiliência", volumeMensal: 100 },
  { slug: "gratidao", nome: "Gratidão", prefixoSlug: "", tipo: "TOM", headKeyword: "mensagem de aniversário com gratidão", volumeMensal: 480 },
  { slug: "romantica", nome: "Romântica", prefixoSlug: "", tipo: "TOM", headKeyword: "mensagem de aniversário romântica", volumeMensal: 14_800 },

  // === DESTINATÁRIOS NOVOS (idoso/enteada no GSC) ===
  { slug: "para-idoso", nome: "Para Idoso", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para idoso", volumeMensal: 800 },
  { slug: "para-enteada", nome: "Para Enteada", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para enteada", volumeMensal: 100 },
  { slug: "para-enteado", nome: "Para Enteado", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para enteado", volumeMensal: 80 },
  { slug: "para-bisneto", nome: "Para Bisneto", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para bisneto", volumeMensal: 50 },
  { slug: "para-bisneta", nome: "Para Bisneta", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para bisneta", volumeMensal: 50 },
  { slug: "para-lider", nome: "Para Líder", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para líder", volumeMensal: 80 },
  { slug: "para-homem", nome: "Para Homem", prefixoSlug: "para-", tipo: "DESTINATARIO", headKeyword: "mensagem de aniversário para homem", volumeMensal: 6_600 },

  // === BODAS COMPLETAS (do GSC + tabela tradicional) ===
  { slug: "bodas-de-papel-1-ano", nome: "Bodas de Papel (1 ano)", prefixoSlug: "", tipo: "OCASIAO", headKeyword: "mensagem 1 ano de casamento", volumeMensal: 590 },
  { slug: "bodas-de-madeira-5-anos", nome: "Bodas de Madeira (5 anos)", prefixoSlug: "", tipo: "OCASIAO", headKeyword: "mensagem 5 anos de casamento", volumeMensal: 880 },
  { slug: "bodas-de-bronze-8-anos", nome: "Bodas de Bronze (8 anos)", prefixoSlug: "", tipo: "OCASIAO", headKeyword: "mensagem 8 anos de casamento", volumeMensal: 140 },
  { slug: "bodas-de-perola-30-anos", nome: "Bodas de Pérola (30 anos)", prefixoSlug: "", tipo: "OCASIAO", headKeyword: "mensagem 30 anos de casamento", volumeMensal: 480 },
  { slug: "bodas-de-rubi-40-anos", nome: "Bodas de Rubi (40 anos)", prefixoSlug: "", tipo: "OCASIAO", headKeyword: "mensagem 40 anos de casamento", volumeMensal: 320 },

  // === RELACIONAMENTO TEMPO ===
  { slug: "de-20-anos-de-relacionamento", nome: "20 anos de relacionamento", prefixoSlug: "de-", tipo: "OCASIAO", headKeyword: "mensagem 20 anos de relacionamento", volumeMensal: 100 },

  // === TONS EXTRAS (do GSC) ===
  { slug: "coragem", nome: "Coragem", prefixoSlug: "", tipo: "TOM", headKeyword: "mensagem de aniversário sobre coragem", volumeMensal: 80 },
  { slug: "abencoada", nome: "Abençoada", prefixoSlug: "", tipo: "TOM", headKeyword: "mensagem de aniversário abençoada", volumeMensal: 200 },
];
