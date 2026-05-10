/**
 * Mapeia as 6.969 URLs do WP em 4 buckets baseado em GSC + slug match.
 *
 * Inputs:
 *   - inputs/wp-export/Posts-Export-2026-May-08-1250.csv (ID, Title, Permalink) — 6.969 posts
 *   - inputs/wp-export/srcniver.xlsx (URL, Cliques, Impressões) — 749 URLs com tráfego
 *
 * Output:
 *   - inputs/wp-export/buckets.csv  → relatório completo
 *   - inputs/wp-export/redirects.csv → mapa 301
 *   - inputs/wp-export/gone.csv     → URLs pra 410
 *   - inputs/wp-export/keep.csv     → URLs reescritas (bucket A+B)
 *
 * Buckets:
 *   A. KEEP+REWRITE  — top 30 cliques GSC → 301 pra URL nova + reescrita IA
 *   B. SAVE-EQUITY   — 31..85 com cliques>0 → 301 pro cluster pai mais próximo
 *   C. EVALUATE      — sem cliques mas >100 impressões → tenta match cluster, senão 410
 *   D. GONE-410      — resto (~95% das 6.969) → 410 (limpa índice Google)
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { prisma } from "@nivertotal/db";

interface WpPost {
  id: string;
  title: string;
  permalink: string;
  slug: string;
  oldCategory: string | null;
}

interface GscRow {
  url: string;
  cliques: number;
  impressoes: number;
}

type Bucket = "A_KEEP" | "B_SAVE" | "C_EVAL" | "D_GONE";

interface Mapped {
  oldUrl: string;
  oldId: string;
  oldTitle: string;
  oldCategory: string | null;
  oldSlug: string;
  cliques: number;
  impressoes: number;
  bucket: Bucket;
  newUrl: string | null; // 301 destination, null = 410
  reason: string;
}

// Mapeia categoria WP antiga → cluster slug novo
// (incrementado com novos clusters do GSC)
const CAT_MAP: Record<string, string> = {
  // família
  avo: "para-avo",
  avos: "para-avo",
  pai: "para-pai",
  mae: "para-mae",
  filho: "para-filho",
  filha: "para-filha",
  filhos: "para-filho",
  filhas: "para-filha",
  irma: "para-irma",
  irmao: "para-irmao",
  irmaos: "para-irmao",
  sobrinho: "para-sobrinho",
  sobrinha: "para-sobrinha",
  neta: "para-neta",
  neto: "para-neto",
  netos: "para-neto",
  primo: "para-prima",
  prima: "para-prima",
  tio: "para-tio",
  tia: "para-tia",
  afilhada: "para-afilhada",
  afilhado: "para-afilhado",
  madrinha: "para-madrinha",
  padrinho: "para-padrinho",
  sogra: "para-sogra",
  sogro: "para-sogro",
  nora: "para-nora",
  genro: "para-genro",
  cunhada: "para-cunhada",
  cunhado: "para-cunhado",
  comadre: "para-comadre",
  compadre: "para-comadre",
  enteado: "para-enteado",
  enteada: "para-enteada",
  bisneto: "para-bisneto",
  bisneta: "para-bisneta",

  // amigos
  amigo: "para-amigo",
  amiga: "para-amiga",
  amigos: "para-amigo",
  amigas: "para-amiga",

  // amor
  marido: "para-marido",
  esposo: "para-marido",
  esposa: "para-esposa",
  namorado: "para-namorado",
  namorada: "para-namorada",
  namorados: "para-namorado",

  // trabalho
  chefe: "para-chefe",
  patrao: "para-chefe",
  cliente: "para-cliente",
  colega: "para-colega",
  professor: "para-colega",
  professora: "para-colega",

  // religiosos
  pastor: "para-pastor",
  pastora: "para-pastora",
  padre: "para-padre",

  // novos GSC
  idoso: "para-idoso",

  // tons
  evangelica: "evangelica",
  evangelicas: "evangelica",
  evangelico: "evangelica",
  evangelicos: "evangelica",
  biblica: "biblica",
  biblicas: "biblica",
  catolica: "catolica",
  catolicas: "catolica",
  gospel: "gospel",
  espirita: "espirita",
  crista: "crista",
  cristao: "crista",
  engracada: "engracada",
  engracado: "engracada",
  engracadas: "engracada",
  curta: "curta",
  curtas: "curta",
  simples: "simples",
  bonita: "bonita",
  reflexiva: "reflexiva",
  romantica: "romantica",
  romanticas: "romantica",
  milagre: "milagre",
  perdao: "perdao",
  resiliencia: "resiliencia",
  gratidao: "gratidao",

  // canais
  whatsapp: "no-whatsapp",
  status: "para-status",

  // idades
  "10-anos": "de-10-anos-de-namoro", // 10 anos no WP era ambíguo — GSC mostra que era namoro 10a
  "15-anos": "de-15-anos",
  "18-anos": "de-18-anos",
  "20-anos": "de-25-anos", // aproximação
  "25-anos": "de-25-anos",
  "30-anos": "de-30-anos",
  "35-anos": "de-35-anos",
  "40-anos": "de-40-anos",
  "45-anos": "de-45-anos",
  "50-anos": "de-50-anos",
  "55-anos": "de-50-anos",
  "60-anos": "de-60-anos",
  "65-anos": "de-65-anos",
  "70-anos": "de-70-anos",
  "75-anos": "de-75-anos",
  "80-anos": "de-80-anos",
  "85-anos": "de-80-anos",
  "90-anos": "de-90-anos",
  "95-anos": "de-95-anos",
  "100-anos": "de-100-anos",

  // namoro tempo
  "1-ano-de-namoro": "de-1-ano-de-namoro",
  "2-anos-de-namoro": "de-2-anos-de-namoro",
  "3-anos-de-namoro": "de-3-anos-de-namoro",
  "4-anos-de-namoro": "de-4-anos-de-namoro",
  "5-anos-de-namoro": "de-5-anos-de-namoro",
  "6-anos-de-namoro": "de-6-anos-de-namoro",
  "7-anos-de-namoro": "de-7-anos-de-namoro",
  "8-anos-de-namoro": "de-8-anos-de-namoro",
  "10-anos-de-namoro": "de-10-anos-de-namoro",
  "namoro-de-10-anos": "de-10-anos-de-namoro",

  // amizade tempo
  "1-ano-de-amizade": "de-1-ano-de-amizade",
  "2-anos-de-amizade": "de-2-anos-de-amizade",
  "3-anos-de-amizade": "de-3-anos-de-amizade",
  "4-anos-de-amizade": "de-4-anos-de-amizade",
  "5-anos-de-amizade": "de-5-anos-de-amizade",
  "10-anos-de-amizade": "de-10-anos-de-amizade",

  // mesversário
  "1-mes": "de-1-mes",
  "3-meses": "de-3-meses",
  "6-meses": "de-6-meses",
  "9-meses": "de-9-meses",
  "10-meses": "de-10-meses",
  "12-meses": "de-12-meses",

  // bodas
  "bodas-de-prata": "bodas-de-prata-25-anos",
  "bodas-de-ouro": "bodas-de-ouro-50-anos",
  "bodas-de-estanho": "bodas-de-estanho-10-anos",
  "bodas-de-cristal": "bodas-de-cristal-15-anos",
  "bodas-de-esmeralda": "bodas-de-esmeralda-35-anos",
  "bodas-de-flores": "bodas-de-flores-4-anos",
  "bodas-de-pinho": "bodas-de-pinho-32-anos",

  // novos GSC sem mapping anterior
  homem: "para-homem",
  lider: "para-lider",
  coragem: "coragem",
  abencoada: "abencoada",

  // bodas completas
  "bodas-de-papel": "bodas-de-papel-1-ano",
  "bodas-de-madeira": "bodas-de-madeira-5-anos",
  "bodas-de-bronze": "bodas-de-bronze-8-anos",
  "bodas-de-perola": "bodas-de-perola-30-anos",
  "bodas-de-rubi": "bodas-de-rubi-40-anos",
  "10-anos-de-casamento": "bodas-de-estanho-10-anos",
  "casamento-de-5-anos": "bodas-de-madeira-5-anos",
  "20-anos-de-relacionamento": "de-20-anos-de-relacionamento",

  // outros
  especial: "para-amiga", // ambíguo — manda pra para-amiga (top volume)
};

function parsePermalink(permalink: string): { slug: string; cat: string | null } {
  const m = permalink.match(/\/mensagem-de-aniversario\/([^/]+)\/(?:([^/]+)\/?)?/);
  if (!m) return { slug: "", cat: null };
  const cat = m[1] ?? null;
  const slug = m[2] ?? m[1] ?? "";
  return { slug, cat };
}

function pathFromUrl(url: string): string {
  return url.replace(/^https?:\/\/[^/]+/, "");
}

async function main() {
  const inputDir = resolve(__dirname, "..", "..", "inputs", "wp-export");

  // === Carrega WP CSV ===
  const csvBuf = await readFile(resolve(inputDir, "Posts-Export-2026-May-08-1250.csv"), "utf-8");
  const wpRows: { ID: string; Title: string; Permalink: string }[] = parse(csvBuf, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });
  const wpPosts: WpPost[] = wpRows.map((r) => {
    const { slug, cat } = parsePermalink(r.Permalink);
    return {
      id: r.ID,
      title: r.Title,
      permalink: r.Permalink,
      slug,
      oldCategory: cat,
    };
  });
  console.log(`📦 ${wpPosts.length} posts WP carregados`);

  // === Carrega GSC XLSX ===
  const xlsxBuf = await readFile(resolve(inputDir, "srcniver.xlsx"));
  const wb = XLSX.read(xlsxBuf);
  const sheet = wb.Sheets[wb.SheetNames[0]!]!;
  const gscRaw = XLSX.utils.sheet_to_json<{ "Páginas principais"?: string; URL?: string; Cliques?: number; Impressões?: number; Impressoes?: number }>(sheet);
  const gscMap = new Map<string, GscRow>();
  for (const r of gscRaw) {
    const url = (r["Páginas principais"] ?? r.URL ?? "").toString();
    if (!url) continue;
    const path = pathFromUrl(url);
    gscMap.set(path, {
      url: path,
      cliques: Number(r.Cliques ?? 0),
      impressoes: Number(r.Impressões ?? r.Impressoes ?? 0),
    });
  }
  console.log(`📊 ${gscMap.size} URLs GSC com tráfego`);

  // === Carrega clusters do DB pra validar destinos ===
  const clusters = await prisma.cluster.findMany({
    where: { ativo: true },
    select: { slug: true },
  });
  const clusterSlugs = new Set(clusters.map((c) => c.slug));
  console.log(`✅ ${clusterSlugs.size} clusters ativos no DB\n`);

  // === Ordena GSC por cliques pra identificar top 30 / 85 ===
  const gscSorted = [...gscMap.values()].sort((a, b) => b.cliques - a.cliques);
  const top30Paths = new Set(gscSorted.slice(0, 30).filter((r) => r.cliques > 0).map((r) => r.url));
  const top85Paths = new Set(gscSorted.slice(0, 85).filter((r) => r.cliques > 0).map((r) => r.url));

  // === Mapeia ===
  const mapped: Mapped[] = [];
  let countA = 0, countB = 0, countC = 0, countD = 0;

  for (const post of wpPosts) {
    const path = pathFromUrl(post.permalink);
    const gsc = gscMap.get(path);
    const cliques = gsc?.cliques ?? 0;
    const impressoes = gsc?.impressoes ?? 0;
    const oldCat = post.oldCategory;
    const newClusterSlug = oldCat ? CAT_MAP[oldCat] : null;
    const clusterValido = newClusterSlug && clusterSlugs.has(newClusterSlug);

    let bucket: Bucket;
    let newUrl: string | null = null;
    let reason: string;

    if (top30Paths.has(path)) {
      // BUCKET A — top 30 cliques: 301 pra URL nova com mesmo slug + cluster mapeado
      bucket = "A_KEEP";
      countA++;
      if (clusterValido) {
        // 301 mantém slug original, só remapeia cluster pra novo
        newUrl = `/mensagem-de-aniversario/${newClusterSlug}/${post.slug}/`;
        reason = `TOP30 cliques (${cliques}) → preserva slug, novo cluster ${newClusterSlug}`;
      } else {
        // sem cluster mapeado → 301 pro cluster genérico mais próximo (slug match heurístico)
        newUrl = `/mensagem-de-aniversario/${oldCat ?? "para-amiga"}/`;
        reason = `TOP30 mas sem cluster mapeado pra "${oldCat}" — 301 pra raiz do cluster antigo`;
      }
    } else if (top85Paths.has(path)) {
      // BUCKET B — 31-85 com cliques: 301 pro cluster pai (perde slug específico)
      bucket = "B_SAVE";
      countB++;
      if (clusterValido) {
        newUrl = `/mensagem-de-aniversario/${newClusterSlug}/`;
        reason = `B_SAVE (${cliques} cliques) → 301 cluster ${newClusterSlug}`;
      } else {
        bucket = "D_GONE";
        countD++;
        countB--;
        reason = `B_SAVE mas cluster "${oldCat}" não mapeado → 410`;
      }
    } else if (impressoes >= 100 && clusterValido) {
      // BUCKET C — sem cliques mas com >=100 impressões e cluster mapeado: 301 pro cluster
      bucket = "C_EVAL";
      countC++;
      newUrl = `/mensagem-de-aniversario/${newClusterSlug}/`;
      reason = `C_EVAL (${impressoes} impr) → 301 cluster ${newClusterSlug}`;
    } else {
      // BUCKET D — resto: 410 GONE
      bucket = "D_GONE";
      countD++;
      reason = cliques === 0 && impressoes < 100 ? `sem tráfego (${impressoes} impr)` : `cluster "${oldCat}" não mapeado`;
    }

    mapped.push({
      oldUrl: path,
      oldId: post.id,
      oldTitle: post.title,
      oldCategory: oldCat,
      oldSlug: post.slug,
      cliques,
      impressoes,
      bucket,
      newUrl,
      reason,
    });
  }

  // === Outputs ===
  function csvEscape(v: unknown): string {
    const s = String(v ?? "");
    return `"${s.replace(/"/g, '""')}"`;
  }
  function csvLine(row: (string | number | null)[]): string {
    return row.map(csvEscape).join(",");
  }

  const header = csvLine(["oldUrl", "oldId", "oldTitle", "oldCategory", "oldSlug", "cliques", "impressoes", "bucket", "newUrl", "reason"]);
  const rows = mapped.map((m) =>
    csvLine([m.oldUrl, m.oldId, m.oldTitle, m.oldCategory, m.oldSlug, m.cliques, m.impressoes, m.bucket, m.newUrl, m.reason]),
  );
  await writeFile(resolve(inputDir, "buckets.csv"), [header, ...rows].join("\n"), "utf-8");

  const redirects = mapped.filter((m) => m.bucket !== "D_GONE" && m.newUrl);
  const redirectsHeader = csvLine(["oldUrl", "newUrl", "bucket", "cliques"]);
  const redirectsRows = redirects.map((m) => csvLine([m.oldUrl, m.newUrl, m.bucket, m.cliques]));
  await writeFile(resolve(inputDir, "redirects.csv"), [redirectsHeader, ...redirectsRows].join("\n"), "utf-8");

  const gone = mapped.filter((m) => m.bucket === "D_GONE");
  await writeFile(
    resolve(inputDir, "gone.csv"),
    [csvLine(["oldUrl", "reason"]), ...gone.map((m) => csvLine([m.oldUrl, m.reason]))].join("\n"),
    "utf-8",
  );

  const keep = mapped.filter((m) => m.bucket === "A_KEEP");
  await writeFile(
    resolve(inputDir, "keep.csv"),
    [csvLine(["oldUrl", "newUrl", "oldTitle", "cliques", "impressoes"]), ...keep.map((m) => csvLine([m.oldUrl, m.newUrl, m.oldTitle, m.cliques, m.impressoes]))].join("\n"),
    "utf-8",
  );

  console.log(`\n=== RESULTADO ===`);
  console.log(`A_KEEP  (top30 cliques, reescreve)  : ${countA}`);
  console.log(`B_SAVE  (31-85 cliques, 301 cluster): ${countB}`);
  console.log(`C_EVAL  (impr ≥100, 301 cluster)    : ${countC}`);
  console.log(`D_GONE  (410 GONE)                  : ${countD}`);
  console.log(`TOTAL                               : ${mapped.length}`);
  console.log(`\n📁 Arquivos gerados em ${inputDir}:`);
  console.log(`   buckets.csv      relatório completo`);
  console.log(`   redirects.csv    mapa 301 (${redirects.length} URLs)`);
  console.log(`   gone.csv         410 GONE (${gone.length} URLs)`);
  console.log(`   keep.csv         A_KEEP pra reescrita (${keep.length} URLs)`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
