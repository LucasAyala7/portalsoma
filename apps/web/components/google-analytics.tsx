import Script from "next/script";

/**
 * Google Analytics 4 — carregamento global via next/script.
 * - strategy="afterInteractive": carrega após hydration, não bloqueia LCP.
 * - Configurado em layout.tsx; emite events via `trackEvent()` helper.
 */
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  if (!measurementId) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            send_page_view: true,
            anonymize_ip: false,
          });
        `}
      </Script>
    </>
  );
}
