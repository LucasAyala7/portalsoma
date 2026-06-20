"use client";

import { useState } from "react";
import { Image as ImageIcon, Download, Check } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface Props {
  imageUrl: string;
  titulo: string;
  mensagemId?: string;
  slug?: string;
  className?: string;
}

/**
 * Botão "Compartilhar imagem" · usa Web Share API Level 2 (files: [Blob]).
 * Fallback: download direto + toast "imagem baixada, cole no app".
 */
export function ShareImageButton({ imageUrl, titulo, mensagemId, slug, className }: Props) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | "shared" | "downloaded">(null);

  function track(destino: string) {
    if (mensagemId && typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/evento/",
        new Blob(
          [JSON.stringify({ tipo: "share", mensagemId, meta: { destino: `image-${destino}` } })],
          { type: "application/json" },
        ),
      );
    }
    trackEvent("share_image", {
      method: destino,
      mensagem_id: mensagemId,
      slug,
      page_path: typeof window !== "undefined" ? window.location.pathname : "",
    });
  }

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error("fetch image fail");
      const blob = await res.blob();
      const filename = `portalsoma-${slug ?? "mensagem"}.png`;
      const file = new File([blob], filename, { type: blob.type || "image/png" });

      const navAny = navigator as Navigator & {
        canShare?: (data: { files?: File[] }) => boolean;
      };

      if (navAny.canShare?.({ files: [file] }) && typeof navigator.share === "function") {
        try {
          await navigator.share({ files: [file], title: titulo });
          track("share-files");
          setDone("shared");
        } catch (err: unknown) {
          // Usuário cancelou · não trata como erro
          if ((err as { name?: string })?.name !== "AbortError") {
            await fallbackDownload(blob, filename);
            setDone("downloaded");
          }
        }
      } else {
        await fallbackDownload(blob, filename);
        setDone("downloaded");
      }
    } catch {
      // Silencioso · botão volta ao estado normal
    } finally {
      setBusy(false);
      if (done) setTimeout(() => setDone(null), 2500);
    }
  }

  async function fallbackDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    track("download");
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={busy}
      aria-label="Compartilhar imagem"
      className={
        className ??
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur text-stone-800 text-sm font-medium shadow-md hover:bg-white transition-colors disabled:opacity-60"
      }
    >
      {done === "shared" ? (
        <>
          <Check size={15} className="text-emerald-600" strokeWidth={2.5} />
          <span>Pronto</span>
        </>
      ) : done === "downloaded" ? (
        <>
          <Download size={15} className="text-niver-600" strokeWidth={2.5} />
          <span>Baixada</span>
        </>
      ) : (
        <>
          <ImageIcon size={15} strokeWidth={2.4} />
          <span>{busy ? "Preparando…" : "Compartilhar imagem"}</span>
        </>
      )}
    </button>
  );
}
