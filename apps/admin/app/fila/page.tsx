import { aiQueue, imageQueue, webstoryQueue, publishQueue } from "../../lib/queue";
import { Card, Badge } from "../../lib/ui";
import { prisma } from "@nivertotal/db";

export const dynamic = "force-dynamic";

async function safeStats(q: ReturnType<typeof aiQueue>) {
  try {
    return await q.getJobCounts("waiting", "active", "completed", "failed", "delayed");
  } catch {
    return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
  }
}

export default async function FilaPage() {
  const [ai, img, ws, pub, ultimosJobs] = await Promise.all([
    safeStats(aiQueue()),
    safeStats(imageQueue()),
    safeStats(webstoryQueue()),
    safeStats(publishQueue()),
    prisma.jobLog.findMany({ orderBy: { criadoEm: "desc" }, take: 30 }),
  ]);

  const queues = [
    { nome: "AI (geração)", stats: ai },
    { nome: "IMAGE (Flux/Satori)", stats: img },
    { nome: "WEBSTORY", stats: ws },
    { nome: "PUBLISH", stats: pub },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Filas BullMQ</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {queues.map((q) => (
          <Card key={q.nome} className="p-5">
            <h3 className="font-semibold text-stone-900 mb-3">{q.nome}</h3>
            <div className="grid grid-cols-5 gap-2 text-center">
              <Stat label="Espera" n={q.stats.waiting ?? 0} tone="amber" />
              <Stat label="Ativos" n={q.stats.active ?? 0} tone="blue" />
              <Stat label="Done" n={q.stats.completed ?? 0} tone="green" />
              <Stat label="Falhas" n={q.stats.failed ?? 0} tone="red" />
              <Stat label="Atraso" n={q.stats.delayed ?? 0} tone="stone" />
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-200">
          <h3 className="font-semibold text-stone-900">Últimos 30 jobs (JobLog)</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase text-stone-600">
            <tr>
              <th className="text-left px-4 py-2">Tipo</th>
              <th className="text-center px-4 py-2">Status</th>
              <th className="text-right px-4 py-2">Custo</th>
              <th className="text-right px-4 py-2">Duração</th>
              <th className="text-right px-4 py-2">Quando</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {ultimosJobs.map((j) => (
              <tr key={j.id} className="hover:bg-stone-50">
                <td className="px-4 py-2 font-mono text-xs">{j.tipo}</td>
                <td className="px-4 py-2 text-center">
                  <Badge tone={j.status === "success" ? "green" : j.status === "failed" ? "red" : "stone"}>{j.status}</Badge>
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{j.custo ? `R$ ${j.custo.toFixed(3)}` : "—"}</td>
                <td className="px-4 py-2 text-right tabular-nums text-stone-600">{j.duracao ? `${j.duracao}ms` : "—"}</td>
                <td className="px-4 py-2 text-right text-xs text-stone-500">{j.criadoEm.toLocaleString("pt-BR")}</td>
              </tr>
            ))}
            {ultimosJobs.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-stone-400 text-sm">Sem jobs registrados.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Stat({ label, n, tone }: { label: string; n: number; tone: "amber" | "blue" | "green" | "red" | "stone" }) {
  const colors: Record<typeof tone, string> = {
    amber: "text-amber-700",
    blue: "text-blue-700",
    green: "text-green-700",
    red: "text-red-700",
    stone: "text-stone-700",
  };
  return (
    <div>
      <div className={`text-xl font-semibold tabular-nums ${colors[tone]}`}>{n}</div>
      <div className="text-xs text-stone-500 uppercase">{label}</div>
    </div>
  );
}
