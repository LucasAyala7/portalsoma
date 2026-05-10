import { prisma } from "@nivertotal/db";
import { Card, Badge } from "../../lib/ui";

export const dynamic = "force-dynamic";

interface SearchParams {
  status?: string;
  q?: string;
  page?: string;
}

const PAGE_SIZE = 50;

export default async function RedirectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const statusFilter = sp.status ? parseInt(sp.status, 10) : undefined;
  const where = {
    ...(statusFilter && { status: statusFilter }),
    ...(sp.q && { origem: { contains: sp.q } }),
  };

  const [total, items, count301, count410] = await Promise.all([
    prisma.redirect.count({ where }),
    prisma.redirect.findMany({
      where,
      orderBy: { hits: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.redirect.count({ where: { status: 301 } }),
    prisma.redirect.count({ where: { status: 410 } }),
  ]);

  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Redirects ({total.toLocaleString("pt-BR")})</h1>
          <p className="text-sm text-stone-500">
            {count301.toLocaleString("pt-BR")} redirects 301 · {count410.toLocaleString("pt-BR")} GONE 410
          </p>
        </div>
      </div>

      <form className="bg-white rounded-xl border border-stone-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Status</label>
          <select name="status" defaultValue={sp.status ?? ""} className="px-3 py-1.5 border rounded-lg text-sm">
            <option value="">todos</option>
            <option value="301">301 (redirect)</option>
            <option value="410">410 (gone)</option>
          </select>
        </div>
        <div className="flex-1 min-w-48">
          <label className="block text-xs font-medium text-stone-500 mb-1">Buscar URL origem</label>
          <input name="q" defaultValue={sp.q ?? ""} className="w-full px-3 py-1.5 border rounded-lg text-sm" />
        </div>
        <button type="submit" className="bg-stone-900 text-white px-4 py-1.5 rounded-lg text-sm">Filtrar</button>
      </form>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase text-stone-600">
            <tr>
              <th className="text-left px-4 py-3">Origem</th>
              <th className="text-left px-4 py-3">Destino</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Hits</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((r) => (
              <tr key={r.id} className="hover:bg-stone-50">
                <td className="px-4 py-2 font-mono text-xs text-stone-700 max-w-md truncate" title={r.origem}>{r.origem}</td>
                <td className="px-4 py-2 font-mono text-xs text-stone-700 max-w-md truncate" title={r.destino}>{r.destino}</td>
                <td className="px-4 py-2 text-center"><Badge tone={r.status === 301 ? "blue" : "stone"}>{r.status}</Badge></td>
                <td className="px-4 py-2 text-right tabular-nums">{r.hits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {pages > 1 && (
        <div className="mt-4 flex justify-center gap-1.5 flex-wrap">
          {Array.from({ length: Math.min(pages, 12) }, (_, i) => i + 1).map((p) => (
            <a key={p} href={`?${new URLSearchParams({ ...sp, page: String(p) }).toString()}`}
               className={`px-3 py-1 rounded text-sm ${p === page ? "bg-niver-600 text-white" : "bg-white border border-stone-200"}`}>{p}</a>
          ))}
        </div>
      )}
    </div>
  );
}
