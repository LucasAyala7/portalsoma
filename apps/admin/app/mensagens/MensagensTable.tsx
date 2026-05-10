"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "../../lib/ui";
import { BulkBar } from "./BulkBar";
import { bulkAction } from "./actions";

interface Item {
  id: string;
  titulo: string;
  slug: string;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "REJECTED";
  tipo: "CURTA" | "MEDIA" | "LONGA" | "POEMA";
  tier: "TIER_1" | "TIER_2" | "TIER_3";
  qualidade: number | null;
  conteudoPreview: string;
  cluster: { slug: string; nome: string };
  persona: { slug: string; nome: string } | null;
  autor: { nome: string };
  wordCount: number | null;
}

const STATUS_TONE: Record<Item["status"], "amber" | "green" | "red" | "stone"> = {
  REVIEW: "amber",
  PUBLISHED: "green",
  REJECTED: "red",
  DRAFT: "stone",
};

const TIPO_TONE: Record<Item["tipo"], "blue" | "violet" | "stone"> = {
  CURTA: "blue",
  MEDIA: "stone",
  LONGA: "stone",
  POEMA: "violet",
};

export function MensagensTable({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-wide text-stone-600">
            <tr>
              <th className="px-3 py-2.5 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={toggleAll}
                  className="cursor-pointer"
                />
              </th>
              <th className="text-left px-3 py-2.5">Mensagem</th>
              <th className="text-center px-3 py-2.5">Tipo</th>
              <th className="text-center px-3 py-2.5">Status</th>
              <th className="text-right px-3 py-2.5">Qualidade</th>
              <th className="text-right px-3 py-2.5">Palavras</th>
              <th className="text-right px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((m) => {
              const isSel = selected.has(m.id);
              return (
                <tr key={m.id} className={`hover:bg-stone-50 ${isSel ? "bg-niver-500/5" : ""}`}>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={isSel} onChange={() => toggle(m.id)} className="cursor-pointer" />
                  </td>
                  <td className="px-3 py-2.5 max-w-md">
                    <Link href={`/mensagens/${m.id}`} className="block group">
                      <div className="font-medium text-stone-900 group-hover:underline truncate">{m.titulo}</div>
                      <div className="text-xs text-stone-500 truncate flex items-center gap-2">
                        <span className="bg-amber-50 text-amber-800 px-1.5 rounded">{m.cluster.nome}</span>
                        {m.persona && <span className="bg-violet-50 text-violet-700 px-1.5 rounded">{m.persona.nome}</span>}
                        <span className="text-stone-400">{m.autor.nome}</span>
                      </div>
                      <div className="text-xs text-stone-600 mt-1 line-clamp-1 italic">{m.conteudoPreview}</div>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge tone={TIPO_TONE[m.tipo]}>{m.tipo}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge tone={STATUS_TONE[m.status]}>{m.status}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {m.qualidade !== null ? (
                      <span className={m.qualidade >= 0.85 ? "text-green-700" : m.qualidade >= 0.6 ? "text-amber-700" : "text-red-700"}>
                        {(m.qualidade * 100).toFixed(0)}%
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-stone-600">{m.wordCount ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right">
                    <Link href={`/mensagens/${m.id}`} className="text-niver-600 hover:underline text-xs">
                      Editar →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="p-12 text-center text-stone-400 text-sm">Nenhuma mensagem encontrada com esses filtros.</div>
        )}
      </div>

      <BulkBar selected={[...selected]} onClear={() => setSelected(new Set())} bulkAction={bulkAction} />
    </>
  );
}
