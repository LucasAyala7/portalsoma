/**
 * OG image programática usando @vercel/og (Satori).
 * Custo: ZERO. Usado para TIER_3 (cauda longa) e fallback geral.
 */

import { ImageResponse } from "@vercel/og";
import { uploadBuffer } from "./r2.js";

export interface OgInput {
  titulo: string;
  destinatario?: string;
  autorNome?: string;
  autorFotoUrl?: string;
  paletaSlug?: "warm" | "rose" | "sky" | "violet" | "emerald";
  formato: "og" | "pinterest" | "story_frame";
  keyBase: string;
}

export interface OgOutput {
  url: string;
  width: number;
  height: number;
  custoBRL: 0;
}

const DIMENSOES = {
  og: { width: 1200, height: 630 },
  pinterest: { width: 1000, height: 1500 },
  story_frame: { width: 1080, height: 1920 },
};

const PALETAS = {
  warm: { bg: "#fef3e2", primary: "#c2410c", text: "#7c2d12", pill: "#fed7aa" },
  rose: { bg: "#fff1f2", primary: "#be123c", text: "#881337", pill: "#fecdd3" },
  sky: { bg: "#f0f9ff", primary: "#0369a1", text: "#0c4a6e", pill: "#bae6fd" },
  violet: { bg: "#f5f3ff", primary: "#6d28d9", text: "#4c1d95", pill: "#ddd6fe" },
  emerald: { bg: "#ecfdf5", primary: "#047857", text: "#064e3b", pill: "#a7f3d0" },
};

export async function generateOgProgramatic(input: OgInput): Promise<OgOutput> {
  const dim = DIMENSOES[input.formato];
  const paleta = PALETAS[input.paletaSlug ?? "warm"];
  const isVertical = input.formato !== "og";

  const ir = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${paleta.bg} 0%, white 100%)`,
          padding: isVertical ? 60 : 80,
          justifyContent: "space-between",
          fontFamily: "Inter",
        }}
      >
        {input.destinatario ? (
          <div
            style={{
              display: "flex",
              background: paleta.pill,
              color: paleta.primary,
              padding: "8px 20px",
              borderRadius: 999,
              fontSize: 28,
              fontWeight: 600,
              alignSelf: "flex-start",
            }}
          >
            {input.destinatario}
          </div>
        ) : (
          <div />
        )}

        <div
          style={{
            display: "flex",
            fontSize: isVertical ? 78 : 64,
            fontWeight: 700,
            color: paleta.text,
            lineHeight: 1.1,
            letterSpacing: -1,
            marginTop: isVertical ? 60 : 0,
          }}
        >
          {input.titulo}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: paleta.primary }}>
              Portal Soma
            </div>
            <div style={{ fontSize: 22, color: paleta.text, opacity: 0.7 }}>
              portalsoma.com.br
            </div>
          </div>
          {input.autorNome ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 22,
                color: paleta.text,
              }}
            >
              {input.autorFotoUrl ? (
                <img
                  src={input.autorFotoUrl}
                  width={48}
                  height={48}
                  style={{ borderRadius: 999, objectFit: "cover" }}
                  alt=""
                />
              ) : null}
              <div>por {input.autorNome}</div>
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>
    ),
    {
      width: dim.width,
      height: dim.height,
    },
  );

  const buffer = Buffer.from(await ir.arrayBuffer());
  const key = `${input.keyBase}-${input.formato}-${dim.width}x${dim.height}.png`;
  const uploaded = await uploadBuffer({ key, buffer, contentType: "image/png" });

  return { url: uploaded.url, width: dim.width, height: dim.height, custoBRL: 0 };
}
