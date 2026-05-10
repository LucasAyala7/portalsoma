/**
 * Crawl HTTP das URLs com tráfego do WordPress legado (nivertotal.com.br)
 * pra extrair título, body e meta description em JSON.
 *
 * Fontes:
 *   - inputs/wp-export/redirects.csv  (todas as URLs — coluna oldUrl)
 *   - inputs/wp-export/categorias.csv (apenas cliques > 0 — coluna oldUrl)
 *
 * Output:
 *   - inputs/wp-export/crawled-content.json
 *
 * Uso (de packages/db):
 *   npx tsx ../../scripts/crawl-wp-content.ts
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";

// Aceita certificado SSL inválido (WP legado as vezes tem chain quebrada)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const BASE = "https://nivertotal.com.br";
const SLEEP_MS = 300;
const TIMEOUT_MS = 20000;

type CrawledEntry = {
  oldUrl: string;
  title: string;
  bodyText: string;
  metaDescription: string;
  wordCount: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&aacute;/g, "á")
    .replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&atilde;/g, "ã")
    .replace(/&otilde;/g, "õ")
    .replace(/&ccedil;/g, "ç")
    .replace(/&Aacute;/g, "Á")
    .replace(/&Eacute;/g, "É")
    .replace(/&Iacute;/g, "Í")
    .replace(/&Oacute;/g, "Ó")
    .replace(/&Uacute;/g, "Ú")
    .replace(/&Atilde;/g, "Ã")
    .replace(/&Otilde;/g, "Õ")
    .replace(/&Ccedil;/g, "Ç")
    .replace(/&bull;/g, "•")
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripTags(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(html: string, regex: RegExp): string {
  const m = html.match(regex);
  return m ? m[1] : "";
}

function extractTitle(html: string): string {
  const t = extractTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  if (t) return decodeHtmlEntities(stripTags(t));
  const h1 = extractTag(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return decodeHtmlEntities(stripTags(h1));
}

function extractMetaDescription(html: string): string {
  // tenta name="description" primeiro, depois property="og:description"
  let m = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  if (!m) m = html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  if (!m) m = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);
  if (!m) m = html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/i);
  return m ? decodeHtmlEntities(m[1]) : "";
}

function extractBody(html: string): string {
  // Tema custom do Niver Total: a mensagem fica em <div class="js-message-text ...">
  // Em páginas de post (single) há UMA; em páginas de categoria há VÁRIAS (concatena todas).
  const messages: string[] = [];
  const rx = /<div[^>]*class=["'][^"']*\bjs-message-text\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(html)) !== null) {
    const text = decodeHtmlEntities(stripTags(m[1])).trim();
    if (text.length > 10) messages.push(text);
  }
  if (messages.length) return messages.join("\n\n");

  // Fallbacks (caso o tema mude): entry-content / post-content / article / main
  const candidates = [
    /<div[^>]*class=["'][^"']*\bentry-content\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/article>/i,
    /<div[^>]*class=["'][^"']*\bentry-content\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<footer/i,
    /<div[^>]*class=["'][^"']*\bpost-content\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
  ];
  for (const rx2 of candidates) {
    const mm = html.match(rx2);
    if (mm) {
      const text = decodeHtmlEntities(stripTags(mm[1])).trim();
      if (text.length > 50) return text;
    }
  }
  const body = extractTag(html, /<body[^>]*>([\s\S]*?)<\/body>/i);
  return decodeHtmlEntities(stripTags(body));
}

async function fetchWithTimeout(url: string): Promise<{ ok: boolean; status: number; html: string }> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NiverTotalCrawler/1.0; +https://nivertotal.com.br) Chrome/120.0.0.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });
    const html = res.ok ? await res.text() : "";
    return { ok: res.ok, status: res.status, html };
  } catch (e: any) {
    return { ok: false, status: 0, html: "" };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const inputDir = resolve(__dirname, "..", "..", "inputs", "wp-export");
  const outFile = resolve(inputDir, "crawled-content.json");

  // 1. Coleta URLs únicas
  const urls = new Set<string>();

  const redirectsBuf = await readFile(resolve(inputDir, "redirects.csv"), "utf-8");
  const redirectRows: { oldUrl: string }[] = parse(redirectsBuf, {
    columns: true,
    skip_empty_lines: true,
  });
  for (const r of redirectRows) if (r.oldUrl) urls.add(r.oldUrl);
  const redirectCount = urls.size;

  const categoriasBuf = await readFile(resolve(inputDir, "categorias.csv"), "utf-8");
  const catRows: { oldUrl: string; cliques: string }[] = parse(categoriasBuf, {
    columns: true,
    skip_empty_lines: true,
  });
  let catWithClicks = 0;
  for (const r of catRows) {
    if (r.oldUrl && parseInt(r.cliques || "0", 10) > 0) {
      urls.add(r.oldUrl);
      catWithClicks++;
    }
  }

  const list = Array.from(urls);
  console.log(`📋 URLs a crawlear: ${list.length} (redirects: ${redirectCount}, categorias c/ cliques: ${catWithClicks})`);
  console.log(`🌐 Base: ${BASE}\n`);

  // 2. Crawl
  const results: CrawledEntry[] = [];
  let okCount = 0;
  let failCount = 0;
  const failures: { url: string; reason: string }[] = [];

  for (let i = 0; i < list.length; i++) {
    const oldUrl = list[i];
    const fullUrl = BASE + oldUrl;
    const tag = `[${i + 1}/${list.length}]`;
    process.stdout.write(`${tag} ${oldUrl} ... `);

    const { ok, status, html } = await fetchWithTimeout(fullUrl);

    if (!ok) {
      console.log(`❌ ${status || "ERR"}`);
      failCount++;
      failures.push({ url: oldUrl, reason: status ? `HTTP ${status}` : "fetch error" });
      await sleep(SLEEP_MS);
      continue;
    }

    const title = extractTitle(html);
    const bodyText = extractBody(html);
    const metaDescription = extractMetaDescription(html);

    if (!bodyText || bodyText.length < 30) {
      console.log(`⚠️  body vazio (${bodyText.length} chars)`);
      failCount++;
      failures.push({ url: oldUrl, reason: "body vazio" });
      await sleep(SLEEP_MS);
      continue;
    }

    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
    results.push({ oldUrl, title, bodyText, metaDescription, wordCount });
    okCount++;
    console.log(`✓ ${wordCount} palavras`);

    await sleep(SLEEP_MS);
  }

  // 3. Salva JSON
  await writeFile(outFile, JSON.stringify(results, null, 2), "utf-8");

  // 4. Stats
  const totalWords = results.reduce((s, r) => s + r.wordCount, 0);
  const avgWords = results.length ? Math.round(totalWords / results.length) : 0;

  console.log(`\n=== RESUMO ===`);
  console.log(`Total tentadas:   ${list.length}`);
  console.log(`OK:               ${okCount}`);
  console.log(`Falhas:           ${failCount}`);
  console.log(`Palavras médias:  ${avgWords}`);
  console.log(`Palavras totais:  ${totalWords}`);
  console.log(`Output:           ${outFile}`);

  if (failures.length) {
    console.log(`\n=== FALHAS (${failures.length}) ===`);
    for (const f of failures.slice(0, 20)) console.log(`  - ${f.url}  →  ${f.reason}`);
    if (failures.length > 20) console.log(`  ... +${failures.length - 20}`);
  }

  // 5. Amostras
  console.log(`\n=== AMOSTRAS (3) ===`);
  for (const sample of results.slice(0, 3)) {
    console.log(`\n→ ${sample.oldUrl}`);
    console.log(`  title:  ${sample.title}`);
    console.log(`  meta:   ${sample.metaDescription.slice(0, 120)}${sample.metaDescription.length > 120 ? "..." : ""}`);
    console.log(`  body:   ${sample.bodyText.slice(0, 200)}${sample.bodyText.length > 200 ? "..." : ""}`);
    console.log(`  words:  ${sample.wordCount}`);
  }
}

main().catch((e) => {
  console.error("❌ FATAL:", e);
  process.exit(1);
});
