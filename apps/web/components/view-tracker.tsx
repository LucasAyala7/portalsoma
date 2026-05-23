"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function ViewTracker({ mensagemId }: { mensagemId: string }) {
  useEffect(() => {
    const body = JSON.stringify({ tipo: "view", mensagemId });
    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/evento/", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/evento/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
    trackEvent("view_message", {
      mensagem_id: mensagemId,
      page_path: typeof window !== "undefined" ? window.location.pathname : "",
    });
  }, [mensagemId]);
  return null;
}
