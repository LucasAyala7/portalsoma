import { prisma } from "@nivertotal/db";
import { Card, Badge } from "../../lib/ui";

export const dynamic = "force-dynamic";

export default async function AutoresPage() {
  const autores = await prisma.author.findMany({
    include: {
      _count: { select: { mensagens: { where: { status: { in: ["PUBLISHED", "REVIEW"] } } } } },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Autores</h1>
          <p className="text-sm text-stone-500">{autores.length} totais · {autores.filter((a) => a.ativo).length} ativos</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase text-stone-600">
            <tr>
              <th className="text-left px-4 py-3">Slug</th>
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-left px-4 py-3">Bio</th>
              <th className="text-right px-4 py-3">Mensagens</th>
              <th className="text-center px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {autores.map((a) => (
              <tr key={a.id} className="hover:bg-stone-50">
                <td className="px-4 py-2.5 font-mono text-xs text-stone-700">{a.slug}</td>
                <td className="px-4 py-2.5 font-medium">{a.nome}</td>
                <td className="px-4 py-2.5 text-stone-600 text-xs max-w-md truncate">{a.bio ?? "—"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{a._count.mensagens}</td>
                <td className="px-4 py-2.5 text-center"><Badge tone={a.ativo ? "green" : "stone"}>{a.ativo ? "ativo" : "off"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
