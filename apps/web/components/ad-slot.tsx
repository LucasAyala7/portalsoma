"use client";

import { useEffect, useRef } from "react";

interface Props {
  /** Slot ID criado no painel AdSense (Ads → By ad unit → copy ID) */
  slot: string;
  /** display | in-article | in-feed (default: display) */
  format?: "auto" | "fluid" | "rectangle";
  /** layout pra in-article (ex: "in-article", "-fb+5w+4e-db+86") */
  layoutKey?: string;
  /** estilo customizado (reservar altura mínima ajuda CLS) */
  minHeight?: number;
  className?: string;
}

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-8917133059843595";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Slot de ad manual — reserva espaço (minHeight) pra evitar CLS, e dispara
 * adsbygoogle.push() no mount. Funciona em SPA navigation também.
 */
export function AdSlot({ slot, format = "auto", layoutKey, minHeight = 250, className }: Props) {
  const ref = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {
      /* swallow — adblock ou script ainda não carregou */
    }
  }, []);

  return (
    <div
      className={`ad-slot ${className ?? ""}`}
      style={{ minHeight, display: "block", textAlign: "center", margin: "1.5rem 0" }}
      data-ad-slot-wrap
    >
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
      />
    </div>
  );
}
