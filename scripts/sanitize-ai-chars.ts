/**
 * Sanitiza fingerprints AI + Markdown residuais.
 * Uses Unicode escapes pra evitar esbuild parsing issues.
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

const REPLACEMENTS: Array<[RegExp, string]> = [
  [new RegExp("—", "g"), "-"],              // em dash
  [new RegExp("–", "g"), "-"],              // en dash
  [new RegExp("[‘’]", "g"), "'"],      // smart single
  [new RegExp("[“”]", "g"), '"'],      // smart double
  [new RegExp("…", "g"), "..."],            // ellipsis
  [new RegExp("[​-‍﻿]", "g"), ""], // zero-width
  [new RegExp(" ", "g"), " "],              // NBSP
  [new RegExp(" ", "g"), "\n"],             // LINE SEPARATOR
  [new RegExp(" ", "g"), "\n\n"],           // PARAGRAPH SEPARATOR
  [new RegExp("→", "g"), "-"],              // arrow →
  [new RegExp("➤", "g"), "-"],              // arrow ➤
  [new RegExp("▶", "g"), "-"],              // arrow ▶
  [new RegExp("✨", "g"), ""],               // sparkles ✨
  [new RegExp("«|»", "g"), '"'],       // « »
];

const MD_LINK = /\[([^\]]+)\]\([^)]+\)/g;
const MD_BOLD = /\*\*([^*]+)\*\*/g;
const MD_ITALIC = /(?<!\*)\*([^*\n]+)\*(?!\*)/g;
const MD_UBOLD = /__([^_]+)__/g;

function sanitize(text: string | null): { text: string | null; changes: number } {
  if (text == null) return { text: null, changes: 0 };
  let result = text;
  let changes = 0;
  for (const [from, to] of REPLACEMENTS) {
    const matches = result.match(from);
    if (matches) {
      changes += matches.length;
      result = result.replace(from, to);
    }
  }
  for (const re of [MD_LINK, MD_BOLD, MD_ITALIC, MD_UBOLD]) {
    const matches = result.match(re);
    if (matches) {
      changes += matches.length;
      result = result.replace(re, "$1");
    }
  }
  return { text: result, changes };
}

interface Args { dryRun: boolean; limit?: number; }

function parseArgs(argv: string[]): Args {
  const out: Args = { dryRun: false };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    if (m[1] === "dry-run") out.dryRun = true;
    if (m[1] === "limit") out.limit = Number(m[2]);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Sanitize AI chars | dryRun=${args.dryRun}`);
  const totals = { mensagens: 0, posts: 0, editoriais: 0, clusters: 0, changesTotal: 0 };

  const mensagens = await prisma.mensagem.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, titulo: true, conteudo: true, resumo: true, metaTitle: true, metaDescription: true },
    take: args.limit,
  });
  console.log(`Mensagens: ${mensagens.length}`);
  for (const m of mensagens) {
    const r = {
      titulo: sanitize(m.titulo),
      conteudo: sanitize(m.conteudo),
      resumo: sanitize(m.resumo),
      metaTitle: sanitize(m.metaTitle),
      metaDescription: sanitize(m.metaDescription),
    };
    const t = r.titulo.changes + r.conteudo.changes + r.resumo.changes + r.metaTitle.changes + r.metaDescription.changes;
    if (t > 0) {
      if (!args.dryRun) {
        await prisma.mensagem.update({
          where: { id: m.id },
          data: {
            titulo: r.titulo.text ?? m.titulo,
            conteudo: r.conteudo.text ?? m.conteudo,
            resumo: r.resumo.text,
            metaTitle: r.metaTitle.text,
            metaDescription: r.metaDescription.text,
          },
        });
      }
      totals.mensagens++;
      totals.changesTotal += t;
    }
  }
  console.log(`  fixed: ${totals.mensagens}`);

  const posts = await prisma.post.findMany({
    select: { id: true, titulo: true, conteudo: true, resumo: true, metaTitle: true, metaDescription: true },
  });
  console.log(`Posts: ${posts.length}`);
  for (const p of posts) {
    const r = {
      titulo: sanitize(p.titulo),
      conteudo: sanitize(p.conteudo),
      resumo: sanitize(p.resumo),
      metaTitle: sanitize(p.metaTitle),
      metaDescription: sanitize(p.metaDescription),
    };
    const t = r.titulo.changes + r.conteudo.changes + r.resumo.changes + r.metaTitle.changes + r.metaDescription.changes;
    if (t > 0) {
      if (!args.dryRun) {
        await prisma.post.update({
          where: { id: p.id },
          data: {
            titulo: r.titulo.text ?? p.titulo,
            conteudo: r.conteudo.text ?? p.conteudo,
            resumo: r.resumo.text,
            metaTitle: r.metaTitle.text,
            metaDescription: r.metaDescription.text,
          },
        });
      }
      totals.posts++;
      totals.changesTotal += t;
    }
  }
  console.log(`  fixed: ${totals.posts}`);

  const eds = await prisma.clusterEditorial.findMany({});
  console.log(`Editoriais: ${eds.length}`);
  for (const e of eds) {
    const r = {
      introHero: sanitize(e.introHero),
      resumoEditorial: sanitize(e.resumoEditorial),
      fechamento: sanitize(e.fechamento),
      faqTexto: sanitize(e.faqTexto),
    };
    const t = r.introHero.changes + r.resumoEditorial.changes + r.fechamento.changes + r.faqTexto.changes;
    if (t > 0) {
      if (!args.dryRun) {
        await prisma.clusterEditorial.update({
          where: { clusterId: e.clusterId },
          data: {
            introHero: r.introHero.text,
            resumoEditorial: r.resumoEditorial.text,
            fechamento: r.fechamento.text,
            faqTexto: r.faqTexto.text,
          },
        });
      }
      totals.editoriais++;
      totals.changesTotal += t;
    }
  }
  console.log(`  fixed: ${totals.editoriais}`);

  const clusters = await prisma.cluster.findMany({
    select: { id: true, descricao: true, intro: true, metaTitle: true, metaDesc: true },
  });
  console.log(`Clusters: ${clusters.length}`);
  for (const c of clusters) {
    const r = {
      descricao: sanitize(c.descricao),
      intro: sanitize(c.intro),
      metaTitle: sanitize(c.metaTitle),
      metaDesc: sanitize(c.metaDesc),
    };
    const t = r.descricao.changes + r.intro.changes + r.metaTitle.changes + r.metaDesc.changes;
    if (t > 0) {
      if (!args.dryRun) {
        await prisma.cluster.update({
          where: { id: c.id },
          data: {
            descricao: r.descricao.text,
            intro: r.intro.text,
            metaTitle: r.metaTitle.text,
            metaDesc: r.metaDesc.text,
          },
        });
      }
      totals.clusters++;
      totals.changesTotal += t;
    }
  }
  console.log(`  fixed: ${totals.clusters}`);

  console.log(`${"=".repeat(60)}`);
  console.log(`${args.dryRun ? "(dry-run) " : "OK "}changes=${totals.changesTotal} | M=${totals.mensagens} P=${totals.posts} E=${totals.editoriais} C=${totals.clusters}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
