import { prisma } from "@nivertotal/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.portalsoma.com.br";

/**
 * Endpoint markdown raw — GEO friendly pra LLM crawlers.
 *
 * Convenção: prefixar URL HTML com /m/ pra obter versão markdown.
 *   /mensagem-de-aniversario/para-mae/      → /m/mensagem-de-aniversario/para-mae/
 *   /mensagem-de-aniversario/para-mae/feliz/ → /m/mensagem-de-aniversario/para-mae/feliz/
 *
 * Retorna text/markdown com cache 24h.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const segments = path.filter(Boolean);

  if (segments.length === 0) {
    return new Response("not found", { status: 404, headers: { "Content-Type": "text/plain" } });
  }

  try {
    if (segments.length === 1) {
      return await renderNicho(segments[0]!);
    }
    if (segments.length === 2) {
      return await renderCluster(segments[0]!, segments[1]!);
    }
    if (segments.length === 3) {
      return await renderSingle(segments[0]!, segments[1]!, segments[2]!);
    }
    return new Response("not found", { status: 404, headers: { "Content-Type": "text/plain" } });
  } catch (e) {
    return new Response("error: " + (e instanceof Error ? e.message : "unknown"), { status: 500 });
  }
}

function mdResponse(content: string) {
  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

async function renderNicho(slug: string) {
  const nicho = await prisma.nicho.findUnique({
    where: { slug, ativo: true },
    include: {
      clusters: {
        where: { ativo: true },
        orderBy: { volumeMensal: "desc" },
        select: {
          slug: true,
          nome: true,
          tipo: true,
          _count: { select: { mensagens: { where: { status: "PUBLISHED" } } } },
        },
      },
    },
  });
  if (!nicho) return new Response("nicho not found", { status: 404 });

  const totalMsgs = await prisma.mensagem.count({
    where: { status: "PUBLISHED", cluster: { nichoId: nicho.id } },
  });

  const out: string[] = [];
  out.push(`# ${nicho.nome}`);
  out.push("");
  out.push(`> Curadoria editorial Portal Soma — ${totalMsgs.toLocaleString("pt-BR")} mensagens em ${nicho.clusters.length} categorias.`);
  out.push("");
  out.push(`Fonte: ${SITE_URL}/${nicho.slug}/`);
  out.push("");

  const byTipo: Record<string, typeof nicho.clusters> = {};
  for (const c of nicho.clusters) {
    const t = c.tipo ?? "OUTROS";
    if (!byTipo[t]) byTipo[t] = [];
    byTipo[t].push(c);
  }
  const labels: Record<string, string> = {
    DESTINATARIO: "Por destinatário",
    OCASIAO: "Por ocasião",
    TOM: "Por tom",
    CANAL: "Por canal",
    FALECIDO: "Em memória",
  };
  for (const [tipo, items] of Object.entries(byTipo)) {
    out.push(`## ${labels[tipo] ?? tipo}`);
    out.push("");
    for (const c of items) {
      out.push(`- [${c.nome}](${SITE_URL}/${nicho.slug}/${c.slug}/) — ${c._count.mensagens} mensagens`);
    }
    out.push("");
  }

  return mdResponse(out.join("\n"));
}

async function renderCluster(nichoSlug: string, clusterSlug: string) {
  const cluster = await prisma.cluster.findFirst({
    where: { slug: clusterSlug, nicho: { slug: nichoSlug }, ativo: true },
    include: {
      nicho: true,
      editorial: true,
      mensagens: {
        where: { status: "PUBLISHED" },
        orderBy: [{ likes: "desc" }, { publicadoEm: "desc" }],
        take: 50,
        select: {
          slug: true,
          titulo: true,
          conteudo: true,
          autor: { select: { nome: true } },
        },
      },
    },
  });
  if (!cluster) return new Response("cluster not found", { status: 404 });

  const total = await prisma.mensagem.count({
    where: { clusterId: cluster.id, status: "PUBLISHED" },
  });

  const out: string[] = [];
  out.push(`# Mensagens de Aniversário ${cluster.nome}`);
  out.push("");
  out.push(`> ${total} mensagens curadas. Fonte: ${SITE_URL}/${nichoSlug}/${clusterSlug}/`);
  out.push("");
  if (cluster.editorial?.introHero) {
    out.push("## Introdução");
    out.push("");
    out.push(cluster.editorial.introHero);
    out.push("");
  }
  out.push("## Mensagens");
  out.push("");
  for (const m of cluster.mensagens) {
    out.push(`### ${m.titulo}`);
    out.push("");
    out.push(`> ${m.conteudo.replace(/\n/g, "\n> ")}`);
    out.push("");
    out.push(`— ${m.autor.nome}`);
    out.push(`Fonte: ${SITE_URL}/${nichoSlug}/${clusterSlug}/${m.slug}/`);
    out.push("");
  }
  if (cluster.editorial?.fechamento) {
    out.push("## Fechamento");
    out.push("");
    out.push(cluster.editorial.fechamento);
    out.push("");
  }
  if (cluster.editorial?.faqTexto) {
    out.push("## Perguntas frequentes");
    out.push("");
    out.push(cluster.editorial.faqTexto);
    out.push("");
  }

  return mdResponse(out.join("\n"));
}

async function renderSingle(nichoSlug: string, clusterSlug: string, slug: string) {
  const m = await prisma.mensagem.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      cluster: { slug: clusterSlug, nicho: { slug: nichoSlug } },
    },
    include: {
      cluster: { select: { slug: true, nome: true, nicho: { select: { slug: true } } } },
      autor: true,
    },
  });
  if (!m) return new Response("mensagem not found", { status: 404 });

  const out: string[] = [];
  out.push(`# ${m.titulo}`);
  out.push("");
  out.push(`> Mensagem de aniversário ${m.cluster.nome.toLowerCase()} — Portal Soma`);
  out.push("");
  out.push(`Fonte: ${SITE_URL}/${m.cluster.nicho.slug}/${m.cluster.slug}/${m.slug}/`);
  out.push("");
  if (m.resumo) {
    out.push(`**Resumo:** ${m.resumo}`);
    out.push("");
  }
  out.push("## Mensagem");
  out.push("");
  out.push(`> ${m.conteudo.replace(/\n/g, "\n> ")}`);
  out.push("");
  out.push("---");
  out.push("");
  out.push(`**Autor:** ${m.autor.nome}`);
  if (m.autor.bio) {
    out.push("");
    out.push(`*${m.autor.bio.slice(0, 200)}*`);
  }
  out.push("");
  out.push(`**Categoria:** [${m.cluster.nome}](${SITE_URL}/${m.cluster.nicho.slug}/${m.cluster.slug}/)`);
  out.push("");
  if (m.publicadoEm) {
    out.push(`**Publicado:** ${m.publicadoEm.toISOString().slice(0, 10)}`);
  }

  return mdResponse(out.join("\n"));
}
