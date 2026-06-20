/**
 * Schema.org JSON-LD builders.
 * Cada builder retorna um objeto pronto pra <script type="application/ld+json">.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.portalsoma.com.br";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Portal Soma";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "Portal brasileiro de mensagens de aniversário originais · emocionantes, evangélicas, engraçadas e únicas · para mãe, pai, amiga, filha e mais.",
    inLanguage: "pt-BR",
    sameAs: [
      "https://www.instagram.com/portalsoma",
      "https://www.facebook.com/portalsoma",
      "https://twitter.com/portalsoma",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "contato@portalsoma.com.br",
      availableLanguage: ["Portuguese"],
      areaServed: "BR",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "BR",
    },
  };
}

export function webSiteWithSearchSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: "Portal Soma · Mensagens de Aniversário",
    url: SITE_URL,
    inLanguage: "pt-BR",
    publisher: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL },
    // SearchAction com target apontando pro form id="site-search" no header
    potentialAction: [
      {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/buscar/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    ],
  };
}

/** ItemList das seções do mega nav · match com microdata SiteNavigationElement do <nav> */
export interface SiteNavSection {
  titulo: string;
  items: { slug: string; nome: string }[];
}

export function siteNavigationItemListSchema(sections: SiteNavSection[], nichoSlug = "mensagem-de-aniversario") {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/#sitenavigation`,
    name: "Navegação principal",
    itemListElement: sections.flatMap((section, sIdx) =>
      section.items.map((item, iIdx) => ({
        "@type": "SiteNavigationElement",
        position: sIdx * 100 + iIdx + 1,
        name: item.nome,
        url: `${SITE_URL}/${nichoSlug}/${item.slug}/`,
      })),
    ),
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export interface MensagemSchemaInput {
  titulo: string;
  conteudo: string;
  slug: string;
  url: string;
  publicadoEm?: Date | null;
  atualizadoEm?: Date;
  autorNome: string;
  autorUrl: string;
  imagemUrl?: string | null;
  resumo?: string | null;
}

export function mensagemSchema(m: MensagemSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    headline: m.titulo,
    name: m.titulo,
    text: m.conteudo,
    description: m.resumo ?? m.conteudo.slice(0, 160),
    url: m.url.startsWith("http") ? m.url : `${SITE_URL}${m.url}`,
    inLanguage: "pt-BR",
    datePublished: m.publicadoEm?.toISOString(),
    dateModified: m.atualizadoEm?.toISOString(),
    author: {
      "@type": "Person",
      name: m.autorNome,
      url: m.autorUrl.startsWith("http") ? m.autorUrl : `${SITE_URL}${m.autorUrl}`,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    image: m.imagemUrl ?? undefined,
  };
}

export interface FaqItem {
  pergunta: string;
  resposta: string;
}

export function faqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.pergunta,
      acceptedAnswer: { "@type": "Answer", text: item.resposta },
    })),
  };
}

export function collectionSchema(input: {
  nome: string;
  descricao: string;
  url: string;
  itemsCount: number;
  /** CSS selectors a marcar como Speakable · Google Assistant TTS + GEO. */
  speakableSelectors?: string[];
}) {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.nome,
    description: input.descricao,
    url: input.url.startsWith("http") ? input.url : `${SITE_URL}${input.url}`,
    inLanguage: "pt-BR",
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    mainEntity: { "@type": "ItemList", numberOfItems: input.itemsCount },
  };
  if (input.speakableSelectors && input.speakableSelectors.length > 0) {
    base.speakable = {
      "@type": "SpeakableSpecification",
      cssSelector: input.speakableSelectors,
    };
  }
  return base;
}

export function authorSchema(input: {
  nome: string;
  bio: string;
  fotoUrl?: string | null;
  slug: string;
  redes?: Record<string, string> | null;
}) {
  const sameAs = input.redes ? Object.values(input.redes).filter(Boolean) : [];
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.nome,
    description: input.bio,
    image: input.fotoUrl ?? undefined,
    url: `${SITE_URL}/autor/${input.slug}/`,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}

export interface ItemListEntry {
  url: string;
  name: string;
}

export function itemListSchema(items: ItemListEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: it.url.startsWith("http") ? it.url : `${SITE_URL}${it.url}`,
      name: it.name,
    })),
  };
}

/** Article enriched + interactionStatistic · pra usar dentro de ItemList enriched. */
export interface ArticleListEntry {
  position: number;
  url: string;
  titulo: string;
  resumo?: string | null;
  imageUrl?: string | null;
  autorNome: string;
  autorUrl: string;
  publicadoEm?: Date | null;
  likes: number;
  copies: number;
  shares: number;
  visualizacoes: number;
}

export function articleListItemSchema(m: ArticleListEntry) {
  const url = m.url.startsWith("http") ? m.url : `${SITE_URL}${m.url}`;
  return {
    "@type": "ListItem",
    position: m.position,
    item: {
      "@type": "Article",
      "@id": url,
      headline: m.titulo,
      name: m.titulo,
      description: m.resumo ?? undefined,
      url,
      image: m.imageUrl ?? undefined,
      inLanguage: "pt-BR",
      datePublished: m.publicadoEm?.toISOString(),
      author: {
        "@type": "Person",
        name: m.autorNome,
        url: m.autorUrl.startsWith("http") ? m.autorUrl : `${SITE_URL}${m.autorUrl}`,
      },
      publisher: {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
      },
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: { "@type": "LikeAction" },
          userInteractionCount: m.likes,
        },
        {
          "@type": "InteractionCounter",
          interactionType: { "@type": "WriteAction" },
          userInteractionCount: m.copies,
        },
        {
          "@type": "InteractionCounter",
          interactionType: { "@type": "ShareAction" },
          userInteractionCount: m.shares,
        },
        {
          "@type": "InteractionCounter",
          interactionType: { "@type": "ReadAction" },
          userInteractionCount: m.visualizacoes,
        },
      ],
    },
  };
}

/** ItemList enriched de Articles (mensagens) · para Home/Cluster/Autor */
export function enrichedItemListSchema(items: ArticleListEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((m) => articleListItemSchema(m)),
  };
}

/** ListItem com BlogPosting + interactionStatistic · para listagens de posts blog */
export interface BlogPostListEntry {
  position: number;
  url: string;
  titulo: string;
  resumo?: string | null;
  imageUrl?: string | null;
  autorNome: string;
  autorUrl: string;
  categoriaNome: string;
  publicadoEm?: Date | null;
  wordCount?: number | null;
  likes: number;
  shares: number;
  visualizacoes: number;
  copies: number;
}

export function blogPostListItemSchema(p: BlogPostListEntry) {
  const url = p.url.startsWith("http") ? p.url : `${SITE_URL}${p.url}`;
  return {
    "@type": "ListItem",
    position: p.position,
    item: {
      "@type": "BlogPosting",
      "@id": url,
      headline: p.titulo,
      description: p.resumo ?? undefined,
      url,
      image: p.imageUrl ?? undefined,
      inLanguage: "pt-BR",
      datePublished: p.publicadoEm?.toISOString(),
      wordCount: p.wordCount ?? undefined,
      articleSection: p.categoriaNome,
      author: {
        "@type": "Person",
        name: p.autorNome,
        url: p.autorUrl.startsWith("http") ? p.autorUrl : `${SITE_URL}${p.autorUrl}`,
      },
      publisher: {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
      },
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: { "@type": "LikeAction" },
          userInteractionCount: p.likes,
        },
        {
          "@type": "InteractionCounter",
          interactionType: { "@type": "ShareAction" },
          userInteractionCount: p.shares,
        },
        {
          "@type": "InteractionCounter",
          interactionType: { "@type": "ReadAction" },
          userInteractionCount: p.visualizacoes,
        },
        {
          "@type": "InteractionCounter",
          interactionType: { "@type": "WriteAction" },
          userInteractionCount: p.copies,
        },
      ],
    },
  };
}

export function enrichedBlogItemListSchema(items: BlogPostListEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((p) => blogPostListItemSchema(p)),
  };
}

export interface CreativeWorkWithInteractionInput extends MensagemSchemaInput {
  likes: number;
  copies: number;
  shares: number;
  visualizacoes: number;
  autorBio?: string | null;
  autorFotoUrl?: string | null;
  autorRedes?: Record<string, string> | null;
}

export function creativeWorkWithInteractionSchema(m: CreativeWorkWithInteractionInput) {
  const base = mensagemSchema(m);
  const sameAs = m.autorRedes
    ? Object.values(m.autorRedes).filter((v): v is string => Boolean(v))
    : [];
  return {
    ...base,
    author: {
      "@type": "Person",
      name: m.autorNome,
      url: m.autorUrl.startsWith("http") ? m.autorUrl : `${SITE_URL}${m.autorUrl}`,
      description: m.autorBio ?? undefined,
      image: m.autorFotoUrl ?? undefined,
      sameAs: sameAs.length > 0 ? sameAs : undefined,
    },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: { "@type": "LikeAction" },
        userInteractionCount: m.likes,
      },
      {
        "@type": "InteractionCounter",
        interactionType: { "@type": "WriteAction" },
        userInteractionCount: m.copies,
      },
      {
        "@type": "InteractionCounter",
        interactionType: { "@type": "ShareAction" },
        userInteractionCount: m.shares,
      },
      {
        "@type": "InteractionCounter",
        interactionType: { "@type": "ReadAction" },
        userInteractionCount: m.visualizacoes,
      },
    ],
  };
}

export interface ProfilePageSchemaInput {
  nome: string;
  bio: string;
  fotoUrl?: string | null;
  slug: string;
  redes?: Record<string, string> | null;
}

export function profilePageSchema(input: ProfilePageSchemaInput) {
  const url = `${SITE_URL}/autor/${input.slug}/`;
  const sameAs = input.redes
    ? Object.values(input.redes).filter((v): v is string => Boolean(v))
    : [];
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    inLanguage: "pt-BR",
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    mainEntity: {
      "@type": "Person",
      name: input.nome,
      description: input.bio,
      image: input.fotoUrl ?? undefined,
      url,
      sameAs: sameAs.length > 0 ? sameAs : undefined,
    },
  };
}

export function jsonLdScript(schema: object | object[]) {
  return {
    __html: JSON.stringify(Array.isArray(schema) ? schema : [schema]),
  };
}
