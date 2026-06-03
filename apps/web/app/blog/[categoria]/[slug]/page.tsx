import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@nivertotal/db";
import { Clock, ChevronRight, ArrowLeft } from "lucide-react";
import { ShareMenu } from "@/components/share-menu";
import { ViewTracker } from "@/components/view-tracker";

export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateStaticParams() {
  if (process.env.SKIP_STATIC_PARAMS === "true" || !process.env.DATABASE_URL) return [];
  try {
    const posts = await prisma.post.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, categoria: { select: { slug: true } } },
    });
    return posts.map((p) => ({ categoria: p.categoria.slug, slug: p.slug }));
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ categoria: string; slug: string }>;
}

async function loadPost(catSlug: string, postSlug: string) {
  return prisma.post.findFirst({
    where: {
      slug: postSlug,
      status: "PUBLISHED",
      categoria: { slug: catSlug, ativo: true },
    },
    include: {
      categoria: true,
      autor: true,
      imagemHero: true,
      imagemOg: true,
    },
  });
}

async function loadRelated(categoriaId: string, currentId: string) {
  return prisma.post.findMany({
    where: { categoriaId, status: "PUBLISHED", id: { not: currentId } },
    orderBy: { publicadoEm: "desc" },
    take: 4,
    include: { categoria: { select: { slug: true } }, imagemHero: true },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoria, slug } = await params;
  const post = await loadPost(categoria, slug);
  if (!post) return {};
  return {
    title: post.metaTitle ?? `${post.titulo} | Portal Soma`,
    description: post.metaDescription ?? post.resumo ?? undefined,
    alternates: { canonical: `https://www.portalsoma.com.br/blog/${post.categoria.slug}/${post.slug}/` },
    openGraph: {
      title: post.titulo,
      description: post.resumo ?? "",
      type: "article",
      url: `https://www.portalsoma.com.br/blog/${post.categoria.slug}/${post.slug}/`,
      images: post.imagemOg ? [post.imagemOg.url] : post.imagemHero ? [post.imagemHero.url] : [],
      publishedTime: post.publicadoEm?.toISOString(),
      modifiedTime: post.atualizadoEm.toISOString(),
      authors: [post.autor.nome],
    },
  };
}

/**
 * Markdown → HTML básico (h2, h3, p, ul, ol, strong, em, links, blockquote).
 * Suficiente pra posts editoriais sem dependência externa.
 */
function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  let inBq = false;
  let para: string[] = [];

  function flushPara() {
    if (para.length) {
      const text = inlineFmt(para.join(" ").trim());
      if (text) out.push(`<p>${text}</p>`);
      para = [];
    }
  }
  function flushLists() {
    if (inUl) { out.push("</ul>"); inUl = false; }
    if (inOl) { out.push("</ol>"); inOl = false; }
    if (inBq) { out.push("</blockquote>"); inBq = false; }
  }
  function inlineFmt(s: string): string {
    return s
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="noopener">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushPara(); flushLists(); continue; }

    if (line.startsWith("## ")) {
      flushPara(); flushLists();
      out.push(`<h2>${inlineFmt(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      flushPara(); flushLists();
      out.push(`<h3>${inlineFmt(line.slice(4))}</h3>`);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      flushPara();
      if (!inUl) { flushLists(); out.push("<ul>"); inUl = true; }
      out.push(`<li>${inlineFmt(line.slice(2))}</li>`);
    } else if (/^\d+\.\s/.test(line)) {
      flushPara();
      if (!inOl) { flushLists(); out.push("<ol>"); inOl = true; }
      out.push(`<li>${inlineFmt(line.replace(/^\d+\.\s/, ""))}</li>`);
    } else if (line.startsWith("> ")) {
      flushPara();
      if (!inBq) { flushLists(); out.push("<blockquote>"); inBq = true; }
      out.push(`<p>${inlineFmt(line.slice(2))}</p>`);
    } else {
      if (inUl || inOl || inBq) flushLists();
      para.push(line);
    }
  }
  flushPara(); flushLists();
  return out.join("\n");
}

export default async function PostBlog({ params }: PageProps) {
  const { categoria, slug } = await params;
  const post = await loadPost(categoria, slug);
  if (!post) notFound();

  const related = await loadRelated(post.categoriaId, post.id);
  const url = `https://www.portalsoma.com.br/blog/${post.categoria.slug}/${post.slug}/`;
  const html = renderMarkdown(post.conteudo);

  return (
    <>
      <ViewTracker mensagemId={post.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Início", item: "https://www.portalsoma.com.br/" },
                { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.portalsoma.com.br/blog/" },
                { "@type": "ListItem", position: 3, name: post.categoria.nome, item: `https://www.portalsoma.com.br/blog/${post.categoria.slug}/` },
                { "@type": "ListItem", position: 4, name: post.titulo, item: url },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: post.titulo,
              description: post.resumo ?? post.metaDescription ?? "",
              url,
              datePublished: post.publicadoEm?.toISOString(),
              dateModified: post.atualizadoEm.toISOString(),
              author: {
                "@type": "Person",
                name: post.autor.nome,
                url: `https://www.portalsoma.com.br/autor/${post.autor.slug}/`,
              },
              publisher: {
                "@type": "Organization",
                name: "Portal Soma",
                url: "https://www.portalsoma.com.br/",
                logo: { "@type": "ImageObject", url: "https://www.portalsoma.com.br/icon.svg" },
              },
              image: post.imagemHero ? post.imagemHero.url : undefined,
              wordCount: post.wordCount ?? undefined,
              keywords: post.tags?.join(", "),
              mainEntityOfPage: { "@type": "WebPage", "@id": url },
              interactionStatistic: [
                { "@type": "InteractionCounter", interactionType: { "@type": "LikeAction" }, userInteractionCount: post.likes },
                { "@type": "InteractionCounter", interactionType: { "@type": "ShareAction" }, userInteractionCount: post.shares },
                { "@type": "InteractionCounter", interactionType: { "@type": "ReadAction" }, userInteractionCount: post.visualizacoes },
              ],
            },
          ]),
        }}
      />

      <article itemScope itemType="https://schema.org/BlogPosting" className="relative">
        <section className="bg-gradient-to-b from-niver-50 via-warm-100 to-warm-50 py-10 sm:py-14 border-b border-warm-200/40">
          <div className="container-niver max-w-3xl">
            <nav className="text-sm text-stone-500 mb-4 flex items-center gap-2 flex-wrap">
              <a href={`/blog/${post.categoria.slug}/`} className="hover:text-niver-700 inline-flex items-center gap-1">
                <ArrowLeft size={14} />
                {post.categoria.nome}
              </a>
            </nav>
            <h1
              itemProp="headline"
              className="font-display text-3xl sm:text-5xl text-niver-800 leading-tight mb-5"
            >
              {post.titulo}
            </h1>
            <div className="flex items-center gap-4 text-sm text-stone-600 flex-wrap">
              <span itemProp="author" itemScope itemType="https://schema.org/Person">
                por{" "}
                <a href={`/autor/${post.autor.slug}/`} className="text-niver-700 font-medium hover:underline">
                  <span itemProp="name">{post.autor.nome}</span>
                </a>
              </span>
              {post.publicadoEm && (
                <time itemProp="datePublished" dateTime={post.publicadoEm.toISOString()} className="text-stone-500">
                  {post.publicadoEm.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                </time>
              )}
              {post.tempoLeitura && (
                <span className="inline-flex items-center gap-1 text-stone-500">
                  <Clock size={13} />
                  {post.tempoLeitura} min de leitura
                </span>
              )}
            </div>
          </div>
        </section>

        {post.imagemHero && (
          <section className="container-niver max-w-3xl py-8">
            <figure className="rounded-3xl overflow-hidden shadow-xl shadow-niver-900/10 bg-warm-200">
              <img
                src={post.imagemHero.url}
                alt={post.imagemHero.alt}
                className="w-full aspect-[16/9] object-cover"
                itemProp="image"
              />
            </figure>
          </section>
        )}

        <section className="container-niver max-w-3xl pb-12">
          <div
            itemProp="articleBody"
            className="prose-article font-display text-lg leading-relaxed text-stone-800 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:sm:text-3xl [&_h2]:text-niver-800 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:font-semibold [&_h3]:font-display [&_h3]:text-xl [&_h3]:text-niver-700 [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-semibold [&_p]:mb-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-5 [&_li]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-niver-400 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-stone-600 [&_blockquote]:my-6 [&_a]:text-niver-700 [&_a]:underline [&_a]:decoration-niver-300 [&_a:hover]:decoration-niver-600 [&_strong]:text-stone-900 [&_strong]:font-semibold [&_code]:font-mono [&_code]:text-sm [&_code]:bg-warm-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <div className="mt-10 pt-8 border-t border-warm-200 flex flex-wrap gap-2">
            <ShareMenu text={post.titulo} url={url} mensagemId={post.id} />
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 ml-auto items-center">
                {post.tags.slice(0, 5).map((tag) => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-niver-50 text-niver-700 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {related.length > 0 && (
          <section className="container-wide pb-16">
            <h2 className="heading-section-bar mb-6">
              <span>Continue lendo em {post.categoria.nome}</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p) => (
                <a
                  key={p.id}
                  href={`/blog/${p.categoria.slug}/${p.slug}/`}
                  className="card-feature overflow-hidden hover:shadow-lg transition-all group"
                >
                  {p.imagemHero && (
                    <div className="aspect-[16/9] overflow-hidden bg-warm-200">
                      <img
                        src={p.imagemHero.url}
                        alt={p.imagemHero.alt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-display text-base text-stone-900 group-hover:text-niver-700 line-clamp-2">
                      {p.titulo}
                    </h3>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
