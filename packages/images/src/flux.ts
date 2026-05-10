/**
 * Geração de imagens via Replicate (Flux Pro pra TIER_1, Schnell pra TIER_2).
 * Custo aproximado:
 *   - Flux Pro: ~$0.04/img → ~R$0,22
 *   - Flux Schnell: ~$0.003/img → ~R$0,02
 */

import Replicate from "replicate";
import sharp from "sharp";
import { uploadBuffer } from "./r2.js";

let _client: Replicate | null = null;
function client(): Replicate {
  if (_client) return _client;
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN não setado");
  _client = new Replicate({ auth: token });
  return _client;
}

const FLUX_PRO = (process.env.REPLICATE_FLUX_PRO_MODEL ?? "black-forest-labs/flux-1.1-pro") as `${string}/${string}`;
const FLUX_SCHNELL = (process.env.REPLICATE_FLUX_SCHNELL_MODEL ?? "black-forest-labs/flux-schnell") as `${string}/${string}`;

const PRECO_BRL = {
  pro: 0.22,
  schnell: 0.02,
};

export type FluxModel = "pro" | "schnell";
export type ImageFormato = "hero" | "og" | "pinterest" | "story_frame" | "persona";

export interface FluxGenInput {
  prompt: string;
  model: FluxModel;
  formato: ImageFormato;
  /** chave única R2 — sem extensão */
  keyBase: string;
  alt: string;
}

export interface FluxGenOutput {
  url: string;
  width: number;
  height: number;
  modelo: string;
  custoBRL: number;
  promptUsado: string;
  alt: string;
}

const FORMATO_DIMENSOES: Record<ImageFormato, { width: number; height: number; aspect: string }> = {
  hero: { width: 1200, height: 800, aspect: "3:2" },
  og: { width: 1200, height: 630, aspect: "1.91:1" },
  pinterest: { width: 1000, height: 1500, aspect: "2:3" },
  story_frame: { width: 1080, height: 1920, aspect: "9:16" },
  persona: { width: 1024, height: 1024, aspect: "1:1" },
};

export async function generateFluxImage(input: FluxGenInput): Promise<FluxGenOutput> {
  const dim = FORMATO_DIMENSOES[input.formato];
  const modelRef = input.model === "pro" ? FLUX_PRO : FLUX_SCHNELL;

  const fluxInput =
    input.model === "pro"
      ? {
          prompt: input.prompt,
          aspect_ratio: dim.aspect,
          output_format: "jpg",
          output_quality: 90,
          safety_tolerance: 2,
        }
      : {
          prompt: input.prompt,
          aspect_ratio: dim.aspect,
          output_format: "jpg",
          output_quality: 90,
          num_outputs: 1,
          go_fast: true,
        };

  // Retry em 429 (rate limit) esperando o retry_after que o Replicate manda
  let output: string | string[] | { url(): string } | { url(): string }[] | undefined;
  let attempt = 0;
  const MAX_RETRIES = 30;
  while (attempt < MAX_RETRIES) {
    try {
      output = (await client().run(modelRef, { input: fluxInput })) as typeof output;
      break;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const retryMatch = msg.match(/retry_after"?\s*:\s*(\d+)/);
      if (msg.includes("429") || msg.includes("Too Many Requests")) {
        const wait = retryMatch ? parseInt(retryMatch[1]!, 10) + 1 : 12;
        await new Promise((r) => setTimeout(r, wait * 1000));
        attempt++;
        continue;
      }
      throw e;
    }
  }
  if (!output) throw new Error("Replicate falhou após retries de rate limit");

  // Replicate output pode ser array ou single, e pode ser URL ou objeto com .url()
  let imageUrl: string;
  const first = Array.isArray(output) ? output[0] : output;
  if (typeof first === "string") {
    imageUrl = first;
  } else if (first && typeof (first as { url(): string }).url === "function") {
    imageUrl = (first as { url(): string }).url();
  } else {
    throw new Error(`Formato inesperado de output Replicate: ${JSON.stringify(output).slice(0, 100)}`);
  }

  // Baixa, normaliza dimensões com sharp e sobe pro R2
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Falha ao baixar imagem Flux: ${res.status}`);
  const raw = Buffer.from(await res.arrayBuffer());

  const buffer = await sharp(raw)
    .resize(dim.width, dim.height, { fit: "cover", position: "center" })
    .jpeg({ quality: 88, progressive: true, mozjpeg: true })
    .toBuffer();

  const key = `${input.keyBase}-${input.formato}-${dim.width}x${dim.height}.jpg`;
  const uploaded = await uploadBuffer({
    key,
    buffer,
    contentType: "image/jpeg",
  });

  return {
    url: uploaded.url,
    width: dim.width,
    height: dim.height,
    modelo: `flux-${input.model}`,
    custoBRL: PRECO_BRL[input.model],
    promptUsado: input.prompt,
    alt: input.alt,
  };
}
