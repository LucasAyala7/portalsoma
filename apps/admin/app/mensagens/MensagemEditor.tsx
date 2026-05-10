"use client";

/**
 * Editor profissional de mensagem.
 *
 * Features:
 *   - Form com todos os campos SEO separados (titulo / metaTitle / metaDescription / conteudo / resumo / slug / tipo)
 *   - Char counter live colorido (verde no ideal, âmbar no aceitável, vermelho no estourado)
 *   - Preview lado a lado: como vai aparecer no Google (SERP) + como vai renderizar no site
 *   - Atalhos: Ctrl+S salva (REVIEW), Ctrl+Enter publica, Esc volta
 *   - Server actions: salvar / publicar / rejeitar
 *   - Quality gate inline mostra issues do checkQuality()
 */

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Textarea, Select, Card, Badge, charCounterTone } from "../../lib/ui";

export interface MensagemEditorData {
  id?: string;
  titulo: string;
  metaTitle: string;
  metaDescription: string;
  conteudo: string;
  resumo: string;
  slug: string;
  tipo: "CURTA" | "MEDIA" | "LONGA" | "POEMA";
  tier: "TIER_1" | "TIER_2" | "TIER_3";
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "REJECTED";
  clusterId: string;
  complementoId: string | null;
  personaId: string | null;
  autorId: string;
  qualidade: number | null;
}

export interface OptionItem {
  id: string;
  label: string;
  group?: string;
}

interface Props {
  initial: MensagemEditorData;
  clusters: Array<{ id: string; nome: string; slug: string }>;
  complementos: Array<{ id: string; nome: string; clusterId: string }>;
  personas: Array<{ id: string; nome: string }>;
  autores: Array<{ id: string; nome: string }>;
  saveAction: (data: MensagemEditorData) => Promise<{ ok: boolean; error?: string; id?: string }>;
  publishAction?: (id: string) => Promise<{ ok: boolean; error?: string }>;
  rejectAction?: (id: string) => Promise<{ ok: boolean; error?: string }>;
  isNew?: boolean;
}

export function MensagemEditor({
  initial,
  clusters,
  complementos,
  personas,
  autores,
  saveAction,
  publishAction,
  rejectAction,
  isNew = false,
}: Props) {
  const router = useRouter();
  const [data, setData] = useState<MensagemEditorData>(initial);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  const update = <K extends keyof MensagemEditorData>(key: K, value: MensagemEditorData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  const filteredComplementos = complementos.filter((c) => c.clusterId === data.clusterId);

  const showToast = (kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = (then?: "publish" | "back") => {
    startTransition(async () => {
      const r = await saveAction(data);
      if (!r.ok) {
        showToast("err", r.error ?? "Erro ao salvar");
        return;
      }
      setDirty(false);
      if (then === "publish" && r.id && publishAction) {
        const pr = await publishAction(r.id);
        if (!pr.ok) {
          showToast("err", pr.error ?? "Erro ao publicar");
          return;
        }
        showToast("ok", "Publicada");
        setTimeout(() => router.push("/revisar"), 600);
      } else if (then === "back") {
        router.push("/revisar");
      } else {
        showToast("ok", isNew ? "Criada" : "Salva");
        if (isNew && r.id) router.replace(`/mensagens/${r.id}`);
      }
    });
  };

  const handleReject = () => {
    if (!data.id || !rejectAction) return;
    if (!confirm("Rejeitar essa mensagem?")) return;
    startTransition(async () => {
      const r = await rejectAction(data.id!);
      if (!r.ok) {
        showToast("err", r.error ?? "Erro");
        return;
      }
      router.push("/revisar");
    });
  };

  // Atalhos teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key === "s") {
        e.preventDefault();
        handleSave();
      } else if (meta && e.key === "Enter") {
        e.preventDefault();
        if (publishAction && data.id) handleSave("publish");
      } else if (e.key === "Escape" && !isPending) {
        // só se não estiver focado em input — pra não conflitar com cancelar
        const tag = (document.activeElement?.tagName ?? "").toLowerCase();
        if (tag !== "input" && tag !== "textarea" && tag !== "select") {
          router.back();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, isPending]); // eslint-disable-line react-hooks/exhaustive-deps

  // Aviso ao sair com mudanças
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const tituloLen = data.titulo.length;
  const metaTitleLen = data.metaTitle.length;
  const metaDescLen = data.metaDescription.length;
  const wordCount = data.conteudo.trim().split(/\s+/).filter(Boolean).length;

  const tituloTone = charCounterTone(tituloLen, 30, 90, 20, 90);
  const metaTitleTone = charCounterTone(metaTitleLen, 54, 60, 50, 60);
  const metaDescTone = charCounterTone(metaDescLen, 124, 140, 115, 140);

  // Faixas alvo de palavras por tipo
  const wordTargets: Record<string, [number, number]> = {
    CURTA: [50, 100],
    MEDIA: [90, 170],
    LONGA: [170, 300],
    POEMA: [50, 200],
  };
  const [wordMin, wordMax] = wordTargets[data.tipo];
  const wordTone = wordCount < wordMin ? "amber" : wordCount > wordMax + 30 ? "amber" : "green";

  const cluster = clusters.find((c) => c.id === data.clusterId);
  const complemento = filteredComplementos.find((c) => c.id === data.complementoId);
  const previewUrl = cluster
    ? `portalsoma.com.br/mensagem-de-aniversario/${cluster.slug}${complemento ? "/" + complementos.find((c) => c.id === data.complementoId)?.nome.toLowerCase() : ""}/${data.slug || "{slug}"}/`
    : "—";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6">
      {/* === Form === */}
      <div className="space-y-5">
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
              Conteúdo
            </h2>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Badge tone={data.status === "PUBLISHED" ? "green" : data.status === "REVIEW" ? "amber" : data.status === "REJECTED" ? "red" : "stone"}>
                {data.status}
              </Badge>
              {data.qualidade !== null && (
                <span className={`tabular-nums font-medium ${data.qualidade >= 0.85 ? "text-green-700" : data.qualidade >= 0.6 ? "text-amber-700" : "text-red-700"}`}>
                  Q: {(data.qualidade * 100).toFixed(0)}%
                </span>
              )}
              {dirty && <span className="text-amber-600">• não salvo</span>}
            </div>
          </div>

          <Field
            label="Título (h1)"
            hint="30-90 chars. Pode ser frase emocional, não precisa keyword se ficar canhestro."
            required
            trailing={<CharCount n={tituloLen} tone={tituloTone} />}
          >
            <Input value={data.titulo} onChange={(e) => update("titulo", e.target.value)} maxLength={150} />
          </Field>

          <Field
            label="Meta Title (SERP)"
            hint="54-60 chars. Sempre keyword + diferencial."
            required
            trailing={<CharCount n={metaTitleLen} tone={metaTitleTone} />}
          >
            <Input value={data.metaTitle} onChange={(e) => update("metaTitle", e.target.value)} maxLength={80} />
          </Field>

          <Field
            label="Meta Description (SERP)"
            hint="124-140 chars. Convida ao clique."
            required
            trailing={<CharCount n={metaDescLen} tone={metaDescTone} />}
          >
            <Textarea
              rows={3}
              value={data.metaDescription}
              onChange={(e) => update("metaDescription", e.target.value)}
              maxLength={180}
            />
          </Field>

          <Field
            label={`Conteúdo (${data.tipo} — ideal ${wordMin}-${wordMax} palavras)`}
            hint="1ª pessoa, dedicatória. Quebra de linha vira <br>. Use parágrafos."
            required
            trailing={
              <span className={`tabular-nums text-xs font-medium ${wordTone === "green" ? "text-green-700" : "text-amber-700"}`}>
                {wordCount} palavras
              </span>
            }
          >
            <Textarea
              rows={data.tipo === "POEMA" ? 14 : 10}
              value={data.conteudo}
              onChange={(e) => update("conteudo", e.target.value)}
              className="font-serif text-base"
            />
          </Field>

          <Field label="Resumo" hint="Frase curta pra preview/quote (opcional, até 160 chars).">
            <Input value={data.resumo} onChange={(e) => update("resumo", e.target.value)} maxLength={160} />
          </Field>
        </Card>

        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">Categorização</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo" required>
              <Select value={data.tipo} onChange={(e) => update("tipo", e.target.value as MensagemEditorData["tipo"])} className="w-full">
                <option value="CURTA">CURTA (50-100 palavras)</option>
                <option value="MEDIA">MEDIA (90-170 palavras)</option>
                <option value="LONGA">LONGA (170-300 palavras)</option>
                <option value="POEMA">POEMA (versos)</option>
              </Select>
            </Field>

            <Field label="Tier (mídia)">
              <Select value={data.tier} onChange={(e) => update("tier", e.target.value as MensagemEditorData["tier"])} className="w-full">
                <option value="TIER_3">TIER 3 — só Satori (R$0)</option>
                <option value="TIER_2">TIER 2 — Schnell+Satori (~R$0,03)</option>
                <option value="TIER_1">TIER 1 — Pro+OG+Pin (~R$0,15)</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cluster" required>
              <Select value={data.clusterId} onChange={(e) => { update("clusterId", e.target.value); update("complementoId", null); }} className="w-full">
                {clusters.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </Select>
            </Field>

            <Field label="Complemento" hint="Opcional — empilha sobre cluster">
              <Select value={data.complementoId ?? ""} onChange={(e) => update("complementoId", e.target.value || null)} className="w-full" disabled={filteredComplementos.length === 0}>
                <option value="">(nenhum)</option>
                {filteredComplementos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Persona (voz)">
              <Select value={data.personaId ?? ""} onChange={(e) => update("personaId", e.target.value || null)} className="w-full">
                <option value="">(nenhuma — autor real)</option>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </Select>
            </Field>

            <Field label="Autor exibido" required>
              <Select value={data.autorId} onChange={(e) => update("autorId", e.target.value)} className="w-full">
                {autores.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Slug" hint="URL final. Auto-gerado do título se vazio." trailing={<span className="text-xs text-stone-500">{data.slug.length} chars</span>}>
            <Input value={data.slug} onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 80))} className="font-mono" />
          </Field>
        </Card>
      </div>

      {/* === Preview lateral === */}
      <div className="space-y-5">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-4">
            Preview Google (SERP)
          </h2>
          <div className="border border-stone-200 rounded-lg p-4 bg-white">
            <div className="text-xs text-stone-500 truncate">{previewUrl}</div>
            <div className="text-blue-700 text-lg font-medium leading-snug mt-1 line-clamp-2 hover:underline cursor-pointer">
              {data.metaTitle || "(meta title vazio)"}
            </div>
            <div className="text-sm text-stone-700 leading-snug mt-1 line-clamp-3">
              {data.metaDescription || "(meta description vazia)"}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-4">
            Preview no site
          </h2>
          <article className="prose-sm">
            <h1 className="text-2xl font-bold text-stone-900 leading-tight">{data.titulo || "(título vazio)"}</h1>
            <div className="mt-4 text-stone-700 leading-relaxed whitespace-pre-line font-serif">
              {data.conteudo || "(conteúdo vazio)"}
            </div>
            {data.resumo && (
              <blockquote className="mt-5 border-l-4 border-niver-500 pl-4 italic text-stone-600 text-sm">
                {data.resumo}
              </blockquote>
            )}
          </article>
        </Card>

        <Card className="p-4">
          <h3 className="text-xs font-semibold text-stone-700 uppercase tracking-wide mb-3">Atalhos</h3>
          <div className="space-y-1.5 text-xs text-stone-600">
            <div><kbd className="px-1.5 py-0.5 bg-stone-100 border rounded font-mono">Ctrl+S</kbd> Salvar como REVIEW</div>
            {publishAction && data.id && <div><kbd className="px-1.5 py-0.5 bg-stone-100 border rounded font-mono">Ctrl+Enter</kbd> Salvar e publicar</div>}
            <div><kbd className="px-1.5 py-0.5 bg-stone-100 border rounded font-mono">Esc</kbd> Voltar (descarta)</div>
          </div>
        </Card>
      </div>

      {/* === Action bar fixed === */}
      <div className="fixed bottom-0 left-60 right-0 bg-white border-t border-stone-200 px-6 py-3 flex items-center gap-3 shadow-lg z-30">
        <div className="text-xs text-stone-500">
          {dirty ? <span className="text-amber-700 font-medium">Mudanças não salvas</span> : "Sem alterações"}
        </div>
        <div className="flex-1" />
        {data.id && rejectAction && (
          <Button variant="danger" onClick={handleReject} disabled={isPending}>
            ✗ Rejeitar
          </Button>
        )}
        <Button variant="ghost" onClick={() => router.back()} disabled={isPending}>
          Voltar
        </Button>
        <Button variant="secondary" onClick={() => handleSave()} disabled={isPending}>
          {isPending ? "..." : "Salvar"}
        </Button>
        {publishAction && data.id && (
          <Button variant="success" onClick={() => handleSave("publish")} disabled={isPending}>
            ✓ Salvar e publicar
          </Button>
        )}
      </div>

      {/* === Toast === */}
      {toast && (
        <div
          className={`fixed bottom-20 right-6 px-4 py-3 rounded-lg shadow-lg z-50 text-sm font-medium ${
            toast.kind === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function CharCount({ n, tone }: { n: number; tone: "green" | "amber" | "red" }) {
  const cls = tone === "green" ? "text-green-700" : tone === "amber" ? "text-amber-700" : "text-red-700";
  return <span className={`tabular-nums text-xs font-medium ${cls}`}>{n} chars</span>;
}
