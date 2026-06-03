import { prisma } from "@nivertotal/db";

/**
 * normalizeSlug: kebab-case ASCII puro (mesmo padrão de scripts/fix-slugs-unicode.ts).
 */
export function normalizeSlug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

/**
 * Garante slug único no model Post (sufixa -1, -2, ...). Se `excludeId` é dado, ignora collision do próprio.
 */
export async function garantirSlugUnico(base: string, excludeId?: string): Promise<string> {
  let candidate = base;
  let suffix = 0;
  while (true) {
    const c = suffix === 0 ? candidate : `${base}-${suffix}`;
    const existe = await prisma.post.findUnique({ where: { slug: c }, select: { id: true } });
    if (!existe || existe.id === excludeId) {
      return c;
    }
    suffix++;
    if (suffix > 100) {
      throw new Error("Falha ao gerar slug único após 100 tentativas");
    }
  }
}

export function calcWordCount(conteudo: string): number {
  return conteudo.trim().split(/\s+/).filter(Boolean).length;
}

export function calcTempoLeitura(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 200));
}

export function parseTags(tagsInput: string): string[] {
  return tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, 30);
}

export function stringifyTags(tags: string[]): string {
  return tags.join(", ");
}
