/**
 * Gera artigos de blog para as queries INFORMACIONAIS do Search Console
 * que hoje tem impressao alta e nenhuma pagina dedicada.
 *
 * Descoberta da auditoria: existe demanda massiva por conteudo sobre BODAS
 * ("X anos de casamento e bodas de que") que o site nao atende. Somadas,
 * essas queries dao ~5.400 impressoes/mes sem pagina de resposta.
 *
 * Cada artigo:
 *  - Responde a pergunta na primeira dobra (capsula de resposta pra AI Overview)
 *  - Traz contexto/historia da tradicao
 *  - Linka internamente pro cluster de mensagens correspondente (money page)
 *  - Voz humanizada: mesma banlist anti-IA do editorial-rewrite-v2
 *
 * Uso:
 *   tsx scripts/blog-gsc-pautas.ts --dry-run --limit=1
 *   tsx scripts/blog-gsc-pautas.ts --concurrency=3
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __f = fileURLToPath(import.meta.url);
const __d = dirname(__f);
config({ path: resolve(__d, "..", ".env") });

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const API_KEY = process.env.LLM_API_KEY ?? process.env.DEEPSEEK_API_KEY ?? "";
const API_BASE = process.env.LLM_API_BASE ?? "https://api.deepseek.com/v1";
const MODEL = process.env.LLM_MODEL ?? "deepseek-chat";
if (!API_KEY) throw new Error("Falta LLM_API_KEY");

const SITE = "https://www.portalsoma.com.br";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [[m[1], m[2] ?? "true"]] : [];
  }),
);
const DRY = args["dry-run"] === "true";
const LIMIT = args.limit ? Number(args.limit) : undefined;
const CONCURRENCY = args.concurrency ? Number(args.concurrency) : 3;

const BANIDOS = [
  "quem busca", "lacos", "laços", "traduzir", "nuance", "trajetoria", "trajetória",
  "palavras certas", "transcend", "antes de tudo", "sobretudo", "ao mesmo tempo",
  "nao e apenas", "não é apenas", "mais do que apenas", "em ultima analise",
  "em última análise", "vale ressaltar", "vale destacar", "no fim do dia",
  "em conclusao", "em conclusão", "jornada", "navegar", "no mundo de hoje",
  "cada vez mais", "em meio a", "em uma era", "verdadeiro presente",
  "inesquecivel", "inesquecível", "repleto de", "celebrar a vida",
  "momento unico", "momento único", "papel fundamental", "por sua vez",
  "dessa forma", "assim sendo", "alem disso", "além disso",
];

interface Pauta {
  slug: string;
  titulo: string;
  metaTitle: string;
  metaDescription: string;
  categoria: string; // slug BlogCategory
  queryAlvo: string;
  impressoesMes: number;
  respostaDireta: string; // capsula que DEVE aparecer na primeira dobra
  linksInternos: Array<{ label: string; url: string }>;
  angulo: string; // direcao editorial pro modelo
}

const CL = (slug: string) => `${SITE}/mensagem-de-aniversario/${slug}/`;

const PAUTAS: Pauta[] = [
  {
    slug: "tabela-de-bodas-completa-de-1-a-100-anos",
    titulo: "Tabela de bodas completa: de 1 a 100 anos de casamento",
    metaTitle: "Tabela de Bodas Completa: 1 a 100 Anos de Casamento",
    metaDescription:
      "Descubra que bodas são cada ano de casamento, de 1 a 100. Tabela completa, origem de cada símbolo e mensagens prontas para comemorar a data.",
    categoria: "significado-da-data",
    queryAlvo: "x anos de casamento e bodas de que",
    impressoesMes: 2000,
    respostaDireta:
      "Cada ano de casamento tem um nome de bodas ligado a um material. A lógica é de resistência crescente: começa no papel (1 ano) e chega ao diamante azul (100 anos).",
    linksInternos: [
      { label: "mensagens de bodas de papel (1 ano)", url: CL("bodas-de-papel-1-ano") },
      { label: "bodas de flores (4 anos)", url: CL("bodas-de-flores-4-anos") },
      { label: "bodas de madeira (5 anos)", url: CL("bodas-de-madeira-5-anos") },
      { label: "bodas de bronze (8 anos)", url: CL("bodas-de-bronze-8-anos") },
      { label: "bodas de estanho (10 anos)", url: CL("bodas-de-estanho-10-anos") },
      { label: "bodas de cristal (15 anos)", url: CL("bodas-de-cristal-15-anos") },
      { label: "bodas de prata (25 anos)", url: CL("bodas-de-prata-25-anos") },
      { label: "bodas de pérola (30 anos)", url: CL("bodas-de-perola-30-anos") },
      { label: "bodas de pinho (32 anos)", url: CL("bodas-de-pinho-32-anos") },
      { label: "bodas de esmeralda (35 anos)", url: CL("bodas-de-esmeralda-35-anos") },
      { label: "bodas de rubi (40 anos)", url: CL("bodas-de-rubi-40-anos") },
      { label: "bodas de ouro (50 anos)", url: CL("bodas-de-ouro-50-anos") },
    ],
    angulo:
      "Artigo de referencia. Precisa ter uma TABELA MARKDOWN completa listando ano por ano de 1 a 30, depois os marcos (32, 35, 40, 45, 50, 60, 70, 75, 80, 90, 100). Colunas: Ano | Nome das bodas | Simbolo. Antes da tabela, explique a logica (materiais que ficam mais raros e resistentes conforme o tempo). Depois da tabela, uma secao sobre quais bodas o brasileiro realmente comemora (papel, madeira, estanho, cristal, prata, ouro) e por que as outras passam batido.",
  },
  {
    slug: "32-anos-de-casados-bodas-de-pinho",
    titulo: "32 anos de casados é bodas de quê? Bodas de pinho explicadas",
    metaTitle: "32 Anos de Casados é Bodas de Quê? Bodas de Pinho",
    metaDescription:
      "32 anos de casamento são as bodas de pinho. Entenda o símbolo da madeira que resiste, como comemorar e veja mensagens prontas para a data.",
    categoria: "significado-da-data",
    queryAlvo: "32 anos de casados sao bodas de que",
    impressoesMes: 600,
    respostaDireta: "32 anos de casamento são as bodas de pinho.",
    linksInternos: [
      { label: "mensagens de bodas de pinho", url: CL("bodas-de-pinho-32-anos") },
      { label: "bodas de pérola (30 anos)", url: CL("bodas-de-perola-30-anos") },
      { label: "bodas de esmeralda (35 anos)", url: CL("bodas-de-esmeralda-35-anos") },
      { label: "mensagens para o marido", url: CL("para-marido") },
      { label: "mensagens para a esposa", url: CL("para-esposa") },
    ],
    angulo:
      "Responda na primeira linha. Depois: por que pinho? Madeira comum, barata, que ninguem acha nobre, mas que aguenta. Faca o paralelo com 32 anos de casamento: ja nao e a novidade dos 30, ainda nao e o marco dos 35. E o ano do meio, do cotidiano. Termine com ideias de comemoracao simples.",
  },
  {
    slug: "4-anos-de-namoro-bodas-de-flores",
    titulo: "4 anos de namoro é bodas de quê? Bodas de flores e frutas",
    metaTitle: "4 Anos de Namoro é Bodas de Quê? Flores e Frutas",
    metaDescription:
      "4 anos de namoro ou casamento são as bodas de flores e frutas. Veja o significado, como comemorar e mensagens prontas para mandar no WhatsApp.",
    categoria: "significado-da-data",
    queryAlvo: "4 anos de namoro e bodas de que",
    impressoesMes: 650,
    respostaDireta: "4 anos de namoro ou casamento são as bodas de flores e frutas.",
    linksInternos: [
      { label: "mensagens de 4 anos de namoro", url: CL("de-4-anos-de-namoro") },
      { label: "bodas de flores (4 anos)", url: CL("bodas-de-flores-4-anos") },
      { label: "mensagens de 3 anos de namoro", url: CL("de-3-anos-de-namoro") },
      { label: "mensagens de 5 anos de namoro", url: CL("de-5-anos-de-namoro") },
    ],
    angulo:
      "Resposta na primeira linha. Explique a diferenca entre contar bodas de NAMORO e de CASAMENTO (muita gente usa a mesma tabela). Flores e frutas: o que ja floresceu e o que ja da fruto. Aos 4 anos o relacionamento saiu da fase de descoberta. Fale do que muda nessa fase real: convivencia, familia do outro, planos.",
  },
  {
    slug: "10-anos-de-namoro-bodas-e-como-comemorar",
    titulo: "10 anos de namoro é bodas de quê? Guia da década juntos",
    metaTitle: "10 Anos de Namoro é Bodas de Quê? Guia Completo",
    metaDescription:
      "10 anos de namoro são bodas de estanho ou zinco. Veja o significado da década juntos, formas de comemorar e mensagens prontas para a data.",
    categoria: "significado-da-data",
    queryAlvo: "10 anos de namoro bodas",
    impressoesMes: 500,
    respostaDireta: "10 anos de namoro são as bodas de estanho, também chamadas de bodas de zinco.",
    linksInternos: [
      { label: "mensagens de 10 anos de namoro", url: CL("de-10-anos-de-namoro") },
      { label: "bodas de estanho (10 anos)", url: CL("bodas-de-estanho-10-anos") },
      { label: "mensagens para namorado", url: CL("para-namorado") },
      { label: "mensagens para namorada", url: CL("para-namorada") },
      { label: "20 anos de relacionamento", url: CL("de-20-anos-de-relacionamento") },
    ],
    angulo:
      "Resposta primeiro. Estanho: metal que dobra sem quebrar. Bom simbolo pra dez anos de namoro sem casar, que e uma situacao super comum no Brasil e quase ninguem fala sobre. Aborde a pergunta que todo casal de 10 anos ouve: quando casa? Fale com respeito por quem escolheu nao casar.",
  },
  {
    slug: "bodas-de-flores-4-anos-significado-e-comemoracao",
    titulo: "Bodas de flores: o que são os 4 anos de casamento",
    metaTitle: "Bodas de Flores: Significado dos 4 Anos de Casamento",
    metaDescription:
      "Bodas de flores marcam 4 anos de casamento. Entenda o símbolo, ideias de presente, formas de comemorar e mensagens prontas para o casal.",
    categoria: "significado-da-data",
    queryAlvo: "bodas de flores",
    impressoesMes: 677,
    respostaDireta: "Bodas de flores marcam 4 anos de casamento. Em algumas listas aparecem como bodas de flores e frutas.",
    linksInternos: [
      { label: "mensagens de bodas de flores", url: CL("bodas-de-flores-4-anos") },
      { label: "mensagens de 4 anos de namoro", url: CL("de-4-anos-de-namoro") },
      { label: "bodas de madeira (5 anos)", url: CL("bodas-de-madeira-5-anos") },
    ],
    angulo:
      "Resposta primeiro. Depois: flor e a unica boda que morre. Isso e proposital? Discuta a leitura mais bonita: flor precisa de cuidado diario ou murcha. Aos 4 anos o casamento perdeu o automatico da lua de mel. De ideias de presente que fujam do buque obvio.",
  },
  {
    slug: "bodas-de-pinho-32-anos-significado",
    titulo: "Bodas de pinho: o significado dos 32 anos de casamento",
    metaTitle: "Bodas de Pinho: Significado dos 32 Anos de Casamento",
    metaDescription:
      "Bodas de pinho celebram 32 anos de casamento. Veja a origem do símbolo, sugestões de presente e mensagens para o casal comemorar a data.",
    categoria: "significado-da-data",
    queryAlvo: "bodas de pinho",
    impressoesMes: 611,
    respostaDireta: "Bodas de pinho celebram 32 anos de casamento.",
    linksInternos: [
      { label: "mensagens de bodas de pinho", url: CL("bodas-de-pinho-32-anos") },
      { label: "bodas de pérola (30 anos)", url: CL("bodas-de-perola-30-anos") },
      { label: "bodas de esmeralda (35 anos)", url: CL("bodas-de-esmeralda-35-anos") },
    ],
    angulo:
      "Resposta primeiro. Pinho e a madeira do movel barato, do assoalho, da casa que a gente construiu. Nao e mogno nem carvalho. Faca esse contraste render: 32 anos e a fase em que o casamento ja e estrutura, nao enfeite. Presentes: coisas que duram e se usam.",
  },
  {
    slug: "10-anos-de-casamento-bodas-de-estanho",
    titulo: "10 anos de casamento é bodas de quê? Bodas de estanho",
    metaTitle: "10 Anos de Casamento é Bodas de Quê? Estanho",
    metaDescription:
      "10 anos de casamento são as bodas de estanho. Entenda o símbolo da primeira década, ideias de comemoração e mensagens prontas para o casal.",
    categoria: "significado-da-data",
    queryAlvo: "10 anos de casamento e bodas de que",
    impressoesMes: 500,
    respostaDireta: "10 anos de casamento são as bodas de estanho, também chamadas bodas de zinco.",
    linksInternos: [
      { label: "mensagens de bodas de estanho", url: CL("bodas-de-estanho-10-anos") },
      { label: "mensagens de 10 anos de namoro", url: CL("de-10-anos-de-namoro") },
      { label: "bodas de cristal (15 anos)", url: CL("bodas-de-cristal-15-anos") },
      { label: "mensagens para marido", url: CL("para-marido") },
      { label: "mensagens para esposa", url: CL("para-esposa") },
    ],
    angulo:
      "Resposta primeiro. A primeira decada e o divisor real: quem chega aos 10 ja passou pela crise dos 3, pela adaptacao, muitas vezes por filho pequeno. Estanho dobra, amassa e volta. Fale do que os 10 anos ensinam sem virar autoajuda.",
  },
  {
    slug: "bodas-de-cristal-15-anos-de-casamento",
    titulo: "Bodas de cristal: 15 anos de casamento e o que celebram",
    metaTitle: "Bodas de Cristal: 15 Anos de Casamento",
    metaDescription:
      "Bodas de cristal marcam 15 anos de casamento. Veja o significado da transparência, ideias de festa e mensagens prontas para parabenizar o casal.",
    categoria: "significado-da-data",
    queryAlvo: "bodas de cristal mensagem",
    impressoesMes: 400,
    respostaDireta: "Bodas de cristal marcam 15 anos de casamento.",
    linksInternos: [
      { label: "mensagens de bodas de cristal", url: CL("bodas-de-cristal-15-anos") },
      { label: "bodas de estanho (10 anos)", url: CL("bodas-de-estanho-10-anos") },
      { label: "bodas de prata (25 anos)", url: CL("bodas-de-prata-25-anos") },
    ],
    angulo:
      "Resposta primeiro. Cristal e transparente e quebra. Simbolo ambivalente e interessante: aos 15 anos o casal ja nao esconde nada um do outro, e isso e forca e risco. Compare com os 15 anos de uma pessoa (debutante) que tambem e idade de transicao.",
  },
  {
    slug: "dia-da-nora-quando-e-e-o-que-dizer",
    titulo: "Dia da Nora: quando é e o que escrever na data",
    metaTitle: "Dia da Nora 2026: Data e o Que Escrever",
    metaDescription:
      "O Dia da Nora é comemorado em 3 de agosto. Veja a origem da data, o que escrever sem soar forçado e mensagens prontas para mandar.",
    categoria: "relacoes-e-afeto",
    queryAlvo: "dia da nora",
    impressoesMes: 354,
    respostaDireta: "O Dia da Nora é comemorado em 3 de agosto no Brasil.",
    linksInternos: [
      { label: "mensagens para nora", url: CL("para-nora") },
      { label: "mensagens para sogra", url: CL("para-sogra") },
      { label: "mensagens para genro", url: CL("para-genro") },
    ],
    angulo:
      "Resposta primeiro (3 de agosto). Depois trate do assunto real: a relacao sogra e nora tem fama ruim e nem sempre merece. Escreva sobre como escrever pra alguem que entrou na familia por casamento sem soar protocolar. Diga o que evitar: comparar com filha, cobrar neto, elogiar so a comida.",
  },
  {
    slug: "45-anos-o-que-muda-nessa-idade",
    titulo: "45 anos: o que essa idade significa e como marcá-la",
    metaTitle: "45 Anos: O Que Muda e Como Celebrar a Idade",
    metaDescription:
      "Chegar aos 45 anos tem um peso próprio. Veja o que muda nessa fase, por que a data incomoda alguns e mensagens para celebrar sem clichê.",
    categoria: "significado-da-data",
    queryAlvo: "meus 45 anos",
    impressoesMes: 300,
    respostaDireta:
      "Aos 45 anos, a maioria das pessoas está no meio da vida adulta produtiva: carreira estabelecida, filhos crescendo, pais envelhecendo.",
    linksInternos: [
      { label: "mensagens de 45 anos", url: CL("de-45-anos") },
      { label: "mensagens de 40 anos", url: CL("de-40-anos") },
      { label: "mensagens de 50 anos", url: CL("de-50-anos") },
    ],
    angulo:
      "Muita gente busca isso pra escrever sobre si mesma (queries tipo 'meus 45 anos chegou'). Escreva pra essa pessoa. 45 nao e numero redondo, entao passa despercebido, e talvez seja por isso que incomoda. Fale da geracao sanduiche: cuidar de filho e de pai ao mesmo tempo. Sem autoajuda barata.",
  },
  {
    slug: "bodas-de-prata-25-anos-como-celebrar",
    titulo: "Bodas de prata: 25 anos de casamento e como celebrar",
    metaTitle: "Bodas de Prata: 25 Anos de Casamento",
    metaDescription:
      "Bodas de prata marcam 25 anos de casamento. Veja o significado, como organizar a comemoração e mensagens prontas para o casal.",
    categoria: "celebracao-e-festa",
    queryAlvo: "bodas de prata mensagem",
    impressoesMes: 400,
    respostaDireta: "Bodas de prata marcam 25 anos de casamento.",
    linksInternos: [
      { label: "mensagens de bodas de prata", url: CL("bodas-de-prata-25-anos") },
      { label: "bodas de pérola (30 anos)", url: CL("bodas-de-perola-30-anos") },
      { label: "bodas de ouro (50 anos)", url: CL("bodas-de-ouro-50-anos") },
      { label: "mensagens de 25 anos", url: CL("de-25-anos") },
    ],
    angulo:
      "Resposta primeiro. Prata e a primeira boda que vira festa de verdade no Brasil. Fale de logistica real: quem convidar, renovar votos ou nao, o dilema do presente pra quem ja tem tudo. Prata precisa de polimento pra nao escurecer, e essa metafora funciona.",
  },
  {
    slug: "bodas-de-ouro-50-anos-de-casamento",
    titulo: "Bodas de ouro: 50 anos de casamento e o que celebrar",
    metaTitle: "Bodas de Ouro: 50 Anos de Casamento",
    metaDescription:
      "Bodas de ouro celebram 50 anos de casamento. Veja o significado, como organizar a homenagem e mensagens para os pais ou avós na data.",
    categoria: "celebracao-e-festa",
    queryAlvo: "bodas de ouro",
    impressoesMes: 300,
    respostaDireta: "Bodas de ouro celebram 50 anos de casamento.",
    linksInternos: [
      { label: "mensagens de bodas de ouro", url: CL("bodas-de-ouro-50-anos") },
      { label: "bodas de prata (25 anos)", url: CL("bodas-de-prata-25-anos") },
      { label: "mensagens para os avós", url: CL("para-avo") },
      { label: "mensagens de 50 anos", url: CL("de-50-anos") },
    ],
    angulo:
      "Resposta primeiro. Aos 50 anos de casamento quem organiza a festa quase sempre sao os filhos e netos, nao o casal. Escreva pensando em quem vai organizar. Ouro nao oxida: e o unico metal da lista que chega intacto. Fale de homenagem sem transformar em velorio antecipado.",
  },
];

const SYSTEM = `Voce e redator do Portal Soma, site brasileiro sobre aniversarios, bodas e datas afetivas.

COMO ESCREVER:
Abre com a RESPOSTA DIRETA a pergunta do titulo, em uma ou duas frases. Sem enrolacao, sem introducao ceremonial. Depois desenvolve.

Voce escreve como jornalista de revista que conhece gente de verdade. Frases curtas, media de 15 palavras. Cena concreta vale mais que adjetivo.

RUIM (soa IA): "Celebrar bodas de pinho e, antes de tudo, reconhecer o valor de uma trajetoria construida a dois."
BOM (soa gente): "Pinho e madeira de movel barato. Nao e mogno. E o que aguenta trinta anos de mudanca de casa sem rachar."

REGRAS DURAS:
1. Frases curtas. Media 15 palavras. Nunca passe de 25.
2. Zero conectivo formal (portanto, dessa forma, alem disso, por sua vez, ou seja, assim sendo).
3. Use "a gente" e "voce".
4. Cite situacoes reais brasileiras: grupo de familia no WhatsApp, almoco de domingo, festa em salao de predio, foto emoldurada na sala.
5. Pode ter opiniao. Pode discordar do senso comum.
6. Nunca use travessao longo. Use virgula, ponto ou dois-pontos.
7. OBRIGATORIO: acentuacao completa do portugues brasileiro. Palavras como voce, ja, tambem, aniversario, memoria, familia, historia DEVEM sair acentuadas.
8. Nada de listas com bullet quando prosa funciona melhor. Use markdown ## para secoes.

PALAVRAS PROIBIDAS (uso = rejeicao): ${BANIDOS.join(", ")}

Voce recebe uma pauta com angulo editorial e uma lista de LINKS INTERNOS. Voce DEVE inserir todos os links internos naturalmente no meio do texto, em markdown [texto](url). Nunca despeje os links em bloco no final.

Retorne JSON valido unico, sem markdown wrapping:
{
  "conteudo": "Artigo completo em markdown. 900 a 1400 palavras. Comeca com a resposta direta (sem titulo H1, o site ja renderiza). Usa ## para secoes. Insere todos os links internos ao longo do texto.",
  "resumo": "1 frase de 140 a 160 caracteres resumindo a resposta principal do artigo."
}`;

function violacoes(txt: string): string[] {
  const low = txt.toLowerCase();
  return BANIDOS.filter((b) => low.includes(b));
}

interface Gen {
  conteudo: string;
  resumo: string;
}

async function gerar(p: Pauta, tentativa = 1): Promise<Gen | null> {
  const linksTxt = p.linksInternos.map((l) => `- [${l.label}](${l.url})`).join("\n");
  const user = `PAUTA: ${p.titulo}

Query alvo no Google: "${p.queryAlvo}" (${p.impressoesMes} impressoes/mes sem pagina dedicada)

RESPOSTA QUE DEVE ABRIR O TEXTO (pode reescrever com suas palavras, mas o fato tem que estar na primeira frase):
${p.respostaDireta}

ANGULO EDITORIAL:
${p.angulo}

LINKS INTERNOS OBRIGATORIOS (todos devem aparecer no corpo do texto, em contexto natural):
${linksTxt}

Escreva o artigo.`;

  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 1.0,
      max_tokens: 8000,
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 180)}`);
  const data = await res.json();
  let parsed: Gen;
  try {
    parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
  } catch {
    return null;
  }
  if (!parsed.conteudo) return null;

  const viol = violacoes(parsed.conteudo);
  const acentos = (parsed.conteudo.match(/[áàâãéêíóôõúüç]/gi) ?? []).length;
  const semAcento = acentos / Math.max(parsed.conteudo.length, 1) < 0.015;
  const linksFaltando = p.linksInternos.filter((l) => !parsed.conteudo.includes(l.url));
  const words = parsed.conteudo.split(/\s+/).length;

  if (viol.length > 0 || semAcento || linksFaltando.length > 2 || words < 500) {
    if (tentativa < 3) {
      const motivo = viol.length
        ? `tells: ${viol.slice(0, 3).join(",")}`
        : semAcento
          ? "sem acentos"
          : linksFaltando.length > 2
            ? `faltam ${linksFaltando.length} links`
            : `curto: ${words}w`;
      console.log(`    retry ${tentativa} (${motivo})`);
      return gerar(p, tentativa + 1);
    }
    console.log(`    GATE FAIL: ${viol.slice(0, 3).join(",")} links_faltando=${linksFaltando.length} words=${words}`);
    return null;
  }
  return parsed;
}

async function main() {
  console.log(`[blog-gsc] model=${MODEL} dry=${DRY} pautas=${PAUTAS.length}`);
  const alvo = LIMIT ? PAUTAS.slice(0, LIMIT) : PAUTAS;

  const cats = await prisma.blogCategory.findMany({ select: { id: true, slug: true } });
  const catMap = new Map(cats.map((c) => [c.slug, c.id]));
  const autor = await prisma.author.findFirst({ where: { ativo: true, real: true } })
    ?? await prisma.author.findFirst({ where: { ativo: true } });
  if (!autor) throw new Error("Sem autor ativo");
  console.log(`[blog-gsc] autor: ${autor.nome} | categorias: ${cats.length}`);

  let ok = 0;
  let fail = 0;
  let cursor = 0;

  async function worker(wid: number) {
    while (cursor < alvo.length) {
      const idx = cursor++;
      const p = alvo[idx]!;
      try {
        const catId = catMap.get(p.categoria);
        if (!catId) {
          console.log(`  [w${wid}] SKIP ${p.slug}: categoria ${p.categoria} inexistente`);
          fail++;
          continue;
        }
        const g = await gerar(p);
        if (!g) {
          fail++;
          console.log(`  [w${wid} ${idx + 1}/${alvo.length}] FAIL ${p.slug}`);
          continue;
        }
        const words = g.conteudo.split(/\s+/).length;
        if (!DRY) {
          const existing = await prisma.post.findFirst({ where: { slug: p.slug } });
          const payload = {
            titulo: p.titulo,
            metaTitle: p.metaTitle,
            metaDescription: p.metaDescription,
            conteudo: g.conteudo,
            resumo: g.resumo,
            wordCount: words,
            tempoLeitura: Math.max(3, Math.round(words / 200)),
            categoriaId: catId,
            autorId: autor.id,
            status: "PUBLISHED" as const,
            publicadoEm: new Date(),
          };
          if (existing) {
            await prisma.post.update({ where: { id: existing.id }, data: payload });
          } else {
            await prisma.post.create({ data: { slug: p.slug, ...payload } });
          }
        }
        ok++;
        console.log(`  [w${wid} ${idx + 1}/${alvo.length}] OK ${p.slug} ${words}w`);
        if (DRY) console.log(`      >> ${g.conteudo.slice(0, 300)}...`);
      } catch (e) {
        fail++;
        console.log(`  [w${wid}] ERR ${p.slug}: ${e instanceof Error ? e.message.slice(0, 140) : e}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1)));
  console.log(`\n[blog-gsc] done: ${ok} ok, ${fail} fail`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
