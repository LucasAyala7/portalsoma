"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../lib/ui";

interface Props {
  selected: string[];
  onClear: () => void;
  bulkAction: (formData: FormData) => Promise<void>;
}

export function BulkBar({ selected, onClear, bulkAction }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (selected.length === 0) return null;

  const run = async (action: string, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("action", action);
    selected.forEach((id) => fd.append("ids", id));
    await bulkAction(fd);
    setBusy(false);
    onClear();
    router.refresh();
  };

  return (
    <div className="fixed bottom-0 left-60 right-0 bg-white border-t border-stone-200 px-6 py-3 flex items-center gap-3 shadow-lg z-30">
      <span className="text-sm font-medium text-stone-700">
        <strong className="tabular-nums">{selected.length}</strong> selecionada{selected.length > 1 ? "s" : ""}
      </span>
      <Button variant="ghost" size="sm" onClick={onClear}>Limpar</Button>
      <div className="flex-1" />
      <Button variant="success" size="sm" onClick={() => run("publish")} disabled={busy}>
        ✓ Publicar
      </Button>
      <Button variant="secondary" size="sm" onClick={() => run("review")} disabled={busy}>
        Voltar pra REVIEW
      </Button>
      <Button variant="danger" size="sm" onClick={() => run("reject", `Rejeitar ${selected.length} mensagens?`)} disabled={busy}>
        ✗ Rejeitar
      </Button>
      <select
        className="px-2 py-1.5 border border-stone-300 rounded-lg text-xs"
        defaultValue=""
        onChange={(e) => {
          const v = e.target.value;
          if (v) run(v);
          e.currentTarget.value = "";
        }}
        disabled={busy}
      >
        <option value="">+ Tier...</option>
        <option value="tier1">→ TIER 1</option>
        <option value="tier2">→ TIER 2</option>
        <option value="tier3">→ TIER 3</option>
      </select>
      <Button variant="danger" size="sm" onClick={() => run("delete", `DELETAR ${selected.length} mensagens permanentemente?`)} disabled={busy}>
        🗑 Deletar
      </Button>
    </div>
  );
}
