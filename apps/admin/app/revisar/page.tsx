import { prisma } from "@nivertotal/db";
import { aprovarMensagem, rejeitarMensagem, aprovarLote } from "./actions";

export const dynamic = "force-dynamic";

interface SearchParams {
  cluster?: string;
  persona?: string;
  origem?: string;
}

export default async function RevisarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const where = {
    status: "REVIEW" as const,
    ...(sp.cluster && { cluster: { slug: sp.cluster } }),
    ...(sp.persona && { persona: { slug: sp.persona } }),
    ...(sp.origem && { origem: sp.origem as "IA" | "MANUAL" | "IMPORT_WP" | "IMPORT_BULK" }),
  };

  const [items, totalReview, clusters, personas] = await Promise.all([
    prisma.mensagem.findMany({
      where,
      orderBy: [{ qualidade: "desc" }, { criadoEm: "desc" }],
      take: 50,
      include: {
        cluster: { select: { slug: true, nome: true } },
        persona: { select: { slug: true, nome: true } },
        autor: { select: { nome: true } },
      },
    }),
    prisma.mensagem.count({ where: { status: "REVIEW" } }),
    prisma.cluster.findMany({ where: { ativo: true }, select: { slug: true, nome: true } }),
    prisma.persona.findMany({ where: { ativo: true }, select: { slug: true, nome: true } }),
  ]);

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Revisão de mensagens</h1>
          <p className="text-stone-500 text-sm mt-1">
            <strong className="text-stone-900">{totalReview}</strong> mensagens em REVIEW —
            mostrando primeiras 50 ordenadas por qualidade
          </p>
        </div>
        {items.length > 0 && (
          <form action={aprovarLote} className="flex gap-2 items-center">
            <input
              type="number"
              name="quantidade"
              min="1"
              max="50"
              defaultValue="10"
              className="w-20 px-3 py-2 border rounded-lg text-sm"
            />
            <input
              type="number"
              step="0.05"
              name="qualidadeMin"
              min="0"
              max="1"
              defaultValue="0.85"
              className="w-24 px-3 py-2 border rounded-lg text-sm"
              placeholder="qualidade ≥"
            />
            <button
              type="submit"
              className="bg-niver-600 hover:bg-niver-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Aprovar lote
            </button>
          </form>
        )}
      </div>

      <form className="bg-white rounded-xl border border-stone-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Cluster</label>
          <select
            name="cluster"
            defaultValue={sp.cluster ?? ""}
            className="px-3 py-1.5 border rounded-lg text-sm"
          >
            <option value="">todos</option>
            {clusters.map((c) => (
              <option key={c.slug} value={c.slug}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Persona</label>
          <select
            name="persona"
            defaultValue={sp.persona ?? ""}
            className="px-3 py-1.5 border rounded-lg text-sm"
          >
            <option value="">todas</option>
            {personas.map((p) => (
              <option key={p.slug} value={p.slug}>{p.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Origem</label>
          <select
            name="origem"
            defaultValue={sp.origem ?? ""}
            className="px-3 py-1.5 border rounded-lg text-sm"
          >
            <option value="">todas</option>
            <option value="IA">IA gerada</option>
            <option value="MANUAL">Manual</option>
            <option value="IMPORT_WP">WP refeito</option>
            <option value="IMPORT_BULK">Bulk</option>
          </select>
        </div>
        <button type="submit" className="bg-stone-900 text-white px-4 py-1.5 rounded-lg text-sm">
          Filtrar
        </button>
      </form>

      <div className="space-y-3">
        {items.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-stone-500 mb-1 flex items-center gap-2 flex-wrap">
                  <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {m.cluster.nome}
                  </span>
                  {m.persona && (
                    <span className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                      {m.persona.nome}
                    </span>
                  )}
                  {m.qualidade !== null && (
                    <span
                      className={`tabular-nums font-medium ${
                        m.qualidade >= 0.85
                          ? "text-green-700"
                          : m.qualidade >= 0.6
                            ? "text-amber-700"
                            : "text-red-700"
                      }`}
                    >
                      Q: {(m.qualidade * 100).toFixed(0)}%
                    </span>
                  )}
                  <span className="text-stone-400">{m.origem}</span>
                </div>
                <div className="font-semibold text-stone-900 mb-2">{m.titulo}</div>
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                  {m.conteudo}
                </p>
                {m.resumo && (
                  <p className="text-xs text-stone-500 mt-2 italic">{m.resumo}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-stone-100">
              <form action={aprovarMensagem.bind(null, m.id)}>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
                >
                  ✓ Aprovar
                </button>
              </form>
              <a
                href={`/mensagens/${m.id}`}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 px-4 py-1.5 rounded-lg text-sm font-medium"
              >
                ✏ Editar
              </a>
              <form action={rejeitarMensagem.bind(null, m.id)} className="ml-auto">
                <button
                  type="submit"
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-1.5 rounded-lg text-sm font-medium"
                >
                  ✗ Rejeitar
                </button>
              </form>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-stone-500">
            <p className="font-medium mb-2">Sem mensagens em REVIEW.</p>
            <p className="text-sm">Quando o gerador rodar, mensagens chegam aqui pra aprovação.</p>
          </div>
        )}
      </div>
    </div>
  );
}
