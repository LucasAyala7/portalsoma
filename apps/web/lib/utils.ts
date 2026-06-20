import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve URL canonical de uma mensagem.
 * Cada mensagem vive em /[nicho]/[cluster]/[slug]/ · complemento NÃO entra no canonical
 * (evita canibalização: a mesma mensagem aparece em listagens de complementos
 * mas todas apontam pro canonical único).
 */
export function mensagemUrl(input: {
  nichoSlug: string;
  clusterSlug: string;
  slug: string;
}): string {
  return `/${input.nichoSlug}/${input.clusterSlug}/${input.slug}/`;
}

export function clusterUrl(nichoSlug: string, clusterSlug: string): string {
  return `/${nichoSlug}/${clusterSlug}/`;
}

export function complementoUrl(
  nichoSlug: string,
  clusterSlug: string,
  complementoSlug: string,
): string {
  return `/${nichoSlug}/${clusterSlug}/${complementoSlug}/`;
}

export function nichoUrl(nichoSlug: string): string {
  return `/${nichoSlug}/`;
}
