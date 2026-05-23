"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface Props {
  text: string;
  mensagemId?: string;
  className?: string;
  label?: string;
}

export function CopyButton({ text, mensagemId, className, label = "Copiar" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);

      if (mensagemId) {
        navigator.sendBeacon?.(
          "/api/evento/",
          new Blob([JSON.stringify({ tipo: "copy", mensagemId })], {
            type: "application/json",
          }),
        );
      }
      trackEvent("copy_message", {
        mensagem_id: mensagemId,
        text_length: text.length,
        page_path: typeof window !== "undefined" ? window.location.pathname : "",
      });
    } catch (err) {
      console.error("Falha ao copiar:", err);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={className ?? "btn-primary"}
      aria-label="Copiar mensagem"
    >
      {copied ? (
        <>
          <Check size={16} strokeWidth={2.5} />
          <span>Copiado!</span>
        </>
      ) : (
        <>
          <Copy size={16} strokeWidth={2.5} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
