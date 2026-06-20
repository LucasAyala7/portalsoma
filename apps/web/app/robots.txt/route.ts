export const runtime = "nodejs";
export const revalidate = 86400;

/**
 * robots.txt customizado — sobrescreve o CF "Managed Content" default.
 *
 * Política Portal Soma:
 *  - Search engines (Google, Bing, DuckDuckGo): allow tudo (exceto admin/api)
 *  - Search AI bots (GPTBot, ClaudeBot, Google-Extended, PerplexityBot):
 *    allow → presença em AI Overviews / ChatGPT Search / Perplexity / Claude
 *  - Training crawlers (CCBot, Bytespider) + Amazonbot: disallow → não vira dataset bruto
 *  - Markdown endpoints (/<url>.md) e llms.txt explicitamente permitidos
 *
 * Estratégia GEO: queremos citation, não dataset training.
 */
export async function GET() {
  const txt = `# Portal Soma — robots.txt
# Política de crawling: permite indexação + citation em AI search, bloqueia training de dataset.
# Última atualização: ${new Date().toISOString().slice(0, 10)}

# ─── Search engines tradicionais ──────────────────────────────────────────
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Applebot
Allow: /

# ─── AI search/citation bots — LIBERADOS (queremos aparecer em respostas LLM) ──
# OpenAI (ChatGPT search / SearchGPT)
User-agent: OAI-SearchBot
Allow: /

User-agent: GPTBot
Allow: /
Disallow: /admin/
Disallow: /api/

# Anthropic (Claude search / web tools)
User-agent: ClaudeBot
Allow: /
Disallow: /admin/
Disallow: /api/

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /

# Google AI (Gemini, AI Overviews)
User-agent: Google-Extended
Allow: /

# Perplexity
User-agent: PerplexityBot
Allow: /

# Meta AI (WhatsApp AI, Meta search)
User-agent: meta-externalagent
Allow: /

User-agent: FacebookBot
Allow: /

# Apple (Siri, Spotlight)
User-agent: Applebot-Extended
Allow: /

# ─── Training-only crawlers — bloqueados (não viramos dataset bruto) ────
User-agent: CCBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Amazonbot
Disallow: /

User-agent: cohere-ai
Disallow: /

User-agent: Diffbot
Disallow: /

User-agent: ImagesiftBot
Disallow: /

User-agent: omgili
Disallow: /

User-agent: PetalBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

# ─── Default — tudo o resto: allow básico ────────────────────────────────
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /_next/

# Sitemaps
Sitemap: https://www.portalsoma.com.br/sitemap.xml

# LLM manifest
# /llms.txt — descrição estruturada do site + endpoints markdown
`;
  return new Response(txt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
