import { redirect } from "next/navigation";
import { prisma } from "@nivertotal/db";
import { parseCSV, parseXLSX, processRows } from "@nivertotal/ingest";
import { addAiJob, addImageJob } from "../../../lib/queue";

async function handleUpload(formData: FormData) {
  "use server";
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Arquivo obrigatório");
  const dryRun = formData.get("dryRun") === "on";
  const defaultAutorSlug = (formData.get("autorSlug") as string) || "equipe-editorial";

  const buffer = Buffer.from(await file.arrayBuffer());
  let rows: Record<string, unknown>[] = [];

  if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
    rows = parseXLSX(buffer);
  } else {
    const text = buffer.toString("utf-8");
    const parsed = parseCSV(text);
    rows = parsed.rows;
  }

  const importRecord = await prisma.bulkImport.create({
    data: {
      arquivo: file.name,
      totalLinhas: rows.length,
      status: "RUNNING",
      payload: { dryRun, defaultAutorSlug },
      iniciadoEm: new Date(),
    },
  });

  // Processa síncrono (até 1k linhas é ok; pra mais, jogar pra worker)
  await processRows(rows, {
    importId: importRecord.id,
    dryRun,
    defaultAutorSlug,
    enqueueAi: dryRun ? undefined : async (mensagemId) => {
      await addAiJob({ mensagemId });
    },
    enqueueImagem: dryRun ? undefined : async (mensagemId) => {
      await addImageJob({ mensagemId });
    },
  });

  redirect(`/mensagens/bulk-import/${importRecord.id}`);
}

export default async function BulkImportPage() {
  const recent = await prisma.bulkImport.findMany({
    orderBy: { criadoEm: "desc" },
    take: 10,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Bulk Import</h1>

      <div className="bg-white rounded-xl border border-stone-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Subir planilha</h2>
        <form action={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Arquivo CSV ou XLSX
            </label>
            <input
              type="file"
              name="file"
              accept=".csv,.xlsx,.xls"
              required
              className="block w-full text-sm"
            />
            <p className="text-xs text-stone-500 mt-1">
              Colunas: titulo, slug?, clusterSlug, complementoSlug?, autorSlug?, personaSlug?,
              conteudo?, resumo?, gerar_imagem?, tier?, status_inicial?
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Autor padrão (se a planilha não especificar)
            </label>
            <input
              name="autorSlug"
              defaultValue="equipe-editorial"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="dryRun" defaultChecked />
            Dry-run (não grava, só valida e mostra preview)
          </label>

          <button
            type="submit"
            className="bg-niver-600 hover:bg-niver-700 text-white font-medium px-5 py-2 rounded-lg"
          >
            Enviar
          </button>
        </form>
      </div>

      <h2 className="text-lg font-semibold mb-3">Histórico</h2>
      <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
        {recent.map((r) => (
          <div key={r.id} className="p-4 flex justify-between items-center text-sm">
            <div>
              <div className="font-medium">{r.arquivo}</div>
              <div className="text-stone-500 text-xs">
                {r.totalLinhas} linhas · {r.sucessos} ok · {r.falhas} erros · {r.criadoEm.toLocaleString("pt-BR")}
              </div>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                r.status === "COMPLETED"
                  ? "bg-green-100 text-green-700"
                  : r.status === "RUNNING"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-stone-100 text-stone-700"
              }`}
            >
              {r.status}
            </span>
          </div>
        ))}
        {recent.length === 0 && (
          <div className="p-6 text-center text-stone-400 text-sm">
            Sem imports ainda.
          </div>
        )}
      </div>
    </div>
  );
}
