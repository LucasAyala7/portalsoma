import Script from "next/script";

/**
 * Google AdSense — carregamento lazy (após idle) pra não destruir LCP.
 * Auto Ads ativado no painel → Google injeta posicionamento automaticamente.
 *
 * Pra slots manuais, usar <AdSlot slot="..." /> em pontos estratégicos.
 */
export function GoogleAdsense({ client }: { client: string }) {
  if (!client) return null;
  return (
    <Script
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
