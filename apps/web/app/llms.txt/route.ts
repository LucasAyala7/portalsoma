import { prisma } from "@nivertotal/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // evita pre-render no build (Postgres unavailable at build time)
export const revalidate = 86400;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.portalsoma.com.br";

/**
 * llms.txt · manifest pra LLM crawlers (Anthropic, OpenAI, Google AI, Perplexity).
 * Convenção: https://llmstxt.org/
 *
 * Descreve o site + lista de endpoints markdown disponíveis pra ingest.
 */
export async function GET() {
  const [totalMsgs, totalCats, topClusters, topMensagens] = await Promise.all([
    prisma.mensagem.count({ where: { status: "PUBLISHED" } }),
    prisma.cluster.count({ where: { ativo: true } }),
    prisma.cluster.findMany({
      where: { ativo: true },
      orderBy: { volumeMensal: "desc" },
      take: 20,
      select: { slug: true, nome: true, nicho: { select: { slug: true } } },
    }),
    prisma.mensagem.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { likes: "desc" },
      take: 30,
      select: {
        slug: true,
        titulo: true,
        cluster: { select: { slug: true, nicho: { select: { slug: true } } } },
      },
    }),
  ]);

  const txt = `# Portal Soma

> Curadoria editorial brasileira de mensagens de aniversário. ${totalMsgs.toLocaleString("pt-BR")} mensagens curadas em ${totalCats} categorias · organizadas por destinatário (mãe, pai, amiga, marido…), ocasião (15 anos, bodas, póstuma…), tom (bíblica, romântica, engraçada…) e canal (status, WhatsApp).

Cada mensagem traz autoria declarada · autores humanos e personas editoriais com voz própria. Conteúdo em português brasileiro, atualização contínua semanal.

## Site
- URL: ${SITE_URL}
- Idioma: pt-BR
- Licença: conteúdo proprietário Portal Soma · citação com atribuição permitida

## Estrutura principal
- [/](${SITE_URL}/) · home com mensagens em destaque
- [/mensagem-de-aniversario/](${SITE_URL}/mensagem-de-aniversario/) · índice completo de categorias
- [/autor/](${SITE_URL}/autor/) · autores e personas editoriais
- [/blog/](${SITE_URL}/blog/) · artigos editoriais sobre aniversário, etiqueta e celebrações
- [/buscar/](${SITE_URL}/buscar/) · busca por palavra-chave

## Categorias principais
${topClusters
  .map((c) => `- [${c.nome}](${SITE_URL}/${c.nicho.slug}/${c.slug}/) · mensagens de aniversário ${c.nome.toLowerCase()}`)
  .join("\n")}

## Mensagens mais curtidas
${topMensagens
  .map(
    (m) =>
      `- [${m.titulo}](${SITE_URL}/${m.cluster.nicho.slug}/${m.cluster.slug}/${m.slug}/)`,
  )
  .join("\n")}

## Endpoint markdown
Cada URL HTML tem versão markdown via prefixo \`/m/\`:
- Exemplo: ${SITE_URL}/m/mensagem-de-aniversario/para-mae/
- Exemplo: ${SITE_URL}/m/mensagem-de-aniversario/para-mae/feliz-aniversario-mae/

Endpoints retornam text/markdown · sem HTML/JS/CSS overhead · ideal pra ingest direto em LLM.

## Política
- Citação com atribuição: bem-vinda
- Reprodução em massa sem link: não autorizada
- Treinamento de modelos: ver robots.txt (Content-Signal)
- Contato: lucasayalla@gmail.com
`;

  return new Response(txt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
