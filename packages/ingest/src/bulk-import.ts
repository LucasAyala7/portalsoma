/**
 * Bulk import de planilha CSV/XLSX.
 * Colunas suportadas (todas opcionais exceto titulo + clusterSlug):
 *   titulo, slug, clusterSlug, complementoSlug, autorSlug, personaSlug,
 *   conteudo, resumo, gerar_imagem, tier, status_inicial
 *
 * Linhas com `conteudo` vazio entram na fila de geração IA.
 * Linhas com `gerar_imagem=true` entram na fila de geração de imagem.
 */

import { prisma } from "@nivertotal/db";
import { z } from "zod";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const RowSchema = z.object({
  titulo: z.string().min(1),
  slug: z.string().optional(),
  clusterSlug: z.string().min(1),
  complementoSlug: z.string().optional(),
  autorSlug: z.string().optional(),
  personaSlug: z.string().optional(),
  conteudo: z.string().optional(),
  resumo: z.string().optional(),
  gerar_imagem: z.union([z.boolean(), z.string()]).optional().transform((v) => v === true || v === "true" || v === "1" || v === "sim"),
  tier: z.enum(["TIER_1", "TIER_2", "TIER_3"]).optional().default("TIER_3"),
  status_inicial: z.enum(["DRAFT", "REVIEW", "PUBLISHED"]).optional().default("DRAFT"),
});
export type ImportRow = z.infer<typeof RowSchema>;

export interface BulkImportResult {
  total: number;
  validas: number;
  invalidas: number;
  importadas: number;
  duplicadas: number;
  erros: { linha: number; erro: string }[];
  jobsAi: number;
  jobsImagem: number;
}

export function parseCSV(content: string): { rows: Record<string, string>[]; errors: Papa.ParseError[] } {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return { rows: result.data, errors: result.errors };
}

export function parseXLSX(buffer: Buffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]!];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

export interface ProcessOptions {
  importId: string;
  dryRun?: boolean;
  defaultAutorSlug?: string;
  enqueueAi?: (mensagemId: string) => Promise<void>;
  enqueueImagem?: (mensagemId: string) => Promise<void>;
}

export async function processRows(
  rawRows: Record<string, unknown>[],
  options: ProcessOptions,
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    total: rawRows.length,
    validas: 0,
    invalidas: 0,
    importadas: 0,
    duplicadas: 0,
    erros: [],
    jobsAi: 0,
    jobsImagem: 0,
  };

  for (let i = 0; i < rawRows.length; i++) {
    const linha = i + 2; // +1 cabeçalho +1 base 1
    const raw = rawRows[i]!;
    const parsed = RowSchema.safeParse(raw);
    if (!parsed.success) {
      result.invalidas++;
      result.erros.push({ linha, erro: parsed.error.errors[0]?.message ?? "validação falhou" });
      continue;
    }
    result.validas++;

    const row = parsed.data;

    const cluster = await prisma.cluster.findFirst({
      where: { slug: row.clusterSlug, ativo: true },
    });
    if (!cluster) {
      result.erros.push({ linha, erro: `cluster "${row.clusterSlug}" não existe` });
      continue;
    }

    const complemento = row.complementoSlug
      ? await prisma.complemento.findFirst({
          where: { slug: row.complementoSlug, clusterId: cluster.id, ativo: true },
        })
      : null;

    const autorSlug = row.autorSlug ?? options.defaultAutorSlug ?? "equipe-editorial";
    const autor = await prisma.author.findUnique({ where: { slug: autorSlug } });
    if (!autor) {
      result.erros.push({ linha, erro: `autor "${autorSlug}" não existe` });
      continue;
    }

    const persona = row.personaSlug
      ? await prisma.persona.findUnique({ where: { slug: row.personaSlug } })
      : null;

    const slug = row.slug ?? gerarSlug(row.titulo);

    if (options.dryRun) {
      result.importadas++;
      if (!row.conteudo) result.jobsAi++;
      if (row.gerar_imagem) result.jobsImagem++;
      continue;
    }

    try {
      const mensagem = await prisma.mensagem.upsert({
        where: { slug },
        create: {
          slug,
          titulo: row.titulo,
          conteudo: row.conteudo ?? "",
          resumo: row.resumo,
          clusterId: cluster.id,
          complementoId: complemento?.id,
          autorId: autor.id,
          personaId: persona?.id,
          status: row.conteudo ? row.status_inicial : "DRAFT",
          tier: row.tier,
          origem: "IMPORT_BULK",
        },
        update: {
          titulo: row.titulo,
          ...(row.conteudo && { conteudo: row.conteudo }),
        },
      });

      if (!row.conteudo && options.enqueueAi) {
        await options.enqueueAi(mensagem.id);
        result.jobsAi++;
      }
      if (row.gerar_imagem && options.enqueueImagem) {
        await options.enqueueImagem(mensagem.id);
        result.jobsImagem++;
      }

      result.importadas++;
    } catch (e) {
      const erro = e instanceof Error ? e.message : String(e);
      if (erro.includes("Unique") || erro.includes("duplicate")) result.duplicadas++;
      result.erros.push({ linha, erro });
    }
  }

  await prisma.bulkImport.update({
    where: { id: options.importId },
    data: {
      processadas: result.total,
      sucessos: result.importadas,
      falhas: result.erros.length,
      status: "COMPLETED",
      finalizadoEm: new Date(),
      errosLog: result.erros,
    },
  });

  return result;
}

function gerarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}
