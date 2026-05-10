"use client";

import { useEffect, useState } from "react";
import { Copy, Share2, Heart, Check } from "lucide-react";

interface Props {
  text: string;
  url: string;
  mensagemId: string;
  initialLikes: number;
}

const STORAGE_KEY = "nivertotal:likes";

function readLiked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeLiked(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* noop */
  }
}

/**
 * Barra de ações fixa no rodapé da tela em MOBILE.
 * No DESKTOP fica oculta (ações estão inline na page).
 *
 * Comportamento:
 *  - Aparece quando o usuário rola além do hero (≥240px)
 *  - 3 botões grandes touch-friendly: Copiar, Compartilhar, Curtir
 *  - Like persistido em localStorage + sendBeacon pra API
 *  - Visual app-style (pill arredondada, shadow elevation, fundo branco)
 */
export function StickyActionBar({ text, url, mensagemId, initialLikes }: Props) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const fullUrl = url.startsWith("http") ? url : `https://www.portalsoma.com.br${url}`;

  useEffect(() => {
    setLiked(readLiked().has(mensagemId));
  }, [mensagemId]);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 240);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      navigator.sendBeacon?.(
        "/api/evento/",
        new Blob([JSON.stringify({ tipo: "copy", mensagemId })], {
          type: "application/json",
        }),
      );
    } catch {
      /* noop */
    }
  }

  async function handleShare() {
    if ("share" in navigator) {
      try {
        await navigator.share({ text, url: fullUrl });
        navigator.sendBeacon?.(
          "/api/evento/",
          new Blob(
            [JSON.stringify({ tipo: "share", mensagemId, meta: { destino: "native" } })],
            { type: "application/json" },
          ),
        );
        return;
      } catch {
        /* user cancelou */
      }
    }
    // fallback: WhatsApp
    const wa = `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${fullUrl}`)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
    navigator.sendBeacon?.(
      "/api/evento/",
      new Blob(
        [JSON.stringify({ tipo: "share", mensagemId, meta: { destino: "whatsapp_fallback" } })],
        { type: "application/json" },
      ),
    );
  }

  function handleLike() {
    const set = readLiked();
    const willUnlike = set.has(mensagemId);
    if (willUnlike) {
      set.delete(mensagemId);
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      set.add(mensagemId);
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
    writeLiked(set);
    navigator.sendBeacon?.(
      "/api/evento/",
      new Blob([JSON.stringify({ tipo: willUnlike ? "unlike" : "like", mensagemId })], {
        type: "application/json",
      }),
    );
  }

  return (
    <>
      {/* spacer pro conteúdo não ficar atrás da bar fixa em mobile */}
      <div className="md:hidden h-24" aria-hidden="true" />

      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-3 mb-3 bg-white/95 backdrop-blur-md border border-stone-200/80 rounded-2xl shadow-2xl shadow-niver-900/10 p-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl bg-niver-600 text-white hover:bg-niver-700 active:scale-95 transition-all"
            aria-label="Copiar mensagem"
          >
            {copied ? (
              <>
                <Check size={20} strokeWidth={2.4} />
                <span className="text-[11px] font-medium">Copiado</span>
              </>
            ) : (
              <>
                <Copy size={20} strokeWidth={2.4} />
                <span className="text-[11px] font-medium">Copiar</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl bg-stone-100 text-stone-800 hover:bg-stone-200 active:scale-95 transition-all"
            aria-label="Compartilhar"
          >
            <Share2 size={20} strokeWidth={2.4} />
            <span className="text-[11px] font-medium">Enviar</span>
          </button>
          <button
            type="button"
            onClick={handleLike}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl transition-all active:scale-95 ${
              liked
                ? "bg-rose-50 text-rose-600"
                : "bg-stone-100 text-stone-800 hover:bg-stone-200"
            }`}
            aria-pressed={liked}
            aria-label={liked ? "Descurtir" : "Curtir"}
          >
            <Heart
              size={20}
              strokeWidth={2.4}
              className={liked ? "fill-rose-500" : ""}
            />
            <span className="text-[11px] font-medium tabular-nums">
              {likeCount > 0 ? likeCount.toLocaleString("pt-BR") : "Curtir"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
