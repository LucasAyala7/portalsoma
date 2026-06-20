"use client";

import { MessageCircle } from "lucide-react";
import { trackEvent, withUtm } from "@/lib/analytics";

interface Props {
  text: string;
  url: string;
  mensagemId?: string;
  variant?: "primary" | "ghost";
  size?: "sm" | "md";
}

/**
 * Click-to-Send direto pro WhatsApp · abre wa.me com texto+link pré-preenchidos.
 * Sem modal, sem fricção: ato principal do site (compartilhar mensagem) em 1 clique.
 */
export function WhatsAppSendButton({ text, url, mensagemId, variant = "primary", size = "sm" }: Props) {
  const fullUrl = url.startsWith("http") ? url : `https://www.portalsoma.com.br${url}`;
  const trackedUrl = withUtm(fullUrl, "share", "whatsapp", "card_primary");
  const payload = encodeURIComponent(`${text}\n\n${trackedUrl}`);
  const href = `https://wa.me/?text=${payload}`;

  function onClick() {
    if (mensagemId && typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/evento/",
        new Blob(
          [JSON.stringify({ tipo: "share", mensagemId, meta: { destino: "whatsapp_direct" } })],
          { type: "application/json" },
        ),
      );
    }
    trackEvent("share_message", {
      method: "whatsapp_direct",
      mensagem_id: mensagemId,
      page_path: typeof window !== "undefined" ? window.location.pathname : "",
    });
  }

  const cls =
    variant === "primary"
      ? `inline-flex items-center gap-1.5 ${size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs"} rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold shadow-sm transition-colors`
      : `inline-flex items-center gap-1.5 ${size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs"} rounded-full bg-green-50 hover:bg-green-100 text-green-700 font-medium transition-colors`;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={cls} aria-label="Enviar pelo WhatsApp">
      <MessageCircle size={size === "md" ? 16 : 13} strokeWidth={2.4} />
      <span>WhatsApp</span>
    </a>
  );
}
