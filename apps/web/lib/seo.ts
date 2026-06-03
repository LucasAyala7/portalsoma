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
      "Portal brasileiro de mensagens de aniversário originais — emocionantes, evangélicas, engraçadas e únicas — para mãe, pai, amiga, filha e mais.",
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
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "pt-BR",
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
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
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.nome,
    description: input.descricao,
    url: input.url.startsWith("http") ? input.url : `${SITE_URL}${input.url}`,
    inLanguage: "pt-BR",
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    mainEntity: { "@type": "ItemList", numberOfItems: input.itemsCount },
  };
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
