import Link from "next/link";
import { prisma } from "@nivertotal/db";
import { Button, Card } from "../../lib/ui";
import { MensagensTable } from "./MensagensTable";

interface SearchParams {
  status?: string;
  cluster?: string;
  persona?: string;
  tipo?: string;
  origem?: string;
  q?: string;
  qmin?: string;
  page?: string;
}

const PAGE_SIZE = 30;

export default async function MensagensList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const where = {
    ...(sp.status && { status: sp.status as "DRAFT" | "REVIEW" | "PUBLISHED" | "REJECTED" }),
    ...(sp.cluster && { cluster: { slug: sp.cluster } }),
    ...(sp.persona && { persona: { slug: sp.persona } }),
    ...(sp.tipo && { tipo: sp.tipo as "CURTA" | "MEDIA" | "LONGA" | "POEMA" }),
    ...(sp.origem && { origem: sp.origem as "IA" | "MANUAL" | "IMPORT_WP" | "IMPORT_BULK" }),
    ...(sp.q && {
      OR: [
        { titulo: { contains: sp.q, mode: "insensitive" as const } },
        { conteudo: { contains: sp.q, mode: "insensitive" as const } },
      ],
    }),
    ...(sp.qmin && { qualidade: { gte: parseFloat(sp.qmin) } }),
  };

  const [items, total, clusters, personas] = await Promise.all([
    prisma.mensagem.findMany({
      where,
      include: {
        cluster: { select: { slug: true, nome: true } },
        persona: { select: { slug: true, nome: true } },
        autor: { select: { nome: true } },
      },
      orderBy: { criadoEm: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.mensagem.count({ where }),
    prisma.cluster.findMany({ where: { ativo: true }, select: { slug: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.persona.findMany({ where: { ativo: true }, select: { slug: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);

  const pages = Math.ceil(total / PAGE_SIZE);

  const tableItems = items.map((m) => ({
    id: m.id,
    titulo: m.titulo,
    slug: m.slug,
    status: m.status,
    tipo: m.tipo,
    tier: m.tier,
    qualidade: m.qualidade,
    conteudoPreview: m.conteudo.slice(0, 200),
    cluster: m.cluster,
    persona: m.persona,
    autor: m.autor,
    wordCount: m.wordCount,
  }));

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          Mensagens <span className="text-stone-400 text-base font-normal">({total.toLocaleString("pt-BR")})</span>
        </h1>
        <div className="flex gap-2">
          <Link href="/mensagens/nova">
            <Button variant="primary">+ Nova mensagem</Button>
          </Link>
          <Link href="/mensagens/bulk-import">
            <Button variant="secondary">Bulk import</Button>
          </Link>
        </div>
      </div>

      <Card className="p-4 mb-6">
        <form className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Status</label>
            <select name="status" defaultValue={sp.status ?? ""} className="px-3 py-1.5 border rounded-lg text-sm">
              <option value="">todos</option>
              <option value="DRAFT">DRAFT</option>
              <option value="REVIEW">REVIEW</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Tipo</label>
            <select name="tipo" defaultValue={sp.tipo ?? ""} className="px-3 py-1.5 border rounded-lg text-sm">
              <option value="">todos</option>
              <option value="CURTA">CURTA</option>
              <option value="MEDIA">MEDIA</option>
              <option value="LONGA">LONGA</option>
              <option value="POEMA">POEMA</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Cluster</label>
            <select name="cluster" defaultValue={sp.cluster ?? ""} className="px-3 py-1.5 border rounded-lg text-sm">
              <option value="">todos</option>
              {clusters.map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Persona</label>
            <select name="persona" defaultValue={sp.persona ?? ""} className="px-3 py-1.5 border rounded-lg text-sm">
              <option value="">todas</option>
              {personas.map((p) => <option key={p.slug} value={p.slug}>{p.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Origem</label>
            <select name="origem" defaultValue={sp.origem ?? ""} className="px-3 py-1.5 border rounded-lg text-sm">
              <option value="">todas</option>
              <option value="IA">IA</option>
              <option value="MANUAL">Manual</option>
              <option value="IMPORT_WP">WP</option>
              <option value="IMPORT_BULK">Bulk</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Qualidade ≥</label>
            <input type="number" min="0" max="1" step="0.05" name="qmin" defaultValue={sp.qmin ?? ""} placeholder="0.85"
                   className="w-24 px-3 py-1.5 border rounded-lg text-sm" />
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-stone-500 mb-1">Buscar</label>
            <input name="q" defaultValue={sp.q ?? ""} placeholder="título ou conteúdo"
                   className="w-full px-3 py-1.5 border rounded-lg text-sm" />
          </div>
          <Button variant="secondary" type="submit">Filtrar</Button>
        </form>
      </Card>

      <MensagensTable items={tableItems} />

      {pages > 1 && (
        <div className="mt-6 flex justify-center gap-1.5 flex-wrap">
          {Array.from({ length: Math.min(pages, 12) }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={{ pathname: "/mensagens", query: { ...sp, page: String(p) } }}
                  className={`px-3 py-1 rounded text-sm ${p === page ? "bg-niver-600 text-white" : "bg-white border border-stone-200"}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
