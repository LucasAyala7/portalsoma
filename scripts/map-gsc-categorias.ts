/**
 * Identifica URLs GSC que NÃO estão no CSV de posts WP — são páginas de
 * categoria/listagem do site antigo. Mapeia cada uma pro cluster novo equivalente.
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { prisma } from "@nivertotal/db";

const CAT_MAP: Record<string, string> = {
  // (mesmo do outro script — copiei resumido)
  avo: "para-avo", pai: "para-pai", mae: "para-mae", filho: "para-filho", filha: "para-filha",
  filhos: "para-filho", irma: "para-irma", irmao: "para-irmao", sobrinho: "para-sobrinho",
  sobrinha: "para-sobrinha", neta: "para-neta", neto: "para-neto", primo: "para-prima",
  prima: "para-prima", tio: "para-tio", tia: "para-tia", afilhada: "para-afilhada",
  afilhado: "para-afilhado", madrinha: "para-madrinha", padrinho: "para-padrinho",
  sogra: "para-sogra", sogro: "para-sogro", nora: "para-nora", genro: "para-genro",
  cunhada: "para-cunhada", cunhado: "para-cunhado", comadre: "para-comadre",
  enteado: "para-enteado", enteada: "para-enteada", bisneto: "para-bisneto", bisneta: "para-bisneta",
  amigo: "para-amigo", amiga: "para-amiga", marido: "para-marido", esposa: "para-esposa",
  namorado: "para-namorado", namorada: "para-namorada", namorados: "para-namorado",
  chefe: "para-chefe", patrao: "para-chefe", cliente: "para-cliente", colega: "para-colega",
  professor: "para-colega", pastor: "para-pastor", padre: "para-padre", idoso: "para-idoso",
  evangelica: "evangelica", evangelicas: "evangelica", evangelico: "evangelica",
  evangelicos: "evangelica", biblica: "biblica", catolica: "catolica", gospel: "gospel",
  espirita: "espirita", crista: "crista", engracada: "engracada", engracado: "engracada",
  curta: "curta", simples: "simples", bonita: "bonita", reflexiva: "reflexiva",
  romantica: "romantica", milagre: "milagre", perdao: "perdao", resiliencia: "resiliencia",
  gratidao: "gratidao", whatsapp: "no-whatsapp", status: "para-status",
  "10-anos": "de-10-anos-de-namoro",
  "15-anos": "de-15-anos", "18-anos": "de-18-anos", "25-anos": "de-25-anos",
  "30-anos": "de-30-anos", "35-anos": "de-35-anos", "40-anos": "de-40-anos",
  "45-anos": "de-45-anos", "50-anos": "de-50-anos", "60-anos": "de-60-anos",
  "65-anos": "de-65-anos", "70-anos": "de-70-anos", "75-anos": "de-75-anos",
  "80-anos": "de-80-anos", "90-anos": "de-90-anos", "95-anos": "de-95-anos", "100-anos": "de-100-anos",
  "1-ano-de-namoro": "de-1-ano-de-namoro", "2-anos-de-namoro": "de-2-anos-de-namoro",
  "3-anos-de-namoro": "de-3-anos-de-namoro", "4-anos-de-namoro": "de-4-anos-de-namoro",
  "5-anos-de-namoro": "de-5-anos-de-namoro", "6-anos-de-namoro": "de-6-anos-de-namoro",
  "7-anos-de-namoro": "de-7-anos-de-namoro", "8-anos-de-namoro": "de-8-anos-de-namoro",
  "10-anos-de-namoro": "de-10-anos-de-namoro", "namoro-de-10-anos": "de-10-anos-de-namoro",
  "1-ano-de-amizade": "de-1-ano-de-amizade", "2-anos-de-amizade": "de-2-anos-de-amizade",
  "3-anos-de-amizade": "de-3-anos-de-amizade", "4-anos-de-amizade": "de-4-anos-de-amizade",
  "5-anos-de-amizade": "de-5-anos-de-amizade", "10-anos-de-amizade": "de-10-anos-de-amizade",
  "1-mes": "de-1-mes", "3-meses": "de-3-meses", "6-meses": "de-6-meses",
  "9-meses": "de-9-meses", "10-meses": "de-10-meses", "12-meses": "de-12-meses",
  "bodas-de-prata": "bodas-de-prata-25-anos", "bodas-de-ouro": "bodas-de-ouro-50-anos",
  "bodas-de-estanho": "bodas-de-estanho-10-anos", "bodas-de-cristal": "bodas-de-cristal-15-anos",
  "bodas-de-esmeralda": "bodas-de-esmeralda-35-anos", "bodas-de-flores": "bodas-de-flores-4-anos",
  "bodas-de-pinho": "bodas-de-pinho-32-anos", especial: "para-amiga",
  homem: "para-homem", lider: "para-lider", coragem: "coragem", abencoada: "abencoada",
  "bodas-de-papel": "bodas-de-papel-1-ano", "bodas-de-madeira": "bodas-de-madeira-5-anos",
  "bodas-de-bronze": "bodas-de-bronze-8-anos", "bodas-de-perola": "bodas-de-perola-30-anos",
  "bodas-de-rubi": "bodas-de-rubi-40-anos", "10-anos-de-casamento": "bodas-de-estanho-10-anos",
  "casamento-de-5-anos": "bodas-de-madeira-5-anos",
  "20-anos-de-relacionamento": "de-20-anos-de-relacionamento",
};

function pathFromUrl(url: string): string {
  return url.replace(/^https?:\/\/[^/]+/, "");
}

async function main() {
  const inputDir = resolve(__dirname, "..", "..", "inputs", "wp-export");

  // Carrega CSV de posts
  const csvBuf = await readFile(resolve(inputDir, "Posts-Export-2026-May-08-1250.csv"), "utf-8");
  const wpRows: { Permalink: string }[] = parse(csvBuf, { columns: true, skip_empty_lines: true, bom: true });
  const csvPaths = new Set(wpRows.map((r) => pathFromUrl(r.Permalink)));

  // Carrega GSC
  const xlsxBuf = await readFile(resolve(inputDir, "srcniver.xlsx"));
  const wb = XLSX.read(xlsxBuf);
  const sheet = wb.Sheets[wb.SheetNames[0]!]!;
  const gscRaw = XLSX.utils.sheet_to_json<{ "Páginas principais"?: string; Cliques?: number; Impressões?: number }>(sheet);

  // Pega clusters do DB
  const clusters = await prisma.cluster.findMany({ where: { ativo: true }, select: { slug: true } });
  const clusterSlugs = new Set(clusters.map((c) => c.slug));

  // Filtra GSC URLs que NÃO estão no CSV (= páginas de categoria/listagem)
  const categoryPages: { url: string; cliques: number; impressoes: number; cat: string | null; targetCluster: string | null; bucket: string }[] = [];
  for (const r of gscRaw) {
    const url = (r["Páginas principais"] ?? "").toString();
    if (!url) continue;
    const path = pathFromUrl(url);
    if (csvPaths.has(path)) continue; // é post individual

    const cliques = Number(r.Cliques ?? 0);
    const impressoes = Number(r.Impressões ?? 0);
    const m = path.match(/\/mensagem-de-aniversario\/([^/]+)\/?$/);
    const cat = m ? m[1] : null;
    const target = cat && CAT_MAP[cat] && clusterSlugs.has(CAT_MAP[cat]!) ? CAT_MAP[cat]! : null;
    const bucket = cliques > 0 ? "GSC_KEEP" : impressoes >= 100 ? "GSC_SAVE" : "GSC_GONE";
    categoryPages.push({ url: path, cliques, impressoes, cat, targetCluster: target, bucket });
  }

  categoryPages.sort((a, b) => b.cliques - a.cliques || b.impressoes - a.impressoes);

  console.log(`📊 ${categoryPages.length} URLs GSC que NÃO são posts (= páginas de categoria/listagem)`);
  console.log("\n=== TOP 50 categoria pages com cliques ===");
  for (const p of categoryPages.slice(0, 50)) {
    if (p.cliques === 0 && p.impressoes < 100) break;
    const status = p.targetCluster ? `→ ${p.targetCluster}` : `❌ "${p.cat}" sem mapping`;
    console.log(`  ${p.cliques.toString().padStart(4)} cliq · ${p.impressoes.toString().padStart(5)} imp · ${p.url.padEnd(60)} ${status}`);
  }

  // Salva CSV
  function csvEscape(v: unknown): string {
    return `"${String(v ?? "").replace(/"/g, '""')}"`;
  }
  const header = ["oldUrl", "cat", "cliques", "impressoes", "targetCluster", "bucket"].map(csvEscape).join(",");
  const rows = categoryPages.map((p) =>
    [p.url, p.cat, p.cliques, p.impressoes, p.targetCluster, p.bucket].map(csvEscape).join(","),
  );
  await writeFile(resolve(inputDir, "categorias.csv"), [header, ...rows].join("\n"), "utf-8");
  console.log(`\n💾 categorias.csv salvo com ${categoryPages.length} URLs`);

  const semMapping = categoryPages.filter((p) => !p.targetCluster && (p.cliques > 0 || p.impressoes >= 100));
  if (semMapping.length > 0) {
    console.log(`\n⚠ ${semMapping.length} URLs com tráfego SEM mapping no CAT_MAP — precisam mapear manualmente:`);
    for (const p of semMapping.slice(0, 20)) {
      console.log(`   "${p.cat}" — ${p.cliques} cliq · ${p.impressoes} imp · ${p.url}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
