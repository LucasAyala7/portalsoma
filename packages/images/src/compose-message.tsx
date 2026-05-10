/**
 * Compose mensagem em imagem — 4 templates (CENTRO/CARD/FULL/MINIMAL).
 *
 * CENTRO  → bg Flux + duotone overlay colorido + texto branco grande contraste AAA (default pra média/curta)
 * CARD    → bg Flux + card branco arredondado com aspas (elegante, neutro)
 * FULL    → bg Flux full + scrim gradient pesado bottom-up + texto bem contrastado (longas)
 * MINIMAL → sem Flux, gradient cor da paleta + decoração (custo zero, fração pequena)
 *
 * Marca d'água: canto inferior direito, sempre.
 */

import * as React from "react";
import { ImageResponse } from "@vercel/og";

export type ComposeTemplate = "centro" | "card" | "full" | "minimal";
export type ComposeFormato = "hero" | "og" | "pinterest" | "story";
export type ComposePaleta = "warm" | "rose" | "sky" | "violet" | "emerald" | "amber";

export interface ComposeInput {
  texto: string;
  autorNome?: string;
  template?: ComposeTemplate;
  paleta?: ComposePaleta;
  formato?: ComposeFormato;
  /** URL da imagem Flux usada como background (não usado em minimal) */
  bgUrl?: string;
}

export interface ComposeOutput {
  buffer: Buffer;
  width: number;
  height: number;
  template: ComposeTemplate;
  fontSize: number;
}

const DIM: Record<ComposeFormato, { w: number; h: number }> = {
  hero: { w: 1200, h: 800 },
  og: { w: 1200, h: 630 },
  pinterest: { w: 1000, h: 1500 },
  story: { w: 1080, h: 1920 },
};

const PALETAS: Record<
  ComposePaleta,
  { primary: string; soft: string; deep: string; deeper: string; accent: string }
> = {
  warm: { primary: "#c2410c", soft: "#fef3e2", deep: "#7c2d12", deeper: "#3d1109", accent: "#fb923c" },
  rose: { primary: "#be123c", soft: "#fff1f2", deep: "#881337", deeper: "#4c0519", accent: "#fda4af" },
  sky: { primary: "#0369a1", soft: "#f0f9ff", deep: "#0c4a6e", deeper: "#082f49", accent: "#7dd3fc" },
  violet: { primary: "#6d28d9", soft: "#f5f3ff", deep: "#4c1d95", deeper: "#2e1065", accent: "#c4b5fd" },
  emerald: { primary: "#047857", soft: "#ecfdf5", deep: "#064e3b", deeper: "#022c22", accent: "#6ee7b7" },
  amber: { primary: "#b45309", soft: "#fffbeb", deep: "#78350f", deeper: "#451a03", accent: "#fcd34d" },
};

/**
 * Auto-decide template baseado em word count.
 * Sem BG → MINIMAL.
 * Com BG → CENTRO (≤80w) ou FULL (>80w pra dar mais respiração ao texto longo).
 */
export function pickTemplate(texto: string, hasBg: boolean): ComposeTemplate {
  if (!hasBg) return "minimal";
  const words = texto.trim().split(/\s+/).length;
  if (words <= 80) return "centro";
  return "full";
}

/** Calcula font size por word count + altura */
function pickFontSize(texto: string, height: number): number {
  const words = texto.trim().split(/\s+/).length;
  const heightFactor = height / 800;

  let base: number;
  if (words <= 25) base = 64;
  else if (words <= 50) base = 50;
  else if (words <= 80) base = 40;
  else if (words <= 120) base = 32;
  else if (words <= 180) base = 26;
  else base = 22;

  return Math.round(base * heightFactor);
}

/**
 * Quebra o texto em "estrofes" pra respirar visualmente em mensagens longas.
 * Identifica "\n\n" como quebra forte, mantém. Pra textos sem quebra, tenta quebrar
 * em frases de até ~12 palavras.
 */
function softWrap(texto: string): string {
  if (texto.includes("\n\n")) return texto.trim();
  return texto.trim();
}

// ============================================================
// MARCA D'ÁGUA (todos templates)
// ============================================================

function Watermark({ light = false }: { light?: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        right: 28,
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: light ? "rgba(255,255,255,0.92)" : "rgba(120,113,108,1)",
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          background: light ? "rgba(255,255,255,0.95)" : "#ea580c",
          color: light ? "#ea580c" : "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "Inter",
        }}
      >
        P
      </div>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{ fontFamily: "Fraunces", fontWeight: 700, fontSize: 16 }}>Portal Soma</span>
        <span style={{ fontSize: 10, opacity: 0.75, marginTop: 2, fontFamily: "Inter" }}>
          portalsoma.com.br
        </span>
      </div>
    </div>
  );
}

// ============================================================
// COMPOSE
// ============================================================

export async function composeMessageImage(input: ComposeInput): Promise<ComposeOutput> {
  const formato = input.formato ?? "hero";
  const dim = DIM[formato];
  const paleta = PALETAS[input.paleta ?? "warm"];
  const template = input.template ?? pickTemplate(input.texto, !!input.bgUrl);
  const fontSize = pickFontSize(input.texto, dim.h);
  const texto = softWrap(input.texto);

  let element: React.ReactElement;

  if (template === "minimal") {
    element = renderMinimal(texto, input.autorNome, paleta, fontSize, dim);
  } else if (template === "card") {
    element = renderCard(texto, input.autorNome, paleta, fontSize, dim, input.bgUrl);
  } else if (template === "full") {
    element = renderFull(texto, input.autorNome, paleta, fontSize, dim, input.bgUrl);
  } else {
    element = renderCentro(texto, input.autorNome, paleta, fontSize, dim, input.bgUrl);
  }

  const ir = new ImageResponse(element, { width: dim.w, height: dim.h });
  const buffer = Buffer.from(await ir.arrayBuffer());

  return { buffer, width: dim.w, height: dim.h, template, fontSize };
}

// ============================================================
// TEMPLATE: CENTRO (estrela do show)
// ============================================================
// Bg Flux + DUOTONE overlay com cor da paleta + dark scrim → contraste AAA
// Texto branco grande, text-shadow forte
// Pequeno selo de paleta no canto superior esquerdo

function renderCentro(
  texto: string,
  autor: string | undefined,
  paleta: typeof PALETAS.warm,
  fontSize: number,
  dim: { w: number; h: number },
  bgUrl?: string,
) {
  const padding = Math.round(dim.w * 0.07);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: paleta.deeper,
        fontFamily: "Inter",
      }}
    >
      {bgUrl && (
        <img
          src={bgUrl}
          width={dim.w}
          height={dim.h}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            objectFit: "cover",
            opacity: 0.7,
          }}
          alt=""
        />
      )}
      {/* duotone overlay: cor da paleta + dark gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${paleta.primary}E6 0%, ${paleta.deeper}D9 100%)`,
          mixBlendMode: "multiply",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.35) 100%)`,
          display: "flex",
        }}
      />

      {/* selo decorativo canto superior */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 28,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(255,255,255,0.18)",
          backdropFilter: "blur(8px)",
          padding: "6px 14px",
          borderRadius: 999,
          color: "white",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: 9999, background: paleta.accent, display: "flex" }} />
        Mensagem do dia
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          padding,
          paddingTop: padding * 1.4,
          paddingBottom: padding * 1.4,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        }}
      >
        <div
          style={{
            fontFamily: "Fraunces",
            fontSize,
            fontWeight: 600,
            lineHeight: 1.28,
            textAlign: "center",
            maxWidth: dim.w * 0.85,
            display: "flex",
            textShadow: "0 4px 28px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.3)",
            letterSpacing: -0.3,
          }}
        >
          {texto}
        </div>
        {autor && (
          <div
            style={{
              marginTop: Math.round(fontSize * 0.6),
              fontSize: Math.max(14, Math.round(fontSize * 0.3)),
              opacity: 0.95,
              letterSpacing: 2,
              textTransform: "uppercase",
              fontFamily: "Inter",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ width: 24, height: 1, background: "rgba(255,255,255,0.6)", display: "flex" }} />
            {autor}
            <span style={{ width: 24, height: 1, background: "rgba(255,255,255,0.6)", display: "flex" }} />
          </div>
        )}
      </div>
      <Watermark light />
    </div>
  );
}

// ============================================================
// TEMPLATE: CARD (elegante, mensagens médias)
// ============================================================

function renderCard(
  texto: string,
  autor: string | undefined,
  paleta: typeof PALETAS.warm,
  fontSize: number,
  dim: { w: number; h: number },
  bgUrl?: string,
) {
  const cardPadding = Math.round(dim.w * 0.06);
  const outerPadding = Math.round(dim.w * 0.08);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        background: bgUrl ? "white" : `linear-gradient(135deg, ${paleta.soft}, white)`,
        fontFamily: "Inter",
      }}
    >
      {bgUrl && (
        <img
          src={bgUrl}
          width={dim.w}
          height={dim.h}
          style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
          alt=""
        />
      )}
      {bgUrl && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${paleta.primary}40 0%, transparent 60%)`,
            display: "flex",
          }}
        />
      )}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          padding: outerPadding,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 28,
            padding: cardPadding,
            boxShadow: "0 30px 80px -20px rgba(0,0,0,0.35)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            maxWidth: dim.w * 0.78,
            border: `1px solid ${paleta.soft}`,
          }}
        >
          <div
            style={{
              fontFamily: "Fraunces",
              fontSize: 72,
              color: paleta.primary,
              marginBottom: -8,
              marginTop: -8,
              fontWeight: 700,
              lineHeight: 0.7,
              display: "flex",
            }}
          >
            "
          </div>
          <div
            style={{
              fontFamily: "Fraunces",
              fontSize,
              color: "#292524",
              lineHeight: 1.35,
              fontWeight: 500,
              display: "flex",
            }}
          >
            {texto}
          </div>
          {autor && (
            <div
              style={{
                marginTop: 24,
                paddingTop: 18,
                borderTop: `2px solid ${paleta.soft}`,
                width: "100%",
                fontSize: 16,
                color: paleta.deep,
                letterSpacing: 1,
                textTransform: "uppercase",
                fontWeight: 600,
                fontFamily: "Inter",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ width: 20, height: 2, background: paleta.primary, display: "flex" }} />
              {autor}
            </div>
          )}
        </div>
      </div>
      <Watermark light={!!bgUrl} />
    </div>
  );
}

// ============================================================
// TEMPLATE: FULL (longas — bg full + scrim pesado bottom-up)
// ============================================================
// Bg ocupa toda a área. Scrim radial/linear bem forte da metade pra baixo
// pra texto ficar 100% legível mesmo em bg complexo.
// Texto justificado à esquerda em 75% da largura, fica num "frame" inferior.

function renderFull(
  texto: string,
  autor: string | undefined,
  paleta: typeof PALETAS.warm,
  fontSize: number,
  dim: { w: number; h: number },
  bgUrl?: string,
) {
  const padding = Math.round(dim.w * 0.07);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        background: paleta.deeper,
        fontFamily: "Inter",
      }}
    >
      {bgUrl && (
        <img
          src={bgUrl}
          width={dim.w}
          height={dim.h}
          style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
          alt=""
        />
      )}
      {/* Scrim pesado: dark gradient da metade pra baixo + tint colorido */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, transparent 0%, ${paleta.deeper}80 35%, ${paleta.deeper}F0 70%, ${paleta.deeper} 100%)`,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, transparent 0%, transparent 30%, ${paleta.primary}30 100%)`,
          mixBlendMode: "multiply",
          display: "flex",
        }}
      />

      {/* selo top */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 28,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(8px)",
          padding: "6px 14px",
          borderRadius: 999,
          color: "white",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: 9999, background: paleta.accent, display: "flex" }} />
        Mensagem
      </div>

      {/* Conteúdo: ancorado no bottom 60% */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          padding,
          paddingBottom: padding * 1.6,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          color: "white",
        }}
      >
        <div
          style={{
            fontFamily: "Fraunces",
            fontSize,
            fontWeight: 500,
            lineHeight: 1.4,
            textAlign: "left",
            maxWidth: dim.w * 0.82,
            display: "flex",
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            letterSpacing: -0.2,
          }}
        >
          {texto}
        </div>
        {autor && (
          <div
            style={{
              marginTop: Math.round(fontSize * 0.7),
              fontSize: Math.max(14, Math.round(fontSize * 0.45)),
              opacity: 0.92,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              fontFamily: "Inter",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ width: 28, height: 2, background: paleta.accent, display: "flex" }} />
            {autor}
          </div>
        )}
      </div>
      <Watermark light />
    </div>
  );
}

// ============================================================
// TEMPLATE: MINIMAL (sem Flux, fração pequena)
// ============================================================

function renderMinimal(
  texto: string,
  autor: string | undefined,
  paleta: typeof PALETAS.warm,
  fontSize: number,
  dim: { w: number; h: number },
) {
  const padding = Math.round(dim.w * 0.08);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: `linear-gradient(135deg, ${paleta.primary} 0%, ${paleta.deep} 100%)`,
        fontFamily: "Inter",
      }}
    >
      {/* Decoração: círculos sutis */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: 9999,
          background: paleta.accent,
          opacity: 0.18,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -150,
          left: -80,
          width: 350,
          height: 350,
          borderRadius: 9999,
          background: paleta.accent,
          opacity: 0.12,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          padding,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        }}
      >
        <div
          style={{
            fontFamily: "Fraunces",
            fontSize,
            fontWeight: 600,
            lineHeight: 1.25,
            textAlign: "center",
            maxWidth: dim.w * 0.82,
            display: "flex",
            letterSpacing: -0.5,
          }}
        >
          {texto}
        </div>
        {autor && (
          <div
            style={{
              marginTop: Math.round(fontSize * 0.7),
              fontSize: Math.round(fontSize * 0.32),
              opacity: 0.85,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              fontFamily: "Inter",
              fontWeight: 500,
              display: "flex",
            }}
          >
            — {autor}
          </div>
        )}
      </div>
      <Watermark light />
    </div>
  );
}
