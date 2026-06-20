import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon dinâmico · "S" laranja em circular branco.
 * Gerado em build, servido como /icon (Next 16 convenção file-based).
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f97316",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 800,
          fontFamily: "ui-sans-serif, system-ui",
          borderRadius: 6,
        }}
      >
        S
      </div>
    ),
    { ...size },
  );
}
