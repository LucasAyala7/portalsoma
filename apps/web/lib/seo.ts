/**
 * Schema.org JSON-LD builders.
 * Cada builder retorna um objeto pronto pra <script type="application/ld+json">.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.portalsoma.com.br";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Portal Soma";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "pt-BR",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/busca/?q={query}`,
      "query-input": "required name=query",
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

export function jsonLdScript(schema: object | object[]) {
  return {
    __html: JSON.stringify(Array.isArray(schema) ? schema : [schema]),
  };
}
