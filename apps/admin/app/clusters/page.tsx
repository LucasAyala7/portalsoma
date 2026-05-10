import Link from "next/link";
import { prisma } from "@nivertotal/db";
import { Card, Badge } from "../../lib/ui";

export const dynamic = "force-dynamic";

export default async function ClustersPage() {
  const clusters = await prisma.cluster.findMany({
    include: {
      _count: {
        select: {
          mensagens: { where: { status: { in: ["PUBLISHED", "REVIEW"] } } },
          complementos: true,
        },
      },
    },
    orderBy: { nome: "asc" },
  });

  const ativos = clusters.filter((c) => c.ativo).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Clusters</h1>
          <p className="text-sm text-stone-500">{clusters.length} totais · {ativos} ativos</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-wide text-stone-600">
            <tr>
              <th className="text-left px-4 py-3">Slug</th>
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-left px-4 py-3">Keyword</th>
              <th className="text-right px-4 py-3">Vol/mês</th>
              <th className="text-right px-4 py-3">Cota/dia</th>
              <th className="text-right px-4 py-3">Mensagens</th>
              <th className="text-right px-4 py-3">Complementos</th>
              <th className="text-center px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {clusters.map((c) => (
              <tr key={c.id} className="hover:bg-stone-50">
                <td className="px-4 py-2.5 font-mono text-xs text-stone-700">{c.slug}</td>
                <td className="px-4 py-2.5">
                  <Link href={`/mensagens?cluster=${c.slug}`} className="hover:underline text-stone-900">
                    {c.nome}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-stone-600 text-xs">{c.headKeyword}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-stone-600">{c.volumeMensal?.toLocaleString("pt-BR") ?? "—"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  <Badge tone={c.cotaDiaria > 0 ? "blue" : "stone"}>{c.cotaDiaria}</Badge>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums font-medium">{c._count.mensagens}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-stone-600">{c._count.complementos}</td>
                <td className="px-4 py-2.5 text-center">
                  <Badge tone={c.ativo ? "green" : "stone"}>{c.ativo ? "ativo" : "off"}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="mt-4 text-xs text-stone-500">
        Edição estrutural de clusters é via seed (<code className="bg-stone-100 px-1">packages/db/src/seed/taxonomia.ts</code>) + <code className="bg-stone-100 px-1">prisma db push</code>.
        Ajuste de cotas na próxima versão.
      </p>
    </div>
  );
}
