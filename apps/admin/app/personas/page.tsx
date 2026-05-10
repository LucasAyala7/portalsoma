import { prisma } from "@nivertotal/db";
import { Card, Badge } from "../../lib/ui";

export const dynamic = "force-dynamic";

export default async function PersonasPage() {
  const personas = await prisma.persona.findMany({
    include: {
      _count: {
        select: { mensagens: { where: { status: { in: ["PUBLISHED", "REVIEW"] } } } },
      },
      autor: { select: { nome: true, slug: true } },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Personas</h1>
          <p className="text-sm text-stone-500">{personas.length} vozes virtuais · {personas.filter((p) => p.ativo).length} ativas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personas.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                  {p.nome}
                  <Badge tone={p.ativo ? "green" : "stone"}>{p.ativo ? "ativa" : "off"}</Badge>
                </h3>
                <div className="text-xs text-stone-500 mt-0.5">
                  <code className="bg-stone-100 px-1 rounded font-mono">{p.slug}</code>
                  {p.autor && <span className="ml-2">→ {p.autor.nome}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold tabular-nums">{p._count.mensagens}</div>
                <div className="text-xs text-stone-500">mensagens</div>
              </div>
            </div>

            <details className="text-xs text-stone-700">
              <summary className="cursor-pointer text-stone-500 hover:text-stone-900">
                Ver vozPrompt ({p.vozPrompt.length} chars)
              </summary>
              <pre className="mt-2 bg-stone-50 border border-stone-200 rounded p-3 whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-60 overflow-y-auto">
                {p.vozPrompt}
              </pre>
            </details>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs text-stone-500">
        Edição via seed (<code className="bg-stone-100 px-1">packages/db/src/seed/personas.ts</code>) + <code className="bg-stone-100 px-1">prisma db push</code>.
        UI de edição inline na próxima versão.
      </p>
    </div>
  );
}
