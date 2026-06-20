import { ImageResponse } from "next/og";
import { prisma } from "@nivertotal/db";

export const runtime = "nodejs";
// Cache CDN 24h — gera 1 vez, serve milhões de vezes via CF.
export const revalidate = 86400;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.portalsoma.com.br";

/**
 * OG image dinâmica com texto da mensagem.
 * Quando alguém compartilha link no WhatsApp/IG/X, preview mostra a mensagem inteira
 * em vez de imagem genérica — CTR x2 em compartilhamento orgânico.
 *
 * Uso: <link rel="og:image" content="https://www.portalsoma.com.br/api/og?id={mensagemId}">
 *
 * Output: 1200x630 PNG (formato OG/Twitter padrão).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return new Response("missing id", { status: 400 });
  }

  const m = await prisma.mensagem.findUnique({
    where: { id },
    select: {
      titulo: true,
      conteudo: true,
      autor: { select: { nome: true } },
      cluster: { select: { nome: true } },
    },
  });

  if (!m) return new Response("not found", { status: 404 });

  // Trim do conteúdo se for muito longo — caber na imagem.
  const conteudo = m.conteudo.length > 280 ? m.conteudo.slice(0, 277) + "…" : m.conteudo;
  const fontSize = m.conteudo.length > 200 ? 30 : m.conteudo.length > 120 ? 36 : 42;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #fff7ed 0%, #fff 50%, #fef3c7 100%)",
          display: "flex",
          flexDirection: "column",
          padding: 60,
          fontFamily: "ui-serif, Georgia, serif",
          color: "#1c1917",
          position: "relative",
        }}
      >
        {/* Topo: brand + categoria */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: "#f97316",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              S
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#9a3412" }}>
                Portal Soma
              </span>
              <span style={{ fontSize: 14, color: "#78716c" }}>portalsoma.com.br</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 16,
              color: "#9a3412",
              background: "#ffedd5",
              padding: "8px 16px",
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            {m.cluster.nome}
          </div>
        </div>

        {/* Aspas decorativas */}
        <div
          style={{
            display: "flex",
            fontSize: 120,
            color: "#fed7aa",
            lineHeight: 0.5,
            marginTop: 12,
            fontFamily: "Georgia, serif",
          }}
        >
          “
        </div>

        {/* Conteúdo da mensagem */}
        <div
          style={{
            display: "flex",
            flex: 1,
            fontSize,
            lineHeight: 1.4,
            color: "#292524",
            fontStyle: "italic",
            marginTop: -20,
            paddingLeft: 20,
            paddingRight: 20,
          }}
        >
          {conteudo}
        </div>

        {/* Footer: autoria */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #e7e5e4",
            paddingTop: 20,
            marginTop: 20,
            fontSize: 18,
            color: "#78716c",
          }}
        >
          <span>— {m.autor.nome}</span>
          <span style={{ color: "#f97316", fontWeight: 600 }}>copie · compartilhe</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      },
    },
  );
}
