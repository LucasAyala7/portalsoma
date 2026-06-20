/**
 * /ads.txt · declara publisher AdSense autorizado.
 * Google verifica esse arquivo antes de servir ads. Ausente = ads não rodam.
 */
export const dynamic = "force-static";
export const revalidate = false;

const ADSENSE_PUBLISHER = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "pub-3880875536722698";

export async function GET() {
  const body = `google.com, ${ADSENSE_PUBLISHER}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
