import { prisma } from "@nivertotal/db";
import { Card, Badge } from "../../lib/ui";

export const dynamic = "force-dynamic";

export default async function WebStoriesPage() {
  const [total, byStatus, items] = await Promise.all([
    prisma.webStory.count(),
    prisma.webStory.groupBy({ by: ["status"], _count: true }),
    prisma.webStory.findMany({ orderBy: { criadoEm: "desc" }, take: 30 }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Web Stories</h1>
      <p className="text-sm text-stone-500 mb-6">{total} totais — engine AMP em desenvolvimento (Sprint 2).</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {byStatus.map((g) => (
          <Card key={g.status} className="p-4">
            <div className="text-xs uppercase text-stone-500">{g.status}</div>
            <div className="text-2xl font-semibold mt-1">{g._count}</div>
          </Card>
        ))}
        {byStatus.length === 0 && (
          <Card className="p-6 col-span-4 text-center text-stone-400 text-sm">
            Nenhum web story criado ainda. O worker de Web Stories será adicionado no Sprint 2.
          </Card>
        )}
      </div>

      {items.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase text-stone-600">
              <tr>
                <th className="text-left px-4 py-3">Tema</th>
                <th className="text-left px-4 py-3">Slug</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Frames</th>
                <th className="text-right px-4 py-3">Views</th>
                <th className="text-right px-4 py-3">Criado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((s) => {
                const frames = Array.isArray(s.frames) ? s.frames.length : 0;
                return (
                  <tr key={s.id} className="hover:bg-stone-50">
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{s.titulo}</div>
                      <div className="text-xs text-stone-500">{s.tema}</div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-stone-600">{s.slug}</td>
                    <td className="px-4 py-2.5 text-center"><Badge tone={s.status === "PUBLISHED" ? "green" : "amber"}>{s.status}</Badge></td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{frames}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{s.views.toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-stone-500">{s.criadoEm.toLocaleDateString("pt-BR")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
