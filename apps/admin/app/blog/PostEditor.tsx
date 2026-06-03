"use client";

/**
 * Editor profissional de post de blog.
 *
 * Features:
 *   - Form com todos os campos SEO separados (titulo / metaTitle / metaDescription / conteudo Markdown / resumo / slug / tags)
 *   - Char counter live colorido (verde no ideal, âmbar no aceitável, vermelho no estourado)
 *   - Word count live + tempo leitura (wordCount/200). Mín 1200 pra publicar com confiança (warning).
 *   - Preview lado a lado: como vai aparecer no Google (SERP) + como vai renderizar no site (markdown h2/p básico)
 *   - Atalhos: Ctrl+S salva, Ctrl+Enter salva e publica, Esc volta
 *   - Server actions: salvar / publicar / despublicar / deletar
 */

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Textarea, Select, Card, Badge, charCounterTone } from "../../lib/ui";

export interface PostEditorData {
  id?: string;
  titulo: string;
  metaTitle: string;
  metaDescription: string;
  conteudo: string;
  resumo: string;
  slug: string;
  tags: string;          // input separado por vírgula (UI), split em array no submit
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
  categoriaId: string;
  autorId: string;
  qualidade: number | null;
  origem: "IA" | "MANUAL" | "IMPORT_WP" | "IMPORT_BULK";
}

interface Props {
  initial: PostEditorData;
  categorias: Array<{ id: string; nome: string; slug: string }>;
  autores: Array<{ id: string; nome: string }>;
  saveAction: (data: PostEditorData) => Promise<{ ok: boolean; error?: string; id?: string }>;
  publishAction?: (id: string) => Promise<{ ok: boolean; error?: string }>;
  unpublishAction?: (id: string) => Promise<{ ok: boolean; error?: string }>;
  deleteAction?: (id: string) => Promise<{ ok: boolean; error?: string }>;
  isNew?: boolean;
}

export function PostEditor({
  initial,
  categorias,
  autores,
  saveAction,
  publishAction,
  unpublishAction,
  deleteAction,
  isNew = false,
}: Props) {
  const router = useRouter();
  const [data, setData] = useState<PostEditorData>(initial);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  const update = <K extends keyof PostEditorData>(key: K, value: PostEditorData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

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
        showToast("ok", "Publicado");
        setTimeout(() => router.push("/blog"), 600);
      } else if (then === "back") {
        router.push("/blog");
      } else {
        showToast("ok", isNew ? "Criado" : "Salvo");
        if (isNew && r.id) router.replace(`/blog/${r.id}`);
      }
    });
  };

  const handleUnpublish = () => {
    if (!data.id || !unpublishAction) return;
    if (!confirm("Despublicar esse post? Volta pra DRAFT.")) return;
    startTransition(async () => {
      const r = await unpublishAction(data.id!);
      if (!r.ok) {
        showToast("err", r.error ?? "Erro");
        return;
      }
      showToast("ok", "Despublicado");
      setTimeout(() => router.refresh(), 600);
    });
  };

  const handleDelete = () => {
    if (!data.id || !deleteAction) return;
    if (!confirm("DELETAR esse post permanentemente? Não pode ser desfeito.")) return;
    startTransition(async () => {
      const r = await deleteAction(data.id!);
      if (!r.ok) {
        showToast("err", r.error ?? "Erro");
        return;
      }
      router.push("/blog");
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
  const tempoLeitura = Math.max(1, Math.round(wordCount / 200));

  const tituloTone = charCounterTone(tituloLen, 30, 90, 20, 90);
  const metaTitleTone = charCounterTone(metaTitleLen, 54, 60, 50, 60);
  const metaDescTone = charCounterTone(metaDescLen, 124, 140, 115, 140);

  const wordMin = 1200;
  const wordTone = wordCount >= wordMin ? "green" : wordCount >= 800 ? "amber" : "red";
  const podePublicar = wordCount >= 800;

  const categoria = categorias.find((c) => c.id === data.categoriaId);
  const previewUrl = categoria
    ? `www.portalsoma.com.br/blog/${categoria.slug}/${data.slug || "{slug}"}/`
    : `www.portalsoma.com.br/blog/{categoria}/${data.slug || "{slug}"}/`;

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
            hint="30-90 chars. Sempre keyword + diferencial."
            required
            trailing={<CharCount n={tituloLen} tone={tituloTone} />}
          >
            <Input value={data.titulo} onChange={(e) => update("titulo", e.target.value)} maxLength={150} />
          </Field>

          <Field
            label="Meta Title (SERP)"
            hint="54-60 chars. Pode duplicar do título se ficou bom."
            trailing={<CharCount n={metaTitleLen} tone={metaTitleTone} />}
          >
            <Input value={data.metaTitle} onChange={(e) => update("metaTitle", e.target.value)} maxLength={80} />
          </Field>

          <Field
            label="Meta Description (SERP)"
            hint="124-140 chars. Convida ao clique."
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
            label={`Conteúdo (Markdown — mín 1200 palavras pra autoridade)`}
            hint="Markdown puro. Use ## pra h2, ### pra h3. Parágrafos separados por linha em branco."
            required
            trailing={
              <span className={`tabular-nums text-xs font-medium ${wordTone === "green" ? "text-green-700" : wordTone === "amber" ? "text-amber-700" : "text-red-700"}`}>
                {wordCount} palavras · {tempoLeitura} min
              </span>
            }
          >
            <Textarea
              rows={24}
              value={data.conteudo}
              onChange={(e) => update("conteudo", e.target.value)}
              className="font-mono text-sm"
              placeholder={`## Introdução\n\nParágrafo de abertura...\n\n## Subtítulo\n\nMais conteúdo...`}
            />
          </Field>

          <Field label="Resumo" hint="1-2 frases pra preview/OG (opcional, até 200 chars).">
            <Textarea rows={2} value={data.resumo} onChange={(e) => update("resumo", e.target.value)} maxLength={220} />
          </Field>
        </Card>

        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">Categorização</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoria" required>
              <Select value={data.categoriaId} onChange={(e) => update("categoriaId", e.target.value)} className="w-full">
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </Select>
            </Field>

            <Field label="Autor" required>
              <Select value={data.autorId} onChange={(e) => update("autorId", e.target.value)} className="w-full">
                {autores.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Tags" hint="Separadas por vírgula. Ex: aniversário, psicologia, tradições">
            <Input
              value={data.tags}
              onChange={(e) => update("tags", e.target.value)}
              placeholder="tag1, tag2, tag3"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Origem">
              <Select value={data.origem} onChange={(e) => update("origem", e.target.value as PostEditorData["origem"])} className="w-full">
                <option value="MANUAL">Manual</option>
                <option value="IA">IA</option>
                <option value="IMPORT_WP">Import WP</option>
                <option value="IMPORT_BULK">Bulk</option>
              </Select>
            </Field>

            <Field label="Slug" hint="Auto-gerado do título se vazio." trailing={<span className="text-xs text-stone-500">{data.slug.length} chars</span>}>
              <Input
                value={data.slug}
                onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 100))}
                className="font-mono"
              />
            </Field>
          </div>
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
              {data.metaTitle || data.titulo || "(meta title vazio)"}
            </div>
            <div className="text-sm text-stone-700 leading-snug mt-1 line-clamp-3">
              {data.metaDescription || data.resumo || "(meta description vazia)"}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-4">
            Preview no site
          </h2>
          <article className="prose-sm">
            <h1 className="text-2xl font-bold text-stone-900 leading-tight">{data.titulo || "(título vazio)"}</h1>
            <div className="text-xs text-stone-500 mt-2">
              {tempoLeitura} min de leitura · {wordCount} palavras
            </div>
            <MarkdownPreview md={data.conteudo} />
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
            <div><kbd className="px-1.5 py-0.5 bg-stone-100 border rounded font-mono">Ctrl+S</kbd> Salvar</div>
            {publishAction && data.id && <div><kbd className="px-1.5 py-0.5 bg-stone-100 border rounded font-mono">Ctrl+Enter</kbd> Salvar e publicar</div>}
            <div><kbd className="px-1.5 py-0.5 bg-stone-100 border rounded font-mono">Esc</kbd> Voltar</div>
          </div>
        </Card>

        {!podePublicar && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="text-xs text-amber-800">
              <strong>Atenção:</strong> mín. 800 palavras pra publicar (ideal 1200+). Atual: {wordCount}.
            </div>
          </Card>
        )}
      </div>

      {/* === Action bar fixed === */}
      <div className="fixed bottom-0 left-60 right-0 bg-white border-t border-stone-200 px-6 py-3 flex items-center gap-3 shadow-lg z-30">
        <div className="text-xs text-stone-500">
          {dirty ? <span className="text-amber-700 font-medium">Mudanças não salvas</span> : "Sem alterações"}
        </div>
        <div className="flex-1" />
        {data.id && deleteAction && (
          <Button variant="danger" onClick={handleDelete} disabled={isPending}>
            Deletar
          </Button>
        )}
        {data.id && data.status === "PUBLISHED" && unpublishAction && (
          <Button variant="secondary" onClick={handleUnpublish} disabled={isPending}>
            Despublicar
          </Button>
        )}
        <Button variant="ghost" onClick={() => router.back()} disabled={isPending}>
          Voltar
        </Button>
        <Button variant="secondary" onClick={() => handleSave()} disabled={isPending}>
          {isPending ? "..." : "Salvar"}
        </Button>
        {publishAction && data.id && data.status !== "PUBLISHED" && (
          <Button variant="success" onClick={() => handleSave("publish")} disabled={isPending || !podePublicar}>
            Salvar e publicar
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

/**
 * Renderer Markdown bem básico: h2 (##), h3 (###), parágrafo. Sem libs externas — preview leve.
 */
function MarkdownPreview({ md }: { md: string }) {
  if (!md.trim()) {
    return <div className="mt-4 text-stone-400 italic">(conteúdo vazio)</div>;
  }

  const lines = md.split("\n");
  const blocks: React.ReactNode[] = [];
  let buffer: string[] = [];

  const flushParagraph = () => {
    const text = buffer.join(" ").trim();
    if (text) blocks.push(<p key={blocks.length} className="mt-3 text-stone-700 leading-relaxed">{text}</p>);
    buffer = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      continue;
    }
    if (line.startsWith("### ")) {
      flushParagraph();
      blocks.push(<h3 key={blocks.length} className="mt-5 text-base font-semibold text-stone-900">{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      flushParagraph();
      blocks.push(<h2 key={blocks.length} className="mt-6 text-xl font-bold text-stone-900">{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      flushParagraph();
      blocks.push(<h2 key={blocks.length} className="mt-6 text-2xl font-bold text-stone-900">{line.slice(2)}</h2>);
    } else {
      buffer.push(line);
    }
  }
  flushParagraph();

  return <div className="mt-4">{blocks}</div>;
}
