/**
 * Injeta links internos contextuais no corpo dos posts do blog.
 *
 * Os 30 posts originais foram escritos sem nenhum link para os clusters de
 * mensagem. Eles recebem o bloco RelatedClusters no rodape, mas link no meio
 * do texto vale mais: passa contexto pro Google e o leitor clica mais.
 *
 * Como funciona (sem LLM, custo zero):
 *  - procura a primeira mencao de cada termo mapeavel no corpo
 *  - troca por link markdown apontando pro cluster
 *  - respeita limites: no maximo 4 links por post, 1 por cluster
 *  - nao mexe em heading, em texto que ja e link, nem dentro de bloco de codigo
 *
 * Uso:
 *   tsx scripts/autolink-posts.ts --dry-run
 *   tsx scripts/autolink-posts.ts
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

const SITE = "https://www.portalsoma.com.br";
const MAX_LINKS = 4;

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [[m[1], m[2] ?? "true"]] : [];
  }),
);
const DRY = args["dry-run"] === "true";

/**
 * Termo -> slug do cluster. Ordem importa: o mais especifico vem primeiro,
 * senao "mensagem para mae" seria capturado pela regra generica de "mae".
 */
const TERMOS: Array<{ re: RegExp; slug: string }> = [
  // Relacoes especificas
  { re: /\bmelhor amiga\b/i, slug: "para-amiga" },
  { re: /\bmelhor amigo\b/i, slug: "para-amigo" },
  { re: /\bsogra\b/i, slug: "para-sogra" },
  { re: /\bsogro\b/i, slug: "para-sogro" },
  { re: /\bmadrinha\b/i, slug: "para-madrinha" },
  { re: /\bpadrinho\b/i, slug: "para-padrinho" },
  { re: /\bafilhada\b/i, slug: "para-afilhada" },
  { re: /\bafilhado\b/i, slug: "para-afilhado" },
  { re: /\benteada\b/i, slug: "para-enteada" },
  { re: /\bcunhada\b/i, slug: "para-cunhada" },
  { re: /\bcunhado\b/i, slug: "para-cunhado" },
  { re: /\bsobrinha\b/i, slug: "para-sobrinha" },
  { re: /\bsobrinho\b/i, slug: "para-sobrinho" },
  { re: /\bnamorada\b/i, slug: "para-namorada" },
  { re: /\bnamorado\b/i, slug: "para-namorado" },
  { re: /\bnora\b/i, slug: "para-nora" },
  { re: /\bgenro\b/i, slug: "para-genro" },
  { re: /\bneta\b/i, slug: "para-neta" },
  { re: /\bneto\b/i, slug: "para-neto" },
  // Familia nuclear
  { re: /\bmarido\b/i, slug: "para-marido" },
  { re: /\besposa\b/i, slug: "para-esposa" },
  { re: /\bfilha\b/i, slug: "para-filha" },
  { re: /\bfilho\b/i, slug: "para-filho" },
  { re: /\birm[ãa]\b/i, slug: "para-irma" },
  { re: /\birm[ãa]o\b/i, slug: "para-irmao" },
  { re: /\bav[óo]s?\b/i, slug: "para-avo" },
  { re: /\bm[ãa]e\b/i, slug: "para-mae" },
  { re: /\bpai\b/i, slug: "para-pai" },
  { re: /\btia\b/i, slug: "para-tia" },
  { re: /\btio\b/i, slug: "para-tio" },
  { re: /\bprima\b/i, slug: "para-prima" },
  { re: /\bamiga\b/i, slug: "para-amiga" },
  { re: /\bamigo\b/i, slug: "para-amigo" },
  // Trabalho
  { re: /\bchefe\b/i, slug: "para-chefe" },
  { re: /\bcolega\b/i, slug: "para-colega" },
  { re: /\bcliente\b/i, slug: "para-cliente" },
  // Tom
  { re: /\bevang[ée]lic[ao]\b/i, slug: "evangelica" },
  { re: /\bb[íi]blic[ao]\b/i, slug: "biblica" },
  { re: /\bcat[óo]lic[ao]\b/i, slug: "catolica" },
  { re: /\besp[íi]rita\b/i, slug: "espirita" },
  { re: /\bengra[çc]ada\b/i, slug: "engracada" },
  // Canal
  { re: /\bwhatsapp\b/i, slug: "no-whatsapp" },
  { re: /\bstatus\b/i, slug: "para-status" },
  // Bodas / idades comuns
  { re: /\bbodas de prata\b/i, slug: "bodas-de-prata-25-anos" },
  { re: /\bbodas de ouro\b/i, slug: "bodas-de-ouro-50-anos" },
  { re: /\bbodas de cristal\b/i, slug: "bodas-de-cristal-15-anos" },
  { re: /\b15 anos\b/i, slug: "de-15-anos" },
  { re: /\b18 anos\b/i, slug: "de-18-anos" },
  { re: /\b30 anos\b/i, slug: "de-30-anos" },
  { re: /\b40 anos\b/i, slug: "de-40-anos" },
  { re: /\b50 anos\b/i, slug: "de-50-anos" },
];

/** Faixas do texto onde nao se deve inserir link. */
function faixasProtegidas(texto: string): Array<[number, number]> {
  const faixas: Array<[number, number]> = [];
  const push = (re: RegExp) => {
    for (const m of texto.matchAll(re)) {
      if (m.index !== undefined) faixas.push([m.index, m.index + m[0].length]);
    }
  };
  push(/^#{1,6} .*$/gm); // headings
  push(/\[[^\]]*\]\([^)]*\)/g); // links markdown ja existentes
  push(/```[\s\S]*?```/g); // blocos de codigo
  push(/`[^`]*`/g); // codigo inline
  push(/^\s*>.*$/gm); // citacoes
  return faixas;
}

function protegido(pos: number, faixas: Array<[number, number]>): boolean {
  return faixas.some(([a, b]) => pos >= a && pos < b);
}

async function main() {
  console.log(`[autolink] dry=${DRY} max_links_por_post=${MAX_LINKS}`);

  const clusters = await prisma.cluster.findMany({
    where: { ativo: true },
    select: { slug: true, nicho: { select: { slug: true } } },
  });
  const urlDe = new Map(clusters.map((c) => [c.slug, `${SITE}/${c.nicho.slug}/${c.slug}/`]));

  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, slug: true, conteudo: true },
  });

  let tocados = 0;
  let linksTotal = 0;

  for (const post of posts) {
    let texto = post.conteudo;
    const jaTem = (texto.match(/\/mensagem-de-aniversario\//g) ?? []).length;
    if (jaTem >= 3) continue; // post ja bem linkado (os gerados pelas pautas)

    const usados = new Set<string>();
    let inseridos = 0;

    for (const { re, slug } of TERMOS) {
      if (inseridos >= MAX_LINKS) break;
      if (usados.has(slug)) continue;
      const url = urlDe.get(slug);
      if (!url) continue;
      if (texto.includes(url)) continue; // ja linkado em outro ponto

      // recalcula as faixas a cada insercao: os offsets mudam
      const faixas = faixasProtegidas(texto);
      const m = re.exec(texto);
      re.lastIndex = 0;
      if (!m || m.index === undefined) continue;
      if (protegido(m.index, faixas)) continue;

      const termo = m[0];
      texto = texto.slice(0, m.index) + `[${termo}](${url})` + texto.slice(m.index + termo.length);
      usados.add(slug);
      inseridos++;
    }

    if (inseridos === 0) continue;
    tocados++;
    linksTotal += inseridos;
    console.log(`  ${post.slug}: +${inseridos} links (${[...usados].join(", ")})`);

    if (!DRY) {
      await prisma.post.update({ where: { id: post.id }, data: { conteudo: texto } });
    }
  }

  console.log(`\n[autolink] ${tocados} posts tocados, ${linksTotal} links inseridos`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
