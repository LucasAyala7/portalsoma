import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactDOM from "react-dom";
import { prisma } from "@nivertotal/db";
import { MessageCardRich } from "@/components/message-card-rich";
import { MessageCardListItem } from "@/components/message-card-list";
import { FilterChips } from "@/components/filter-chips";
import { SearchTypeahead } from "@/components/search-typeahead";
import { FaqAccordion } from "@/components/faq-accordion";
import { CopyButton } from "@/components/copy-button";
import { ShareMenu } from "@/components/share-menu";
import { LikeButton } from "@/components/like-button";
import { PersonaBadge } from "@/components/persona-badge";
import { CounterBoard } from "@/components/counter-board";
import { CategoryGrid } from "@/components/category-grid";
import { StickyActionBar } from "@/components/sticky-action-bar";
import { ViewTracker } from "@/components/view-tracker";
import { ShareImageButton } from "@/components/share-image-button";
import { ClusterHeroIntro } from "@/components/cluster-hero-intro";
import { VerMensagensCTA } from "@/components/ver-mensagens-cta";
import { getCategoryIcon } from "@/lib/icons";
import {
  jsonLdScript,
  breadcrumbSchema,
  collectionSchema,
  faqSchema,
  enrichedItemListSchema,
  creativeWorkWithInteractionSchema,
} from "@/lib/seo";
import { mensagemUrl } from "@/lib/utils";
import { Heart, Copy, Share2, Eye, ChevronRight, Flame, Users, ArrowLeft, BookOpen } from "lucide-react";

interface RouteParams {
  path: string[];
}

interface PageProps {
  params: Promise<RouteParams>;
}

// Dynamic + CDN cache 1 dia (CF Page Rule s-maxage=86400, stale-while-revalidate=604800).
export const dynamic = "force-dynamic";
export const revalidate = 86400;
export const dynamicParams = true;

type Resolved =
  | { kind: "nicho"; nicho: NichoData }
  | { kind: "cluster"; nicho: NichoData; cluster: ClusterData }
  | { kind: "complemento"; nicho: NichoData; cluster: ClusterData; complemento: ComplementoData }
  | { kind: "single"; mensagem: MensagemData };

type NichoData = NonNullable<Awaited<ReturnType<typeof loadNicho>>>;
type ClusterData = NonNullable<Awaited<ReturnType<typeof loadCluster>>>;
type ComplementoData = NonNullable<Awaited<ReturnType<typeof loadComplemento>>>;
type MensagemData = NonNullable<Awaited<ReturnType<typeof loadMensagem>>>;

async function loadNicho(slug: string) {
  return prisma.nicho.findUnique({
    where: { slug, ativo: true },
    include: {
      clusters: {
        where: { ativo: true },
        orderBy: { volumeMensal: "desc" },
        include: { _count: { select: { mensagens: { where: { status: "PUBLISHED" } } } } },
      },
    },
  });
}

async function loadCluster(nichoSlug: string, clusterSlug: string) {
  return prisma.cluster.findFirst({
    where: { slug: clusterSlug, nicho: { slug: nichoSlug }, ativo: true },
    include: {
      nicho: true,
      editorial: true,
      complementos: {
        where: { ativo: true },
        orderBy: { volumeMensal: "desc" },
        include: { _count: { select: { mensagens: { where: { status: "PUBLISHED" } } } } },
      },
    },
  });
}

async function loadComplemento(nichoSlug: string, clusterSlug: string, complementoSlug: string) {
  return prisma.complemento.findFirst({
    where: {
      slug: complementoSlug,
      cluster: { slug: clusterSlug, nicho: { slug: nichoSlug } },
      ativo: true,
    },
    include: {
      cluster: {
        include: {
          nicho: true,
          complementos: {
            where: { ativo: true },
            include: { _count: { select: { mensagens: { where: { status: "PUBLISHED" } } } } },
          },
        },
      },
    },
  });
}

async function loadMensagem(nichoSlug: string, clusterSlug: string, slug: string) {
  return prisma.mensagem.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      cluster: { slug: clusterSlug, nicho: { slug: nichoSlug } },
    },
    include: {
      cluster: { include: { nicho: true } },
      complemento: true,
      autor: true,
      persona: true,
      imagemHero: true,
      imagemOg: true,
    },
  });
}

async function resolveRoute(path: string[]): Promise<Resolved | null> {
  if (path.length === 0 || path.length > 4) return null;
  const [nichoSlug, clusterSlug, third, fourth] = path;

  const nicho = await loadNicho(nichoSlug!);
  if (!nicho) return null;
  if (path.length === 1) return { kind: "nicho", nicho };

  const cluster = await loadCluster(nichoSlug!, clusterSlug!);
  if (!cluster) return null;
  if (path.length === 2) return { kind: "cluster", nicho, cluster };

  const complemento = await loadComplemento(nichoSlug!, clusterSlug!, third!);
  if (complemento) {
    if (path.length === 3) return { kind: "complemento", nicho, cluster, complemento };
    const mensagem = await loadMensagem(nichoSlug!, clusterSlug!, fourth!);
    if (mensagem) return { kind: "single", mensagem };
    return null;
  }

  if (path.length === 3) {
    const mensagem = await loadMensagem(nichoSlug!, clusterSlug!, third!);
    if (mensagem) return { kind: "single", mensagem };
  }
  return null;
}

export async function generateStaticParams(): Promise<{ path: string[] }[]> {
  // Skip DB no build — pages geradas on-demand via ISR
  if (process.env.SKIP_STATIC_PARAMS === "true" || !process.env.DATABASE_URL) return [];
  try {
  const params: { path: string[] }[] = [];
  const nichos = await prisma.nicho.findMany({
    where: { ativo: true },
    include: {
      clusters: {
        where: { ativo: true },
        include: {
          complementos: { where: { ativo: true } },
          mensagens: {
            where: {
              status: "PUBLISHED",
              NOT: [
                { slug: { startsWith: "pending-" } },
                { slug: { startsWith: "smoke-" } },
              ],
            },
            select: { slug: true },
          },
        },
      },
    },
  });
  for (const nicho of nichos) {
    params.push({ path: [nicho.slug] });
    for (const cluster of nicho.clusters) {
      params.push({ path: [nicho.slug, cluster.slug] });
      for (const comp of cluster.complementos) {
        params.push({ path: [nicho.slug, cluster.slug, comp.slug] });
      }
      for (const m of cluster.mensagens) {
        params.push({ path: [nicho.slug, cluster.slug, m.slug] });
      }
    }
  }
  return params;
  } catch (e) {
    console.warn("[generateStaticParams] DB unavailable at build, skipping:", e instanceof Error ? e.message : e);
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { path } = await params;
  const resolved = await resolveRoute(path);
  if (!resolved) return {};

  switch (resolved.kind) {
    case "nicho":
      return {
        title: resolved.nicho.metaTitle ?? `${resolved.nicho.nome} — Portal Soma`,
        description: resolved.nicho.metaDesc ?? resolved.nicho.descricao ?? undefined,
        alternates: { canonical: `/${resolved.nicho.slug}/` },
      };
    case "cluster": {
      // Title/description dinâmicos com bucket de threshold + ano
      const c = await prisma.mensagem.count({
        where: { clusterId: resolved.cluster.id, status: "PUBLISHED" },
      });
      const last = await prisma.mensagem.findFirst({
        where: { clusterId: resolved.cluster.id, status: "PUBLISHED" },
        orderBy: { atualizadoEm: "desc" },
        select: { atualizadoEm: true },
      });
      const bucket = bucketCount(c);
      const ano = new Date().getFullYear();
      const mes = MESES_PT[(last?.atualizadoEm ?? new Date()).getMonth()];
      const titleAuto = `${bucket} Mensagens de Aniversário ${resolved.cluster.nome} — ${ano}`;
      const descAuto = `Mais de ${bucket.replace("+", "")} mensagens de aniversário ${resolved.cluster.nome.toLowerCase()} pra copiar e compartilhar. Curadoria editorial atualizada em ${mes} ${ano}.`;
      return {
        title: resolved.cluster.metaTitle ?? titleAuto,
        description: resolved.cluster.metaDesc ?? descAuto,
        alternates: { canonical: `/${resolved.nicho.slug}/${resolved.cluster.slug}/` },
        openGraph: {
          title: resolved.cluster.metaTitle ?? titleAuto,
          description: resolved.cluster.metaDesc ?? descAuto,
          url: `https://www.portalsoma.com.br/${resolved.nicho.slug}/${resolved.cluster.slug}/`,
          type: "website",
        },
      };
    }
    case "complemento":
      return {
        title: resolved.complemento.metaTitle ?? `${resolved.cluster.nome} ${resolved.complemento.nome} — Portal Soma`,
        description: resolved.complemento.metaDesc ?? resolved.complemento.descricao ?? undefined,
        alternates: { canonical: `/${resolved.nicho.slug}/${resolved.cluster.slug}/${resolved.complemento.slug}/` },
      };
    case "single": {
      const m = resolved.mensagem;
      const url = mensagemUrl({
        nichoSlug: m.cluster.nicho.slug,
        clusterSlug: m.cluster.slug,
        slug: m.slug,
      });
      return {
        title: m.titulo,
        description: m.resumo ?? m.conteudo.slice(0, 155),
        alternates: { canonical: url },
        openGraph: {
          type: "article",
          title: m.titulo,
          description: m.resumo ?? m.conteudo.slice(0, 155),
          url,
          images: m.imagemOg ? [m.imagemOg.url] : m.imagemHero ? [m.imagemHero.url] : [],
          publishedTime: m.publicadoEm?.toISOString(),
          modifiedTime: m.atualizadoEm.toISOString(),
          authors: [m.autor.nome],
          siteName: "Portal Soma",
          locale: "pt_BR",
        },
      };
    }
  }
}

export default async function CatchAllPage({ params }: PageProps) {
  const { path } = await params;
  const resolved = await resolveRoute(path);
  if (!resolved) notFound();

  if (resolved.kind === "nicho") return <NichoHub data={resolved.nicho} />;
  if (resolved.kind === "cluster")
    return <ClusterPage nicho={resolved.nicho} cluster={resolved.cluster} />;
  if (resolved.kind === "complemento")
    return (
      <ComplementoPage
        nicho={resolved.nicho}
        cluster={resolved.cluster}
        complemento={resolved.complemento}
      />
    );
  return <MensagemPage mensagem={resolved.mensagem} />;
}

// =====================================================
// NICHO HUB
// =====================================================

function NichoHub({ data }: { data: NichoData }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: data.nome, url: `/${data.slug}/` },
          ]),
          collectionSchema({
            nome: data.nome,
            descricao: data.descricao ?? "",
            url: `/${data.slug}/`,
            itemsCount: data.clusters.length,
          }),
        ])}
      />
      <section className="bg-gradient-to-b from-niver-50 to-warm-50 py-14">
        <div className="container-niver">
          <h1 className="font-display text-4xl text-niver-800 max-w-3xl">{data.nome}</h1>
          {data.descricao && (
            <p className="mt-4 text-stone-700 max-w-2xl text-lg leading-relaxed">{data.descricao}</p>
          )}
        </div>
      </section>
      <section className="container-niver py-12">
        <h2 className="heading-section-bar mb-6">Todas as categorias</h2>
        <CategoryGrid
          nichoSlug={data.slug}
          categorias={data.clusters.map((c) => ({
            slug: c.slug,
            nome: c.nome,
            totalMensagens: c._count.mensagens,
            descricao: c.descricao ?? undefined,
            iconConfig: getCategoryIcon(c.slug),
          }))}
        />
      </section>
    </>
  );
}

// =====================================================
// CLUSTER PAGE (collection rica)
// =====================================================

/** Bucket de threshold pra title estável (evita variação que Google penaliza). */
function bucketCount(n: number): string {
  if (n < 20) return String(n);
  if (n < 50) return "+20";
  if (n < 100) return "+50";
  if (n < 150) return "+100";
  if (n < 200) return "+150";
  if (n < 250) return "+200";
  if (n < 300) return "+250";
  if (n < 400) return "+300";
  if (n < 500) return "+400";
  return "+500";
}

const MESES_PT = [
  "janeiro","fevereiro","março","abril","maio","junho",
  "julho","agosto","setembro","outubro","novembro","dezembro",
];

async function ClusterPage({ nicho, cluster }: { nicho: NichoData; cluster: ClusterData }) {
  const [mensagens, topSemana, siblings, agg, latestUpdate, autoresTop] = await Promise.all([
    prisma.mensagem.findMany({
      where: { clusterId: cluster.id, status: "PUBLISHED" },
      orderBy: [{ likes: "desc" }, { publicadoEm: "desc" }],
      take: 200,
      include: {
        autor: true,
        persona: true,
        cluster: { select: { slug: true } },
        imagemHero: true,
      },
    }),
    prisma.mensagem.findMany({
      where: { clusterId: cluster.id, status: "PUBLISHED" },
      orderBy: { likes: "desc" },
      take: 3,
      include: { autor: true, persona: true, cluster: { select: { slug: true } }, imagemHero: true },
    }),
    prisma.cluster.findMany({
      where: {
        ativo: true,
        tipo: cluster.tipo,
        id: { not: cluster.id },
      },
      orderBy: { volumeMensal: "desc" },
      take: 8,
      include: { _count: { select: { mensagens: { where: { status: "PUBLISHED" } } } } },
    }),
    prisma.mensagem.aggregate({
      where: { clusterId: cluster.id, status: "PUBLISHED" },
      _sum: { likes: true, copies: true, shares: true, visualizacoes: true },
      _count: { id: true },
    }),
    prisma.mensagem.findFirst({
      where: { clusterId: cluster.id, status: "PUBLISHED" },
      orderBy: { atualizadoEm: "desc" },
      select: { atualizadoEm: true, publicadoEm: true },
    }),
    prisma.mensagem.groupBy({
      by: ["autorId"],
      where: { clusterId: cluster.id, status: "PUBLISHED" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 4,
    }),
  ]);

  const totalMensagens = agg._count.id;
  const bucket = bucketCount(totalMensagens);
  const anoAtual = new Date().getFullYear();
  const dataAtualizacao = latestUpdate?.atualizadoEm ?? new Date();
  const mesAtualizacao = MESES_PT[dataAtualizacao.getMonth()];
  const dataAtualizacaoLabel = `${dataAtualizacao.getDate()} de ${mesAtualizacao} de ${dataAtualizacao.getFullYear()}`;

  // Buscar autores top (Person blockquote)
  const autoresMaisAtivos = autoresTop.length > 0
    ? await prisma.author.findMany({
        where: { id: { in: autoresTop.map((a) => a.autorId) } },
        select: { id: true, nome: true, slug: true },
      })
    : [];
  const faqDefault = makeFaqForCluster(cluster.nome);
  const faqItems =
    cluster.faq && Array.isArray(cluster.faq)
      ? (cluster.faq as { pergunta: string; resposta: string }[])
      : faqDefault;

  // ItemList JSON-LD: só TOP 15 (Google reconhece carrossel até 20; mais é overkill + bloat HTML)
  const clusterArticleEntries = mensagens.slice(0, 15).map((m, i) => ({
    position: i + 1,
    url: `/${nicho.slug}/${cluster.slug}/${m.slug}/`,
    titulo: m.titulo,
    resumo: m.resumo,
    imageUrl: m.imagemHero?.url ?? null,
    autorNome: m.autor.nome,
    autorUrl: `/autor/${m.autor.slug}/`,
    publicadoEm: m.publicadoEm,
    likes: m.likes,
    copies: m.copies,
    shares: m.shares,
    visualizacoes: m.visualizacoes,
  }));

  // LCP preload — 1ª img acima da dobra (topSemana[0]) é o candidate na cluster page
  if (topSemana[0]?.imagemHero?.url) {
    ReactDOM.preload(topSemana[0].imagemHero.url, {
      as: "image",
      fetchPriority: "high",
    });
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: nicho.nome, url: `/${nicho.slug}/` },
            { name: cluster.nome, url: `/${nicho.slug}/${cluster.slug}/` },
          ]),
          collectionSchema({
            nome: cluster.nome,
            descricao: cluster.descricao ?? cluster.headKeyword,
            url: `/${nicho.slug}/${cluster.slug}/`,
            itemsCount: totalMensagens,
          }),
          ...(clusterArticleEntries.length > 0
            ? [enrichedItemListSchema(clusterArticleEntries)]
            : []),
          // FAQ schema removido: Google deprecou rich snippet pra non-gov/health (2023).
          // Mantemos FAQ em texto livre via cluster.editorial.faqTexto (agrega densidade).
        ])}
      />

      {/* HEADER 2 — hero SEO/GEO opening */}
      <header className="cluster-hero relative bg-gradient-to-b from-niver-50 to-warm-50 py-12 sm:py-16 deco-confetti overflow-hidden">
        <div className="container-niver relative">
          <nav
            className="text-sm text-stone-500 mb-4 flex items-center gap-2"
            aria-label="Breadcrumb"
            itemScope
            itemType="https://schema.org/BreadcrumbList"
          >
            <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <a itemProp="item" href="/" className="hover:text-niver-700 transition-colors">
                <span itemProp="name">Início</span>
              </a>
              <meta itemProp="position" content="1" />
            </span>
            <ChevronRight size={14} />
            <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <a itemProp="item" href={`/${nicho.slug}/`} className="hover:text-niver-700 transition-colors">
                <span itemProp="name">{nicho.nome}</span>
              </a>
              <meta itemProp="position" content="2" />
            </span>
            <ChevronRight size={14} />
            <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <span itemProp="name" className="text-stone-700">{cluster.nome}</span>
              <meta itemProp="position" content="3" />
            </span>
          </nav>
          <h1 className="font-display text-3xl sm:text-5xl text-niver-800 leading-[1.15] mb-5">
            {bucket} Mensagens de Aniversário {cluster.nome} — {anoAtual}
          </h1>
          {cluster.editorial?.introHero ? (
            <ClusterHeroIntro text={cluster.editorial.introHero} />
          ) : cluster.intro ? (
            <ClusterHeroIntro text={cluster.intro} />
          ) : (
            <p className="text-stone-700 leading-[1.85] text-[16px] sm:text-[17px]">
              {cluster.descricao ?? `Mais de ${bucket} mensagens de aniversário ${cluster.nome.toLowerCase()} cuidadosamente curadas - para copiar, compartilhar e emocionar. Atualizadas regularmente por nossos autores convidados.`}
            </p>
          )}

          <VerMensagensCTA targetId="cluster-collection" />

          <div className="mt-6">
            <CounterBoard
              items={[
                { icon: BookOpen, label: "mensagens", value: totalMensagens, highlight: true },
                { icon: Heart, label: "curtidas", value: agg._sum.likes ?? 0 },
                { icon: Copy, label: "cópias", value: agg._sum.copies ?? 0 },
                { icon: Share2, label: "compartilhamentos", value: agg._sum.shares ?? 0 },
                { icon: Eye, label: "visualizações", value: agg._sum.visualizacoes ?? 0 },
              ]}
            />
          </div>
        </div>
      </header>

      {/* ASIDE meta editorial — autores, blockquote TOP1, time freshness */}
      <aside
        className="cluster-meta container-niver py-8 border-b border-warm-200"
        itemScope
        itemType="https://schema.org/Article"
        aria-label="Informações editoriais da categoria"
      >
        <meta itemProp="headline" content={`${bucket} Mensagens de Aniversário ${cluster.nome}`} />
        <div className="flex flex-wrap gap-6 text-sm text-stone-600">
          <div className="inline-flex items-center gap-1.5">
            <time
              itemProp="dateModified"
              dateTime={dataAtualizacao.toISOString()}
              className="font-medium text-niver-700"
            >
              Atualizado em {dataAtualizacaoLabel}
            </time>
          </div>
          {autoresMaisAtivos.length > 0 && (
            <div className="inline-flex items-center gap-1.5 flex-wrap">
              <span>Curadoria por</span>
              {autoresMaisAtivos.map((a, idx) => (
                <span
                  key={a.id}
                  itemProp="author"
                  itemScope
                  itemType="https://schema.org/Person"
                >
                  <a
                    href={`/autor/${a.slug}/`}
                    className="text-niver-700 hover:underline font-medium"
                  >
                    <span itemProp="name">{a.nome}</span>
                  </a>
                  {idx < autoresMaisAtivos.length - 1 && <span className="text-stone-400">, </span>}
                </span>
              ))}
            </div>
          )}
        </div>
        {(topSemana[0]?.resumo || cluster.editorial?.resumoEditorial) && (
          <details className="mt-5 group">
            <summary className="inline-flex items-center gap-2 text-sm font-medium text-niver-700 cursor-pointer hover:text-niver-800 select-none list-none [&::-webkit-details-marker]:hidden">
              <ChevronRight
                size={14}
                className="transition-transform group-open:rotate-90"
                strokeWidth={2.4}
              />
              <span>Sobre essa coleção</span>
            </summary>
            {topSemana[0]?.resumo && (
              <blockquote className="mt-4 border-l-4 border-niver-400 pl-5 py-2 italic text-stone-700 max-w-3xl">
                <p itemProp="description">"{topSemana[0].resumo}"</p>
                <cite className="block not-italic text-sm text-stone-500 mt-2">
                  — <span itemProp="creator">{topSemana[0].autor.nome}</span>, em{" "}
                  <a
                    href={`/${nicho.slug}/${cluster.slug}/${topSemana[0].slug}/`}
                    className="text-niver-700 hover:underline"
                  >
                    {topSemana[0].titulo}
                  </a>
                </cite>
              </blockquote>
            )}
            {cluster.editorial?.resumoEditorial && (
              <p
                itemProp="articleBody"
                className="mt-4 text-stone-600 leading-relaxed max-w-3xl whitespace-pre-line text-[15px]"
              >
                {cluster.editorial.resumoEditorial}
              </p>
            )}
          </details>
        )}
      </aside>

      {/* TOP DA SEMANA (se tiver ≥3) */}
      {topSemana.length >= 3 && (
        <section className="container-niver py-10">
          <h2 className="heading-section-bar mb-6">
            <Flame size={22} className="text-rose-500" strokeWidth={2.4} />
            <span>Top em {cluster.nome}</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {topSemana.map((m, i) => (
              <MessageCardRich
                key={m.id}
                mensagem={m}
                nichoSlug={nicho.slug}
                badge={i === 0 ? "trending" : i === 1 ? "top" : "new"}
                destacada={i === 0}
                priority={i === 0}
              />
            ))}
          </div>
        </section>
      )}

      {/* SECTION collection — listicle principal */}
      <section
        id="cluster-collection"
        className="cluster-collection container-niver py-12 scroll-mt-20"
        itemScope
        itemType="https://schema.org/CollectionPage"
      >
        <div className="space-y-6 mb-8">
          <SearchTypeahead
            messages={mensagens.map((m) => ({ id: m.id, conteudo: m.conteudo }))}
            placeholder={`Buscar em ${cluster.nome}...`}
          />
          {cluster.complementos.length > 0 && (
            <FilterChips
              title="Refine por"
              chips={cluster.complementos.map((comp) => ({
                label: comp.nome,
                href: `/${nicho.slug}/${cluster.slug}/${comp.slug}/`,
                count: comp._count.mensagens > 0 ? comp._count.mensagens : undefined,
              }))}
            />
          )}
        </div>

        <h2 className="heading-section-bar mb-3">
          <span>Mensagens emocionantes para {cluster.nome.toLowerCase().replace(/^para /i, "")}</span>
          <span className="text-base font-normal text-stone-500 tabular-nums">
            ({totalMensagens})
          </span>
        </h2>
        <p className="text-stone-600 leading-relaxed max-w-2xl mb-8 text-[15px]">
          Cada mensagem abaixo foi escrita pra ser sentida, não apenas lida. Copie em 1 clique, compartilhe no WhatsApp, ou baixe a imagem pronta para o status. Curtidas e compartilhamentos refletem a recepção real de quem usou.
        </p>

        {mensagens.length > 0 ? (
          <>
            <div className="space-y-3 mb-10">
              {mensagens.slice(0, 10).map((m) => (
                <MessageCardListItem key={m.id} mensagem={m} nichoSlug={nicho.slug} />
              ))}
            </div>

            {mensagens.length > 10 && (
              <>
                <h2 className="heading-section-bar mt-12 mb-6">
                  <span>Mais mensagens curadas</span>
                </h2>
                <div className="grid lg:grid-cols-2 gap-5">
                  {mensagens.slice(10).map((m) => (
                    <MessageCardRich key={m.id} mensagem={m} nichoSlug={nicho.slug} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="card-feature text-center py-16">
            <p className="text-stone-600 mb-2">Estamos preparando mensagens com cuidado pra esta categoria.</p>
            <p className="text-sm text-stone-500">Volte em breve — novas mensagens chegam diariamente.</p>
          </div>
        )}
      </section>

      {/* SECTION extras — fechamento editorial + FAQ texto livre (sem schema) */}
      {(cluster.editorial?.fechamento || cluster.editorial?.faqTexto) && (
        <section className="cluster-extras container-niver py-12">
          <article className="max-w-3xl mx-auto">
            {cluster.editorial.fechamento && (
              <>
                <h2 className="heading-section-bar mb-6">
                  <span>Como escolher a mensagem certa</span>
                </h2>
                <div className="prose-article text-stone-700 leading-relaxed mb-12 whitespace-pre-line">
                  {cluster.editorial.fechamento}
                </div>
              </>
            )}
            {cluster.editorial.faqTexto && (
              <>
                <h2 className="heading-section-bar mb-6">
                  <span>Perguntas frequentes sobre {cluster.nome.toLowerCase()}</span>
                </h2>
                <div className="prose-article text-stone-700 leading-relaxed [&_h3]:font-display [&_h3]:text-lg [&_h3]:text-niver-700 [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-semibold [&_p]:mb-4">
                  {cluster.editorial.faqTexto
                    .split(/###\s+/)
                    .filter((b) => b.trim().length > 0)
                    .map((block, idx) => {
                      const qMatch = block.match(/^(.+?\?)\s*(.*)$/s);
                      if (qMatch) {
                        return (
                          <div key={idx}>
                            <h3>{qMatch[1].trim()}</h3>
                            <p>{qMatch[2].trim()}</p>
                          </div>
                        );
                      }
                      return <p key={idx}>{block.trim()}</p>;
                    })}
                </div>
              </>
            )}
          </article>
        </section>
      )}

      {/* OUTROS DESTINATÁRIOS / TONS */}
      {siblings.length > 0 && (
        <section className="container-niver py-12">
          <h2 className="heading-section-bar mb-6">
            <Users size={22} className="text-niver-600" strokeWidth={2.4} />
            <span>
              {cluster.tipo === "DESTINATARIO"
                ? "Outros destinatários"
                : cluster.tipo === "TOM"
                  ? "Outros tons"
                  : "Categorias relacionadas"}
            </span>
          </h2>
          <CategoryGrid
            nichoSlug={nicho.slug}
            categorias={siblings.map((s) => ({
              slug: s.slug,
              nome: s.nome,
              totalMensagens: s._count.mensagens,
              descricao: s.descricao ?? undefined,
              iconConfig: getCategoryIcon(s.slug),
            }))}
          />
        </section>
      )}

      {/* FAQ accordion (legacy — só se sem editorial.faqTexto) */}
      {!cluster.editorial?.faqTexto && (
        <section className="container-niver py-12">
          <h2 className="heading-section-bar mb-8">Perguntas frequentes</h2>
          <FaqAccordion items={faqItems} />
        </section>
      )}
    </>
  );
}

// =====================================================
// COMPLEMENTO PAGE
// =====================================================

async function ComplementoPage({
  nicho,
  cluster,
  complemento,
}: {
  nicho: NichoData;
  cluster: ClusterData;
  complemento: ComplementoData;
}) {
  const [mensagens, agg, sibComplementos] = await Promise.all([
    prisma.mensagem.findMany({
      where: { complementoId: complemento.id, status: "PUBLISHED" },
      orderBy: [{ likes: "desc" }, { publicadoEm: "desc" }],
      take: 30,
      include: {
        autor: true,
        persona: true,
        cluster: { select: { slug: true } },
        imagemHero: true,
      },
    }),
    prisma.mensagem.aggregate({
      where: { complementoId: complemento.id, status: "PUBLISHED" },
      _sum: { likes: true, copies: true, shares: true, visualizacoes: true },
      _count: { id: true },
    }),
    prisma.complemento.findMany({
      where: { clusterId: cluster.id, ativo: true, id: { not: complemento.id } },
      include: { _count: { select: { mensagens: { where: { status: "PUBLISHED" } } } } },
    }),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: nicho.nome, url: `/${nicho.slug}/` },
            { name: cluster.nome, url: `/${nicho.slug}/${cluster.slug}/` },
            { name: complemento.nome, url: `/${nicho.slug}/${cluster.slug}/${complemento.slug}/` },
          ]),
          collectionSchema({
            nome: `${cluster.nome} ${complemento.nome}`,
            descricao: complemento.descricao ?? complemento.headKeyword,
            url: `/${nicho.slug}/${cluster.slug}/${complemento.slug}/`,
            itemsCount: agg._count.id,
          }),
        ])}
      />

      <section className="relative bg-gradient-to-b from-niver-50 to-warm-50 py-12 sm:py-16 deco-confetti overflow-hidden">
        <div className="container-niver relative">
          <nav
            className="text-sm text-stone-500 mb-4 flex items-center gap-2 flex-wrap"
            aria-label="Breadcrumb"
            itemScope
            itemType="https://schema.org/BreadcrumbList"
          >
            <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <a itemProp="item" href="/" className="hover:text-niver-700 transition-colors">
                <span itemProp="name">Início</span>
              </a>
              <meta itemProp="position" content="1" />
            </span>
            <ChevronRight size={14} />
            <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <a itemProp="item" href={`/${nicho.slug}/`} className="hover:text-niver-700 transition-colors">
                <span itemProp="name">{nicho.nome}</span>
              </a>
              <meta itemProp="position" content="2" />
            </span>
            <ChevronRight size={14} />
            <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <a itemProp="item" href={`/${nicho.slug}/${cluster.slug}/`} className="hover:text-niver-700 transition-colors">
                <span itemProp="name">{cluster.nome}</span>
              </a>
              <meta itemProp="position" content="3" />
            </span>
          </nav>
          <h1 className="font-display text-3xl sm:text-5xl text-niver-800 leading-tight max-w-3xl mb-4">
            {cluster.nome} {complemento.nome.toLowerCase()}
          </h1>
          {complemento.intro && (
            <p className="text-stone-700 leading-relaxed max-w-2xl text-lg whitespace-pre-line">
              {complemento.intro}
            </p>
          )}
          {!complemento.intro && complemento.descricao && (
            <p className="text-stone-700 leading-relaxed max-w-2xl text-lg">{complemento.descricao}</p>
          )}

          <div className="mt-6">
            <CounterBoard
              items={[
                { icon: Heart, label: "mensagens", value: agg._count.id, highlight: true },
                { icon: Copy, label: "cópias", value: agg._sum.copies ?? 0 },
                { icon: Share2, label: "compartilhamentos", value: agg._sum.shares ?? 0 },
                { icon: Eye, label: "visualizações", value: agg._sum.visualizacoes ?? 0 },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="container-niver py-12">
        <div className="mb-6">
          <SearchTypeahead
            messages={mensagens.map((m) => ({ id: m.id, conteudo: m.conteudo }))}
            placeholder={`Buscar em ${cluster.nome} ${complemento.nome.toLowerCase()}...`}
          />
        </div>

        {mensagens.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-5">
            {mensagens.map((m) => (
              <MessageCardRich key={m.id} mensagem={m} nichoSlug={nicho.slug} />
            ))}
          </div>
        ) : (
          <div className="card-feature text-center py-16">
            <p className="text-stone-600">Estamos preparando mensagens com cuidado pra esta categoria.</p>
          </div>
        )}
      </section>

      {sibComplementos.length > 0 && (
        <section className="container-niver py-12">
          <h2 className="heading-section-bar mb-6">Outras opções de {cluster.nome.toLowerCase()}</h2>
          <CategoryGrid
            variant="compact"
            nichoSlug={nicho.slug}
            categorias={sibComplementos.map((s) => ({
              slug: `${cluster.slug}/${s.slug}`,
              nome: s.nome,
              totalMensagens: s._count.mensagens,
              iconConfig: getCategoryIcon(s.slug),
            }))}
          />
        </section>
      )}
    </>
  );
}

// =====================================================
// SINGLE MENSAGEM
// =====================================================

async function MensagemPage({ mensagem }: { mensagem: MensagemData }) {
  const url = mensagemUrl({
    nichoSlug: mensagem.cluster.nicho.slug,
    clusterSlug: mensagem.cluster.slug,
    slug: mensagem.slug,
  });

  const relacionadas = await prisma.mensagem.findMany({
    where: {
      clusterId: mensagem.clusterId,
      id: { not: mensagem.id },
      status: "PUBLISHED",
    },
    orderBy: { likes: "desc" },
    take: 6,
    include: {
      autor: true,
      persona: true,
      cluster: { select: { slug: true } },
      imagemHero: true,
    },
  });

  // LCP preload — hero img do single (above-the-fold)
  if (mensagem.imagemHero?.url) {
    ReactDOM.preload(mensagem.imagemHero.url, {
      as: "image",
      fetchPriority: "high",
    });
  }

  return (
    <>
      <ViewTracker mensagemId={mensagem.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: mensagem.cluster.nicho.nome, url: `/${mensagem.cluster.nicho.slug}/` },
            { name: mensagem.cluster.nome, url: `/${mensagem.cluster.nicho.slug}/${mensagem.cluster.slug}/` },
            { name: mensagem.titulo, url },
          ]),
          creativeWorkWithInteractionSchema({
            titulo: mensagem.titulo,
            conteudo: mensagem.conteudo,
            slug: mensagem.slug,
            url,
            publicadoEm: mensagem.publicadoEm,
            atualizadoEm: mensagem.atualizadoEm,
            autorNome: mensagem.autor.nome,
            autorUrl: `/autor/${mensagem.autor.slug}/`,
            autorBio: mensagem.autor.bio,
            autorFotoUrl: mensagem.autor.fotoUrl,
            autorRedes: mensagem.autor.redes as Record<string, string> | null,
            imagemUrl: mensagem.imagemHero?.url ?? null,
            resumo: mensagem.resumo,
            likes: mensagem.likes,
            copies: mensagem.copies,
            shares: mensagem.shares,
            visualizacoes: mensagem.visualizacoes,
          }),
        ])}
      />

      <article
        itemScope
        itemType="https://schema.org/CreativeWork"
        className="relative"
      >
        {/* HERO compacto */}
        <section className="bg-gradient-to-b from-niver-50 via-warm-100 to-warm-50 py-10 sm:py-14 border-b border-warm-200/40">
          <div className="container-niver max-w-3xl">
            <nav
              className="text-sm text-stone-500 mb-4 flex items-center gap-2 flex-wrap"
              aria-label="Breadcrumb"
              itemScope
              itemType="https://schema.org/BreadcrumbList"
            >
              <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <a itemProp="item" href="/" className="hover:text-niver-700 transition-colors">
                  <span itemProp="name">Início</span>
                </a>
                <meta itemProp="position" content="1" />
              </span>
              <ChevronRight size={14} />
              <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <a itemProp="item" href={`/${mensagem.cluster.nicho.slug}/`} className="hover:text-niver-700 transition-colors">
                  <span itemProp="name">{mensagem.cluster.nicho.nome}</span>
                </a>
                <meta itemProp="position" content="2" />
              </span>
              <ChevronRight size={14} />
              <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <a itemProp="item" href={`/${mensagem.cluster.nicho.slug}/${mensagem.cluster.slug}/`} className="hover:text-niver-700 inline-flex items-center gap-1 transition-colors">
                  <span itemProp="name">{mensagem.cluster.nome}</span>
                </a>
                <meta itemProp="position" content="3" />
              </span>
            </nav>

            <h1
              itemProp="name"
              className="font-display text-3xl sm:text-4xl text-niver-800 leading-tight mb-5"
            >
              {mensagem.titulo}
            </h1>

            <div className="flex items-center gap-4 flex-wrap">
              <PersonaBadge
                nome={mensagem.autor.nome}
                slug={mensagem.autor.slug}
                fotoUrl={mensagem.autor.fotoUrl}
                isReal={mensagem.autor.real}
              />
              <span className="text-stone-300">·</span>
              <div className="flex items-center gap-4 text-xs text-stone-500">
                <span className="stat">
                  <Heart size={12} className="text-rose-500" strokeWidth={2.4} />
                  <strong className="text-stone-700">{mensagem.likes.toLocaleString("pt-BR")}</strong>
                  curtidas
                </span>
                <span className="stat">
                  <Copy size={12} className="text-niver-500" strokeWidth={2.4} />
                  <strong className="text-stone-700">{mensagem.copies.toLocaleString("pt-BR")}</strong>
                  cópias
                </span>
                <span className="stat">
                  <Eye size={12} strokeWidth={2.4} />
                  {mensagem.visualizacoes.toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* IMAGEM HERO + MENSAGEM em destaque */}
        <section className="container-niver py-10 max-w-3xl">
          {mensagem.imagemHero && (
            <figure className="mb-8 rounded-3xl overflow-hidden shadow-xl shadow-niver-900/10 relative bg-warm-200">
              <img
                src={mensagem.imagemHero.url}
                alt={mensagem.imagemHero.alt}
                className="w-full aspect-[3/2] object-cover"
                fetchPriority="high"
                width={1200}
                height={800}
                decoding="async"
              />
              <div className="absolute top-3 right-3 z-10">
                <ShareImageButton
                  imageUrl={mensagem.imagemHero.url}
                  titulo={mensagem.titulo}
                  mensagemId={mensagem.id}
                  slug={mensagem.slug}
                />
              </div>
              <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-5 pt-16">
                <span className="text-white/95 text-sm italic font-display">
                  {mensagem.imagemHero.alt}
                </span>
              </figcaption>
            </figure>
          )}

          <blockquote
            itemScope
            itemType="https://schema.org/Quotation"
            className="card-feature p-8 sm:p-10 mb-8 relative"
          >
            <p
              itemProp="text"
              className="font-display text-xl sm:text-2xl text-stone-800 leading-relaxed whitespace-pre-line"
            >
              {mensagem.conteudo}
            </p>
            <cite
              itemProp="creator"
              itemScope
              itemType="https://schema.org/Person"
              className="block not-italic text-sm text-stone-500 mt-6 pt-5 border-t border-warm-200/70"
            >
              — <a
                href={`/autor/${mensagem.autor.slug}/`}
                className="text-niver-700 hover:underline font-medium"
              >
                <span itemProp="name">{mensagem.autor.nome}</span>
              </a>
            </cite>
          </blockquote>

          {/* Ações inline (desktop) — mobile usa StickyActionBar */}
          <div className="hidden md:flex flex-wrap gap-2 mb-12">
            <CopyButton
              text={mensagem.conteudo}
              mensagemId={mensagem.id}
              label="Copiar mensagem"
            />
            <ShareMenu
              text={mensagem.conteudo}
              url={url}
              mensagemId={mensagem.id}
              promoteOnShare={(mensagem as { promoteOnShare?: boolean }).promoteOnShare ?? false}
            />
            <LikeButton mensagemId={mensagem.id} initialCount={mensagem.likes} />
          </div>

          {mensagem.resumo && (
            <div className="border-l-4 border-niver-300 pl-5 py-2 mb-12 italic text-stone-600">
              {mensagem.resumo}
            </div>
          )}
        </section>

        {/* RELACIONADAS */}
        {relacionadas.length > 0 && (
          <section className="container-niver py-10 border-t border-warm-200/60">
            <h2 className="heading-section-bar mb-6">
              Mais mensagens em {mensagem.cluster.nome}
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {relacionadas.slice(0, 4).map((m) => (
                <MessageCardRich
                  key={m.id}
                  mensagem={m}
                  nichoSlug={mensagem.cluster.nicho.slug}
                  noArticleMicrodata
                />
              ))}
            </div>
          </section>
        )}
      </article>

      {/* Sticky bottom action bar — só mobile */}
      <StickyActionBar
        text={mensagem.conteudo}
        url={url}
        mensagemId={mensagem.id}
        initialLikes={mensagem.likes}
      />
    </>
  );
}

// =====================================================
// HELPERS
// =====================================================

function makeFaqForCluster(nome: string): { pergunta: string; resposta: string }[] {
  return [
    {
      pergunta: `Como escolher a melhor mensagem ${nome.toLowerCase()}?`,
      resposta:
        "A melhor mensagem é aquela que ressoa com o que você sente. Leia algumas, escolha a que mais te tocar, e personalize com o nome ou um detalhe pessoal antes de mandar. As mais curtidas costumam ser as que tocam o coração de mais gente.",
    },
    {
      pergunta: `Posso copiar mensagens ${nome.toLowerCase()} pra mandar no WhatsApp?`,
      resposta:
        "Sim! Cada mensagem tem o botão Copiar — um clique e ela já vai pra área de transferência, pronta pra colar no WhatsApp, Telegram, SMS ou onde quiser.",
    },
    {
      pergunta: `As mensagens são originais ou copiadas de outros lugares?`,
      resposta:
        "São originais. Nossos autores escrevem cada uma com voz própria, sem usar fórmulas prontas. Toda mensagem passa por revisão editorial antes de ser publicada.",
    },
    {
      pergunta: `Tem mensagens curtas pra mandar rapidinho?`,
      resposta:
        "Tem sim. Em cada categoria você encontra mensagens de tamanhos variados — das bem curtinhas pro WhatsApp até as longas pra cartões e momentos especiais.",
    },
  ];
}
