/**
 * Client-side analytics helper.
 * Envia eventos pro gtag (GA4) E pro backend /api/evento (telemetria interna no DB).
 * Safe em SSR (noop server-side).
 */

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
    dataLayer?: unknown[];
  }
}

type EventParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(name: string, params: EventParams = {}) {
  if (typeof window === "undefined") return;
  try {
    if (window.gtag) {
      window.gtag("event", name, params);
    }
  } catch {
    /* swallow */
  }
}

/** Track + envia também pra backend /api/evento (counts no DB). */
export function trackBoth(
  name: string,
  mensagemId: string | undefined,
  params: EventParams = {},
  backendTipo?: "view" | "copy" | "share" | "like",
) {
  trackEvent(name, { ...params, mensagem_id: mensagemId });
  if (backendTipo && mensagemId && typeof navigator !== "undefined" && navigator.sendBeacon) {
    try {
      navigator.sendBeacon(
        "/api/evento/",
        new Blob(
          [JSON.stringify({ tipo: backendTipo, mensagemId, meta: params })],
          { type: "application/json" },
        ),
      );
    } catch {
      /* swallow */
    }
  }
}

/**
 * Append UTM params num URL.
 * Não duplica se já tem utm_source.
 */
export function withUtm(
  url: string,
  source: string,
  medium: string,
  campaign: string = "user_share",
): string {
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "https://www.portalsoma.com.br");
    if (u.searchParams.has("utm_source")) return url; // já tem
    u.searchParams.set("utm_source", source);
    u.searchParams.set("utm_medium", medium);
    u.searchParams.set("utm_campaign", campaign);
    return u.toString();
  } catch {
    return url;
  }
}
