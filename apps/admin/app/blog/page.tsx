import Link from "next/link";
import { prisma } from "@nivertotal/db";
import { Badge, Button, Card } from "../../lib/ui";

interface SearchParams {
  status?: string;
  categoria?: string;
  q?: string;
  page?: string;
}

const PAGE_SIZE = 30;

const STATUS_TONE: Record<string, "amber" | "green" | "red" | "stone"> = {
  REVIEW: "amber",
  PUBLISHED: "green",
  REJECTED: "red",
  ARCHIVED: "stone",
  DRAFT: "stone",
};

export default async function BlogList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const where = {
    ...(sp.status && { status: sp.status as "DRAFT" | "REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED" }),
    ...(sp.categoria && { categoria: { slug: sp.categoria } }),
    ...(sp.q && {
      OR: [
        { titulo: { contains: sp.q, mode: "insensitive" as const } },
        { conteudo: { contains: sp.q, mode: "insensitive" as const } },
      ],
    }),
  };

  const [items, total, categorias] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        categoria: { select: { slug: true, nome: true } },
        autor: { select: { nome: true } },
      },
      orderBy: { criadoEm: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.post.count({ where }),
    prisma.blogCategory.findMany({
      where: { ativo: true },
      select: { slug: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          Blog <span className="text-stone-400 text-base font-normal">({total.toLocaleString("pt-BR")})</span>
        </h1>
        <div className="flex gap-2">
          <Link href="/blog/nova">
            <Button variant="primary">+ Novo post</Button>
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
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Categoria</label>
            <select name="categoria" defaultValue={sp.categoria ?? ""} className="px-3 py-1.5 border rounded-lg text-sm">
              <option value="">todas</option>
              {categorias.map((c) => (
                <option key={c.slug} value={c.slug}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-stone-500 mb-1">Buscar</label>
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="título ou conteúdo"
              className="w-full px-3 py-1.5 border rounded-lg text-sm"
            />
          </div>
          <Button variant="secondary" type="submit">Filtrar</Button>
        </form>
      </Card>

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-wide text-stone-600">
            <tr>
              <th className="text-left px-3 py-2.5">Post</th>
              <th className="text-left px-3 py-2.5">Categoria</th>
              <th className="text-left px-3 py-2.5">Autor</th>
              <th className="text-center px-3 py-2.5">Status</th>
              <th className="text-right px-3 py-2.5">Palavras</th>
              <th className="text-right px-3 py-2.5">Leitura</th>
              <th className="text-right px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((p) => (
              <tr key={p.id} className="hover:bg-stone-50">
                <td className="px-3 py-2.5 max-w-md">
                  <Link href={`/blog/${p.id}`} className="block group">
                    <div className="font-medium text-stone-900 group-hover:underline truncate">{p.titulo}</div>
                    <div className="text-xs text-stone-500 truncate font-mono">/{p.slug}</div>
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <span className="bg-amber-50 text-amber-800 px-1.5 rounded text-xs">{p.categoria.nome}</span>
                </td>
                <td className="px-3 py-2.5 text-stone-600 text-xs">{p.autor.nome}</td>
                <td className="px-3 py-2.5 text-center">
                  <Badge tone={STATUS_TONE[p.status] ?? "stone"}>{p.status}</Badge>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-stone-600">{p.wordCount ?? "—"}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-stone-600">
                  {p.tempoLeitura ? `${p.tempoLeitura} min` : "—"}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Link href={`/blog/${p.id}`} className="text-niver-600 hover:underline text-xs">
                    Editar →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="p-12 text-center text-stone-400 text-sm">
            Nenhum post encontrado.
            {" "}
            <Link href="/blog/nova" className="text-niver-600 hover:underline">Criar o primeiro</Link>.
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-6 flex justify-center gap-1.5 flex-wrap">
          {Array.from({ length: Math.min(pages, 12) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={{ pathname: "/blog", query: { ...sp, page: String(p) } }}
              className={`px-3 py-1 rounded text-sm ${p === page ? "bg-niver-600 text-white" : "bg-white border border-stone-200"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
