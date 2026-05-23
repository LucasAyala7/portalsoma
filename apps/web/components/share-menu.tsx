"use client";

import { useState } from "react";
import { Share2, MessageCircle, Send, Facebook, Link2, X } from "lucide-react";
import { trackEvent, withUtm } from "@/lib/analytics";

interface Props {
  text: string;
  url: string;
  mensagemId?: string;
  /** Quando true, append "via portalsoma.com.br/{slug}" no texto compartilhado. */
  promoteOnShare?: boolean;
}

export function ShareMenu({ text, url, mensagemId, promoteOnShare }: Props) {
  const [open, setOpen] = useState(false);
  const fullUrl = url.startsWith("http") ? url : `https://www.portalsoma.com.br${url}`;
  // URLs com UTM por destino — pra GA atribuir tráfego que volta via share.
  const campaign = promoteOnShare ? "promote" : "user_share";
  const urlWa = withUtm(fullUrl, "share", "whatsapp", campaign);
  const urlTg = withUtm(fullUrl, "share", "telegram", campaign);
  const urlFb = withUtm(fullUrl, "share", "facebook", campaign);
  const urlNative = withUtm(fullUrl, "share", "native", campaign);
  const urlLink = withUtm(fullUrl, "share", "link", campaign);

  // Texto puro pra navigator.share / texto+link pra deep links (whatsapp/telegram).
  // Se promoteOnShare: também adiciona linha "via portalsoma.com.br/{slug}" no texto puro.
  const promoLine = promoteOnShare ? `\n\nvia portalsoma.com.br${url}` : "";
  const sharedText = `${text}${promoLine}`;
  const encodedTextWa = encodeURIComponent(`${sharedText}\n\n${urlWa}`);
  const encodedUrlFb = encodeURIComponent(urlFb);
  const encodedTextTgOnly = encodeURIComponent(sharedText);

  function track(destino: string) {
    if (mensagemId && navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/evento/",
        new Blob([JSON.stringify({ tipo: "share", mensagemId, meta: { destino } })], {
          type: "application/json",
        }),
      );
    }
    trackEvent("share_message", {
      method: destino,
      mensagem_id: mensagemId,
      promote_on_share: !!promoteOnShare,
      page_path: typeof window !== "undefined" ? window.location.pathname : "",
    });
  }

  async function handleNative() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ text: sharedText, url: urlNative });
        track("native");
        return;
      } catch {
        /* user cancelou */
      }
    }
    setOpen(true);
  }

  return (
    <>
      <button type="button" onClick={handleNative} className="btn-ghost" aria-label="Compartilhar">
        <Share2 size={16} />
        <span>Compartilhar</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-lg">Compartilhar</h3>
              <button onClick={() => setOpen(false)} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`https://wa.me/?text=${encodedTextWa}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("whatsapp")}
                className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-100"
              >
                <MessageCircle size={20} />
                <span className="font-medium">WhatsApp</span>
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(urlTg)}&text=${encodedTextTgOnly}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("telegram")}
                className="flex items-center gap-2 p-3 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100"
              >
                <Send size={20} />
                <span className="font-medium">Telegram</span>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrlFb}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("facebook")}
                className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <Facebook size={20} />
                <span className="font-medium">Facebook</span>
              </a>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(urlLink);
                  track("link");
                  setOpen(false);
                }}
                className="flex items-center gap-2 p-3 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200"
              >
                <Link2 size={20} />
                <span className="font-medium">Copiar link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
