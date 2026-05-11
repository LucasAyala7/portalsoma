"use client";

import { useEffect } from "react";

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
  }, [mensagemId]);
  return null;
}
