import Link from "next/link";
import { prisma } from "@nivertotal/db";
import { Card, Badge } from "../lib/ui";

export const dynamic = "force-dynamic";

async function getStats() {
  const inicio7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const inicio30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalMensagens, publicadas, review, drafts, rejected,
    clusters, complementos, autores, personas, webStories,
    eventosUltimas24h, jobsUltimos7d,
    porTipo, topClustersPorMsg, qualidadeAvg,
    ultimasJobs,
  ] = await Promise.all([
    prisma.mensagem.count(),
    prisma.mensagem.count({ where: { status: "PUBLISHED" } }),
    prisma.mensagem.count({ where: { status: "REVIEW" } }),
    prisma.mensagem.count({ where: { status: "DRAFT" } }),
    prisma.mensagem.count({ where: { status: "REJECTED" } }),
    prisma.cluster.count({ where: { ativo: true } }),
    prisma.complemento.count({ where: { ativo: true } }),
    prisma.author.count({ where: { ativo: true } }),
    prisma.persona.count({ where: { ativo: true } }),
    prisma.webStory.count({ where: { status: "PUBLISHED" } }),
    prisma.evento.count({ where: { criadoEm: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    prisma.jobLog.aggregate({
      where: { criadoEm: { gte: inicio7d } },
      _sum: { custo: true },
      _count: true,
    }),
    prisma.mensagem.groupBy({
      by: ["tipo"],
      _count: true,
      where: { status: { in: ["PUBLISHED", "REVIEW"] } },
    }),
    prisma.mensagem.groupBy({
      by: ["clusterId"],
      _count: true,
      where: { status: { in: ["PUBLISHED", "REVIEW"] } },
      orderBy: { _count: { clusterId: "desc" } },
      take: 10,
    }),
    prisma.mensagem.aggregate({
      _avg: { qualidade: true },
      where: { qualidade: { not: null } },
    }),
    prisma.jobLog.findMany({ orderBy: { criadoEm: "desc" }, take: 8 }),
  ]);

  // Resolve nomes dos top clusters
  const clusterIds = topClustersPorMsg.map((c) => c.clusterId);
  const clustersInfo = await prisma.cluster.findMany({
    where: { id: { in: clusterIds } },
    select: { id: true, nome: true, slug: true },
  });
  const clusterMap = new Map(clustersInfo.map((c) => [c.id, c]));
  const topClusters = topClustersPorMsg.map((c) => ({
    nome: clusterMap.get(c.clusterId)?.nome ?? "—",
    slug: clusterMap.get(c.clusterId)?.slug ?? "",
    count: c._count,
  }));

  return {
    totalMensagens, publicadas, review, drafts, rejected,
    clusters, complementos, autores, personas, webStories,
    eventosUltimas24h,
    custo7d: jobsUltimos7d._sum.custo ?? 0,
    jobs7d: jobsUltimos7d._count,
    porTipo,
    topClusters,
    qualidadeAvg: qualidadeAvg._avg.qualidade ?? 0,
    ultimasJobs,
    inicio30d,
  };
}

export default async function Dashboard() {
  const s = await getStats();

  const totalRevisaveis = s.publicadas + s.review;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      {/* KPIs principais */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total mensagens" valor={s.totalMensagens} link="/mensagens" />
        <KpiCard label="Publicadas" valor={s.publicadas} cor="text-green-700" link="/mensagens?status=PUBLISHED" />
        <KpiCard label="Em revisão" valor={s.review} cor="text-amber-700" link="/revisar" highlight />
        <KpiCard label="Rejeitadas" valor={s.rejected} cor="text-stone-500" link="/mensagens?status=REJECTED" />
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Clusters ativos" valor={s.clusters} link="/clusters" />
        <KpiCard label="Personas" valor={s.personas} link="/personas" />
        <KpiCard label="Autores" valor={s.autores} link="/autores" />
        <KpiCard label="Web Stories" valor={s.webStories} link="/web-stories" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Distribuição por tipo */}
        <Card className="p-5">
          <h2 className="font-semibold text-stone-900 mb-4">Distribuição por tipo</h2>
          <div className="space-y-2">
            {s.porTipo.map((t) => {
              const pct = totalRevisaveis > 0 ? (t._count / totalRevisaveis) * 100 : 0;
              return (
                <div key={t.tipo} className="flex items-center gap-3 text-sm">
                  <Badge tone={t.tipo === "POEMA" ? "violet" : t.tipo === "CURTA" ? "blue" : "stone"}>
                    {t.tipo}
                  </Badge>
                  <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-niver-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="tabular-nums text-stone-600 w-16 text-right">{t._count} ({pct.toFixed(0)}%)</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-stone-100 text-sm text-stone-600">
            Qualidade média: <strong className="tabular-nums">{(s.qualidadeAvg * 100).toFixed(1)}%</strong>
          </div>
        </Card>

        {/* Top clusters */}
        <Card className="p-5">
          <h2 className="font-semibold text-stone-900 mb-4">Top clusters por volume</h2>
          <div className="space-y-1.5">
            {s.topClusters.map((c, i) => (
              <Link
                key={c.slug || i}
                href={`/mensagens?cluster=${c.slug}`}
                className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-stone-50 text-sm"
              >
                <span className="text-stone-400 w-5 tabular-nums text-right">{i + 1}</span>
                <span className="flex-1 truncate">{c.nome}</span>
                <span className="tabular-nums text-stone-700 font-medium">{c.count}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custo */}
        <Card className="p-5">
          <h2 className="font-semibold text-stone-900 mb-4">Custos últimos 7 dias</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-stone-500 uppercase">Total IA</div>
              <div className="text-2xl font-semibold tabular-nums text-niver-700 mt-1">
                R$ {s.custo7d.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500 uppercase">Jobs executados</div>
              <div className="text-2xl font-semibold tabular-nums mt-1">{s.jobs7d}</div>
            </div>
            <div>
              <div className="text-xs text-stone-500 uppercase">Eventos 24h</div>
              <div className="text-2xl font-semibold tabular-nums text-stone-600 mt-1">{s.eventosUltimas24h}</div>
            </div>
            <div>
              <div className="text-xs text-stone-500 uppercase">Custo médio /msg</div>
              <div className="text-2xl font-semibold tabular-nums mt-1">
                R$ {s.jobs7d > 0 ? (s.custo7d / s.jobs7d).toFixed(3) : "—"}
              </div>
            </div>
          </div>
        </Card>

        {/* Últimos jobs */}
        <Card className="p-5">
          <h2 className="font-semibold text-stone-900 mb-3">Últimos jobs</h2>
          <div className="space-y-1.5 text-sm">
            {s.ultimasJobs.map((j) => (
              <div key={j.id} className="flex items-center gap-3 text-xs py-1 border-b border-stone-100 last:border-0">
                <span className="font-mono text-stone-700 w-24 truncate">{j.tipo}</span>
                <Badge tone={j.status === "success" ? "green" : j.status === "failed" ? "red" : "stone"}>{j.status}</Badge>
                <span className="flex-1 text-stone-500">{j.duracao ? `${j.duracao}ms` : "—"}</span>
                <span className="tabular-nums text-stone-700">{j.custo ? `R$ ${j.custo.toFixed(3)}` : ""}</span>
                <span className="text-stone-400">{j.criadoEm.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}
            {s.ultimasJobs.length === 0 && (
              <p className="text-stone-400 text-center py-6">Sem jobs registrados ainda.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ label, valor, cor, link, highlight }: { label: string; valor: number; cor?: string; link?: string; highlight?: boolean }) {
  const inner = (
    <div className={`bg-white rounded-xl border ${highlight ? "border-amber-300 ring-2 ring-amber-100" : "border-stone-200"} p-5 hover:border-stone-300 transition-colors`}>
      <div className="text-xs uppercase tracking-wide text-stone-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${cor ?? ""}`}>{valor.toLocaleString("pt-BR")}</div>
    </div>
  );
  return link ? <Link href={link}>{inner}</Link> : inner;
}
