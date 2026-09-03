import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import { GiftSuggestions } from "@/components/gift-suggestions";
import { relatedClusterSlugs } from "@/lib/cross-links";
import { postsParaCluster } from "@/lib/blog-cluster-map";
import { getCategoryIcon } from "@/lib/icons";
import {
  jsonLdScript,
  breadcrumbSchema,
  collectionSchema,
  faqSchema,
  enrichedItemListSchema,
  creativeWorkWithInteractionSchema,
  type ArticleListEntry,
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

/** Agregados e amostras pra renderizar o hub editorial do nicho. */
async function loadNichoHubExtras(nichoId: string) {
  const [agg, latestUpdate, destaques] = await Promise.all([
    prisma.mensagem.aggregate({
      where: { status: "PUBLISHED", cluster: { nichoId } },
      _count: { id: true },
      _sum: { likes: true, copies: true, shares: true, visualizacoes: true },
    }),
    prisma.mensagem.findFirst({
      where: { status: "PUBLISHED", cluster: { nichoId } },
      orderBy: { atualizadoEm: "desc" },
      select: { atualizadoEm: true },
    }),
    prisma.mensagem.findMany({
      where: { status: "PUBLISHED", cluster: { nichoId } },
      orderBy: [{ likes: "desc" }, { copies: "desc" }],
      take: 6,
      include: {
        autor: true,
        persona: true,
        cluster: { select: { slug: true } },
        imagemHero: true,
      },
    }),
  ]);
  return { agg, latestUpdate, destaques };
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
  // Skip DB no build · pages geradas on-demand via ISR
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
    case "nicho": {
      // Hub repositioning: foco em DISCOVERY / CATEGORIAS pra evitar canibalização com a home.
      // Home mira "Mensagens de Aniversário" intent brand+emocional.
      // Hub mira "categorias de mensagens" / "lista completa" intent navegação+autoridade.
      const ano = new Date().getFullYear();
      const totalCats = resolved.nicho.clusters.length;
      const totalMsgsAgg = await prisma.mensagem.count({
        where: { status: "PUBLISHED", cluster: { nichoId: resolved.nicho.id } },
      });
      const titleAuto = `Todas as Categorias de Mensagens de Aniversário ${ano} · ${totalCats} listas, ${totalMsgsAgg.toLocaleString("pt-BR")} mensagens`;
      const descAuto = `Navegue por ${totalCats} categorias de mensagens de aniversário organizadas por destinatário, ocasião e tom · ${totalMsgsAgg.toLocaleString("pt-BR")} mensagens curadas. Lista completa Portal Soma ${ano}.`;
      return {
        title: resolved.nicho.metaTitle ?? titleAuto,
        description: resolved.nicho.metaDesc ?? descAuto,
        alternates: { canonical: `/${resolved.nicho.slug}/` },
        openGraph: {
          title: resolved.nicho.metaTitle ?? titleAuto,
          description: resolved.nicho.metaDesc ?? descAuto,
          url: `https://www.portalsoma.com.br/${resolved.nicho.slug}/`,
          type: "website",
          siteName: "Portal Soma",
          locale: "pt_BR",
        },
      };
    }
    case "cluster": {
      // Title/description dinâmicos: KW primeiro (match exato com query) + bucket + ano
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
      const titleAuto = `Mensagens de Aniversário ${resolved.cluster.nome} · ${bucket} opções ${ano}`;
      const descAuto = `Mais de ${bucket.replace("+", "")} mensagens de aniversário ${resolved.cluster.nome.toLowerCase()} pra copiar e compartilhar. Curadoria editorial Portal Soma, atualizada em ${mes} ${ano}.`;
      const url = `https://www.portalsoma.com.br/${resolved.nicho.slug}/${resolved.cluster.slug}/`;
      return {
        title: resolved.cluster.metaTitle ?? titleAuto,
        description: resolved.cluster.metaDesc ?? descAuto,
        alternates: { canonical: `/${resolved.nicho.slug}/${resolved.cluster.slug}/` },
        openGraph: {
          title: resolved.cluster.metaTitle ?? titleAuto,
          description: resolved.cluster.metaDesc ?? descAuto,
          url,
          type: "website",
          siteName: "Portal Soma",
          locale: "pt_BR",
        },
      };
    }
    case "complemento": {
      const cAuto = await prisma.mensagem.count({
        where: { complementoId: resolved.complemento.id, status: "PUBLISHED" },
      });
      const anoComp = new Date().getFullYear();
      const titleAutoComp = `Mensagens de Aniversário ${resolved.cluster.nome} ${resolved.complemento.nome} · ${anoComp}`;
      const descAutoComp =
        resolved.complemento.descricao ??
        `${cAuto > 0 ? `${cAuto} ` : ""}mensagens de aniversário ${resolved.cluster.nome.toLowerCase()} ${resolved.complemento.nome.toLowerCase()} pra copiar e compartilhar. Curadoria Portal Soma ${anoComp}.`;
      const urlComp = `https://www.portalsoma.com.br/${resolved.nicho.slug}/${resolved.cluster.slug}/${resolved.complemento.slug}/`;
      return {
        title: resolved.complemento.metaTitle ?? titleAutoComp,
        description: resolved.complemento.metaDesc ?? descAutoComp,
        alternates: { canonical: `/${resolved.nicho.slug}/${resolved.cluster.slug}/${resolved.complemento.slug}/` },
        openGraph: {
          title: resolved.complemento.metaTitle ?? titleAutoComp,
          description: resolved.complemento.metaDesc ?? descAutoComp,
          url: urlComp,
          type: "website",
          siteName: "Portal Soma",
          locale: "pt_BR",
        },
      };
    }
    case "single": {
      const m = resolved.mensagem;
      const url = mensagemUrl({
        nichoSlug: m.cluster.nicho.slug,
        clusterSlug: m.cluster.slug,
        slug: m.slug,
      });
      // OG dinâmica com texto da mensagem · CTR x2 em compartilhamento.
      // Fallback pro hero estático se a rota /api/og falhar.
      const ogDynamic = `https://www.portalsoma.com.br/api/og?id=${m.id}`;
      return {
        title: m.titulo,
        description: m.resumo ?? m.conteudo.slice(0, 155),
        alternates: { canonical: url },
        openGraph: {
          type: "article",
          title: m.titulo,
          description: m.resumo ?? m.conteudo.slice(0, 155),
          url,
          images: [
            { url: ogDynamic, width: 1200, height: 630, alt: m.titulo },
            ...(m.imagemOg ? [{ url: m.imagemOg.url }] : []),
            ...(m.imagemHero ? [{ url: m.imagemHero.url }] : []),
          ],
          publishedTime: m.publicadoEm?.toISOString(),
          modifiedTime: m.atualizadoEm.toISOString(),
          authors: [m.autor.nome],
          siteName: "Portal Soma",
          locale: "pt_BR",
        },
        twitter: {
          card: "summary_large_image",
          title: m.titulo,
          description: m.resumo ?? m.conteudo.slice(0, 155),
          images: [ogDynamic],
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
// NICHO HUB · pillar page editorial
// =====================================================

const NICHO_FAQ: { q: string; a: string }[] = [
  {
    q: "Como escolher a mensagem de aniversário certa?",
    a: "Comece pela relação com o aniversariante (mãe, amigo, namorada, chefe), depois pense no tom: emocional para pessoas próximas, leve e bem-humorada para colegas, religiosa quando a fé é parte da vida da pessoa. Por fim, ajuste o tamanho ao canal: curtas para status e WhatsApp, longas para cartões e cartas. Aqui o portal já organiza as mensagens por essas três dimensões.",
  },
  {
    q: "Qual o tamanho ideal de uma mensagem de aniversário?",
    a: "Para status, post e WhatsApp, ideal é até 280 caracteres · caibe na tela e é fácil de copiar. Para cartões físicos e mensagens mais íntimas, mensagens de 3 a 6 frases funcionam bem. Em homenagens públicas (post longo, discurso), 8 a 12 linhas dão espaço para histórias e referências pessoais.",
  },
  {
    q: "Posso usar uma mensagem do Portal Soma e personalizar?",
    a: "Sim. As mensagens existem para serem ponto de partida. Troque nomes, datas, lembranças específicas e ajustes de tom para o seu vínculo. Quanto mais detalhe pessoal você acrescenta, mais a mensagem soa autêntica para quem recebe.",
  },
  {
    q: "Existe diferença entre mensagem evangélica, católica e bíblica?",
    a: "Sim. Bíblica costuma trazer versículo literal (Salmos, Provérbios, Coríntios) sem afiliação denominacional. Católica tende a usar referências marianas, santos e linguagem litúrgica. Evangélica enfatiza a graça, o testemunho e expressões como 'Deus abençoe'. O portal mantém categorias separadas para você acertar o tom da pessoa.",
  },
  {
    q: "Quando enviar uma mensagem de aniversário antecipada?",
    a: "Quando você não vai poder cumprimentar no dia (viagem, fuso, agenda), a mensagem antecipada faz sentido · sempre marcando que é antecipada. Em geral, evitar antecipar para a véspera ou dois dias antes em culturas que consideram isso azar; o ideal é enviar no dia ou, se atrasou, no dia seguinte com uma justificativa breve.",
  },
  {
    q: "Quantas mensagens estão disponíveis e com que frequência são atualizadas?",
    a: "Hoje são mais de 3.700 mensagens distribuídas em 118 categorias. A curadoria editorial é contínua: novas mensagens entram semanalmente, e categorias com maior demanda (mãe, amiga, marido, evangélica) são reforçadas em ciclos mensais.",
  },
];

const INTRO_EDITORIAL = `Mensagem de aniversário é um dos textos mais antigos e cotidianos que escrevemos. Está em cartões, em status do WhatsApp, em legenda de foto, em discurso de festa, em mensagem privada que ninguém vê. E ainda assim continua difícil · porque o gênero parece simples mas exige equilíbrio entre afeto, oportunidade e voz. Uma frase genérica esfria. Uma frase íntima demais constrange. Uma frase comprida demais cansa. Uma curta demais pode soar descuidada.

O Portal Soma é uma curadoria editorial brasileira focada em ajudar a encontrar a mensagem certa para a pessoa certa. As mensagens são organizadas por três dimensões: para quem (relação), para quando (ocasião) e como (tom). Você encontra opções para mãe, pai, amiga, marido, esposa, filho, sobrinho, chefe, cliente, padrinho · mas também por idade, por estilo religioso, por humor, por ocasião marcante. Cada categoria abre uma lista longa de variações para você escolher a que combina com o vínculo.`;

const COMO_ESCOLHER = `Antes de copiar a primeira mensagem que aparece, vale uma pergunta: como é o vínculo de vocês? Mensagem para uma amiga de quinze anos não é a mesma coisa que mensagem para um chefe que você admira mas não conhece de perto. O grau de intimidade define o vocabulário, o tom e o tamanho. Mensagens curtas funcionam bem para vínculos profissionais e cumprimentos cordiais; mensagens longas brilham nas relações íntimas, onde memórias específicas valem mais que ornamentos.

Outra escolha que pesa: a pessoa tem fé como parte central da vida? Se sim, uma mensagem bíblica, católica ou evangélica costuma chegar mais fundo do que uma genérica. Se não, frases religiosas podem soar deslocadas. Em homenagens públicas, considere o que a pessoa gostaria de ler · não o que você acha bonito. E sempre que possível, acrescente um detalhe pessoal: uma lembrança compartilhada, uma piada interna, um agradecimento concreto. É o detalhe que transforma cumprimento em homenagem.`;

const TIPO_SECOES: { tipo: string; titulo: string; intro: string }[] = [
  {
    tipo: "DESTINATARIO",
    titulo: "Por relação · para quem é a mensagem",
    intro: "A escolha mais importante. Mãe, marido, melhor amiga, sobrinho, chefe · cada vínculo pede tom, vocabulário e tamanho diferentes. Comece pelo destinatário e o restante se ajusta.",
  },
  {
    tipo: "OCASIAO",
    titulo: "Por ocasião · momento de vida e idade",
    intro: "Aniversário de 15 anos não pede o mesmo discurso de aniversário de 60. Aqui as mensagens são organizadas por marcos: infância, vida adulta, virada de década, aniversário póstumo, datas que pedem palavras específicas.",
  },
  {
    tipo: "TOM",
    titulo: "Por tom e estilo de escrita",
    intro: "Emocional, bíblica, evangélica, católica, romântica, engraçada, curta para status, formal para profissional. Filtre pelo registro que combina com a pessoa.",
  },
  {
    tipo: "CANAL",
    titulo: "Por canal de publicação",
    intro: "Status do WhatsApp, post de Instagram, cartão escrito à mão. Cada canal tem sua extensão e o seu ritmo de leitura. Categorias específicas para quem precisa de algo pronto para colar.",
  },
  {
    tipo: "FALECIDO",
    titulo: "Em memória · homenagens póstumas",
    intro: "Quando alguém querido já não está, o aniversário continua existindo na lembrança. Aqui ficam as mensagens que celebram a memória com respeito e afeto.",
  },
];

async function NichoHub({ data }: { data: NichoData }) {
  const { agg, latestUpdate, destaques } = await loadNichoHubExtras(data.id);

  const totalMsgs = agg._count.id ?? 0;
  const totalLikes = agg._sum.likes ?? 0;
  const totalCopies = agg._sum.copies ?? 0;
  const totalShares = agg._sum.shares ?? 0;
  const totalViews = agg._sum.visualizacoes ?? 0;

  // Agrupa clusters por tipo
  const clustersByTipo: Record<string, typeof data.clusters> = {};
  for (const c of data.clusters) {
    const t = c.tipo ?? "OUTROS";
    if (!clustersByTipo[t]) clustersByTipo[t] = [];
    clustersByTipo[t].push(c);
  }

  const ano = new Date().getFullYear();
  const ultimaAtualizacao = latestUpdate?.atualizadoEm ?? new Date();
  const mesUltimo = MESES_PT[ultimaAtualizacao.getMonth()];

  // Mensagens em destaque mapeadas pro card rich
  const destaquesCards = destaques.map((m) => ({
    id: m.id,
    slug: m.slug,
    titulo: m.titulo,
    conteudo: m.conteudo,
    likes: m.likes,
    copies: m.copies,
    shares: m.shares,
    visualizacoes: m.visualizacoes,
    autor: m.autor,
    persona: m.persona,
    cluster: m.cluster,
    publicadoEm: m.publicadoEm,
    imagemHero: m.imagemHero,
  }));

  // ItemList JSON-LD pra categorias top
  const categoriasItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Categorias de mensagens de aniversário",
    numberOfItems: data.clusters.length,
    itemListElement: data.clusters.slice(0, 30).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Thing",
        name: c.nome,
        url: `https://www.portalsoma.com.br/${data.slug}/${c.slug}/`,
        description: c.descricao ?? `${c._count.mensagens} mensagens de aniversário ${c.nome.toLowerCase()}`,
      },
    })),
  };

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
            descricao: data.descricao ?? INTRO_EDITORIAL.slice(0, 160),
            url: `/${data.slug}/`,
            itemsCount: totalMsgs,
            speakableSelectors: [".speakable-intro", ".speakable-pillar"],
          }),
          categoriasItemList,
          enrichedItemListSchema(
            destaquesCards.map((m, i): ArticleListEntry => ({
              position: i + 1,
              url: mensagemUrl({
                nichoSlug: data.slug,
                clusterSlug: m.cluster.slug,
                slug: m.slug,
              }),
              titulo: m.titulo,
              resumo: m.conteudo.slice(0, 155),
              imageUrl: m.imagemHero?.url ?? null,
              autorNome: m.autor.nome,
              autorUrl: `/autor/${m.autor.slug}/`,
              publicadoEm: m.publicadoEm,
              likes: m.likes,
              copies: m.copies,
              shares: m.shares,
              visualizacoes: m.visualizacoes,
            })),
          ),
        ])}
      />

      <article
        itemScope
        itemType="https://schema.org/CollectionPage"
      >
        <meta itemProp="name" content={`${data.nome} · Portal Soma`} />
        <meta itemProp="description" content={data.descricao ?? INTRO_EDITORIAL.slice(0, 160)} />
        <meta itemProp="inLanguage" content="pt-BR" />
        <meta itemProp="dateModified" content={ultimaAtualizacao.toISOString()} />

        {/* Breadcrumb microdata */}
        <nav
          itemScope
          itemType="https://schema.org/BreadcrumbList"
          aria-label="Breadcrumb"
          className="container-niver pt-4 text-xs text-stone-500"
        >
          <ol className="flex flex-wrap items-center gap-1.5">
            <li
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              <a href="/" itemProp="item" className="hover:text-niver-700">
                <span itemProp="name">Início</span>
              </a>
              <meta itemProp="position" content="1" />
            </li>
            <li aria-hidden className="text-stone-400">/</li>
            <li
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
              aria-current="page"
            >
              <span itemProp="name" className="text-stone-700 font-medium">{data.nome}</span>
              <meta itemProp="position" content="2" />
            </li>
          </ol>
        </nav>

        {/* HERO */}
        <header className="relative bg-gradient-to-b from-niver-50 to-warm-50 py-12 sm:py-16 overflow-hidden">
          <div className="container-niver">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-medium text-niver-700 bg-niver-100 px-3 py-1.5 rounded-full mb-4">
                <BookOpen size={12} strokeWidth={2.4} /> Índice editorial completo
              </span>
              <h1
                itemProp="headline"
                className="font-display text-3xl sm:text-5xl text-niver-900 max-w-4xl mx-auto leading-tight"
              >
                Todas as Categorias de Mensagens de Aniversário
              </h1>
              <p className="mt-4 text-stone-700 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                {data.clusters.length} categorias organizadas por destinatário, ocasião, tom e canal —
                {totalMsgs.toLocaleString("pt-BR")} mensagens curadas pra você encontrar a certa em segundos.
              </p>
              <p className="mt-3 text-xs text-stone-500">
                Atualizado em {mesUltimo} de {ano}
              </p>
            </div>

            <CounterBoard
              items={[
                { icon: BookOpen, label: "mensagens", value: totalMsgs, highlight: true },
                { icon: Heart, label: "curtidas", value: totalLikes },
                { icon: Copy, label: "cópias", value: totalCopies },
                { icon: Share2, label: "compartilhamentos", value: totalShares },
                { icon: Eye, label: "visualizações", value: totalViews },
              ]}
            />
          </div>
        </header>

        {/* INTRO EDITORIAL · Speakable pra Google Assistant + GEO */}
        <section className="container-niver py-10 max-w-3xl">
          <h2 className="heading-section-bar mb-5 text-niver-800">
            O que é mensagem de aniversário?
          </h2>
          <div className="speakable-intro prose prose-stone max-w-none text-stone-700 leading-[1.85] text-[16px] sm:text-[17px] whitespace-pre-line">
            {INTRO_EDITORIAL}
          </div>
        </section>

        {/* MENSAGENS EM DESTAQUE */}
        {destaquesCards.length > 0 && (
          <section className="bg-white py-12 border-y border-stone-100">
            <div className="container-niver">
              <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
                <div>
                  <h2 className="heading-section-bar text-niver-800">Mensagens em destaque</h2>
                  <p className="text-sm text-stone-500 mt-1">
                    As mais curtidas e copiadas entre as {totalMsgs.toLocaleString("pt-BR")} mensagens do portal
                  </p>
                </div>
                <Flame size={28} className="text-orange-500" strokeWidth={2} />
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {destaquesCards.map((m, i) => (
                  <MessageCardRich
                    key={m.id}
                    mensagem={m}
                    nichoSlug={data.slug}
                    badge={i === 0 ? "trending" : i === 1 ? "top" : undefined}
                    destacada={i === 0}
                    priority={i === 0}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SEÇÕES POR TIPO */}
        {TIPO_SECOES.map((sec) => {
          const cs = clustersByTipo[sec.tipo];
          if (!cs || cs.length === 0) return null;
          const showCount = sec.tipo === "DESTINATARIO" ? 12 : 8;
          const visible = cs.slice(0, showCount);
          const restantes = cs.length - visible.length;
          return (
            <section key={sec.tipo} className="container-niver py-10">
              <div className="max-w-3xl mb-6">
                <h2 className="heading-section-bar text-niver-800">{sec.titulo}</h2>
                <p className="mt-2 text-stone-700 leading-relaxed text-[15px] sm:text-base">
                  {sec.intro}
                </p>
              </div>
              <CategoryGrid
                nichoSlug={data.slug}
                categorias={visible.map((c) => ({
                  slug: c.slug,
                  nome: c.nome,
                  totalMensagens: c._count.mensagens,
                  descricao: c.descricao ?? undefined,
                  iconConfig: getCategoryIcon(c.slug),
                }))}
              />
              {restantes > 0 && (
                <p className="mt-4 text-sm text-stone-500 text-center">
                  + {restantes} {restantes === 1 ? "categoria" : "categorias"} listadas abaixo
                </p>
              )}
            </section>
          );
        })}

        {/* EDITORIAL COMO ESCOLHER · Speakable pillar */}
        <section className="bg-warm-50 py-12 border-y border-stone-100">
          <div className="container-niver max-w-3xl">
            <h2 className="heading-section-bar mb-5 text-niver-800">
              Como escolher a mensagem certa
            </h2>
            <div className="speakable-pillar prose prose-stone max-w-none text-stone-700 leading-[1.85] text-[16px] sm:text-[17px] whitespace-pre-line">
              {COMO_ESCOLHER}
            </div>
          </div>
        </section>

        {/* TODAS AS CATEGORIAS */}
        <section className="container-niver py-12" id="todas-categorias">
          <div className="max-w-3xl mb-6">
            <h2 className="heading-section-bar text-niver-800">
              Todas as {data.clusters.length} categorias
            </h2>
            <p className="mt-2 text-stone-700 leading-relaxed text-[15px] sm:text-base">
              Lista completa em ordem de volume de busca. Cada categoria abre uma listagem
              extensa de mensagens curadas com botão de copiar, curtir e compartilhar.
            </p>
          </div>
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

        {/* FAQ texto (sem schema · Google deprecou rich snippet pra non-gov/health) */}
        <section className="bg-stone-50 py-12 border-t border-stone-100">
          <div className="container-niver max-w-3xl">
            <h2 className="heading-section-bar mb-6 text-niver-800">
              Perguntas frequentes sobre mensagens de aniversário
            </h2>
            <div className="space-y-6">
              {NICHO_FAQ.map((f) => (
                <div key={f.q}>
                  <h3 className="font-display text-lg text-stone-900 font-semibold mb-1.5">
                    {f.q}
                  </h3>
                  <p className="text-stone-700 leading-[1.75] text-[15px]">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </article>
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

  // Cross-links semânticos — clusters afins por tema (idade, família, tom)
  const crossSlugs = relatedClusterSlugs(cluster.slug);
  const crossLinks = crossSlugs.length > 0
    ? await prisma.cluster.findMany({
        where: { slug: { in: crossSlugs }, ativo: true, nichoId: nicho.id },
        include: { _count: { select: { mensagens: { where: { status: "PUBLISHED" } } } } },
      })
    : [];

  // Leitura relacionada no blog — fecha o ciclo de link interno (money page -> editorial)
  const blogSlugs = postsParaCluster(cluster.slug, 3);
  const postsRelacionados = blogSlugs.length > 0
    ? await prisma.post.findMany({
        where: { slug: { in: blogSlugs }, status: "PUBLISHED" },
        select: {
          slug: true,
          titulo: true,
          resumo: true,
          tempoLeitura: true,
          categoria: { select: { slug: true, nome: true } },
        },
      })
    : [];

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

      {/* HEADER 2 · hero SEO/GEO opening */}
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
            Mensagens de Aniversário {cluster.nome} · {bucket} opções {anoAtual}
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

      {/* ASIDE meta editorial · autores, blockquote TOP1, time freshness */}
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
                  · <span itemProp="creator">{topSemana[0].autor.nome}</span>, em{" "}
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

      {/* SECTION collection · listicle principal */}
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
            <p className="text-sm text-stone-500">Volte em breve · novas mensagens chegam diariamente.</p>
          </div>
        )}
      </section>

      {/* SECTION extras · fechamento editorial + FAQ texto livre (sem schema) */}
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

      {/* CROSS-LINKS SEMÂNTICOS — clusters afins pelo tema (idade, família, tom) */}
      {crossLinks.length > 0 && (
        <section className="container-niver py-8 border-t border-warm-100">
          <h2 className="heading-section-bar mb-6">
            <span>Você também vai gostar</span>
          </h2>
          <CategoryGrid
            nichoSlug={nicho.slug}
            categorias={crossLinks.map((c) => ({
              slug: c.slug,
              nome: c.nome,
              totalMensagens: c._count.mensagens,
              descricao: c.descricao ?? undefined,
              iconConfig: getCategoryIcon(c.slug),
            }))}
          />
        </section>
      )}

      {/* LEITURA RELACIONADA NO BLOG — conecta money page ao editorial */}
      {postsRelacionados.length > 0 && (
        <section className="container-niver py-10 border-t border-warm-100">
          <h2 className="heading-section-bar mb-6">
            <BookOpen size={20} className="text-niver-600" strokeWidth={2.4} />
            <span>Para entender melhor a data</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {postsRelacionados.map((p) => (
              <a
                key={p.slug}
                href={`/blog/${p.categoria.slug}/${p.slug}/`}
                className="group rounded-2xl border border-stone-100 bg-white hover:border-niver-200 hover:shadow-md transition-all p-5"
              >
                <span className="text-[11px] uppercase tracking-wider font-medium text-niver-600">
                  {p.categoria.nome}
                </span>
                <h3 className="font-display text-base text-stone-900 group-hover:text-niver-700 transition-colors mt-1.5 leading-snug">
                  {p.titulo}
                </h3>
                {p.resumo && (
                  <p className="text-sm text-stone-600 mt-2 line-clamp-2 leading-snug">{p.resumo}</p>
                )}
                {p.tempoLeitura && (
                  <span className="text-xs text-stone-400 mt-2.5 block">{p.tempoLeitura} min de leitura</span>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* FAQ accordion (legacy · só se sem editorial.faqTexto) */}
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
              · <a
                href={`/autor/${mensagem.autor.slug}/`}
                className="text-niver-700 hover:underline font-medium"
              >
                <span itemProp="name">{mensagem.autor.nome}</span>
              </a>
            </cite>
          </blockquote>

          {/* Ações inline (desktop) · mobile usa StickyActionBar */}
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

        {/* PRESENTES (afiliado Amazon) · contextual ao destinatário */}
        {mensagem.cluster.tipo === "DESTINATARIO" && (
          <section className="container-niver py-6 max-w-3xl">
            <GiftSuggestions destinatario={mensagem.cluster.nome.replace(/^Para\s+/i, "")} />
          </section>
        )}

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

      {/* Sticky bottom action bar · só mobile */}
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
        "Sim! Cada mensagem tem o botão Copiar · um clique e ela já vai pra área de transferência, pronta pra colar no WhatsApp, Telegram, SMS ou onde quiser.",
    },
    {
      pergunta: `As mensagens são originais ou copiadas de outros lugares?`,
      resposta:
        "São originais. Nossos autores escrevem cada uma com voz própria, sem usar fórmulas prontas. Toda mensagem passa por revisão editorial antes de ser publicada.",
    },
    {
      pergunta: `Tem mensagens curtas pra mandar rapidinho?`,
      resposta:
        "Tem sim. Em cada categoria você encontra mensagens de tamanhos variados · das bem curtinhas pro WhatsApp até as longas pra cartões e momentos especiais.",
    },
  ];
}
