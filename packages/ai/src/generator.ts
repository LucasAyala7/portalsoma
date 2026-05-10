/**
 * Gerador v2 — adiciona metaTitle/metaDescription/h1 separados + uniqueness DB-wide.
 */

import { z } from "zod";
import { getClient, MODEL, MAX_TOKENS } from "./client";
import { buildSystemPrompt, buildUserPrompt, type BuildPromptInput, type TipoMensagem } from "./prompts";
import { checkQuality, type QualityResult } from "./quality-gate";
import { createHash } from "node:crypto";

// Schema permissivo: parser não falha por SEO fora do range — quality-gate é a fonte da verdade.
// Só falha se realmente faltar campo ou for absurdamente vazio/longo.
const MensagemPayloadSchema = z.object({
  titulo: z.string().min(15).max(150),
  metaTitle: z.string().min(20).max(80),
  metaDescription: z.string().min(80).max(180),
  conteudo: z.string().min(40),
  resumo: z.string().min(10).max(160),
});

export type MensagemPayload = z.infer<typeof MensagemPayloadSchema>;

export interface GenerateInput extends BuildPromptInput {
  similares?: string[];
  retryOnFail?: boolean;
}

export interface GenerateOutput {
  payload: MensagemPayload;
  qualidade: QualityResult;
  custo: { inputTokens: number; outputTokens: number; cacheReadTokens: number; estimadoBRL: number };
  duracaoMs: number;
  tentativas: number;
  modelo: string;
  hashes: { titulo: string; metaTitle: string; conteudo: string };
  wordCount: number;
}

// Preços Claude Sonnet 4.6 em USD por 1M tokens (atualizado jan/2026)
const PRICE_INPUT_USD = 3.0;
const PRICE_CACHE_READ_USD = 0.3;
const PRICE_OUTPUT_USD = 15.0;
const USD_TO_BRL = 5.5;

function estimarCustoBRL(input: number, output: number, cacheRead: number): number {
  const usd =
    (input / 1_000_000) * PRICE_INPUT_USD +
    (cacheRead / 1_000_000) * PRICE_CACHE_READ_USD +
    (output / 1_000_000) * PRICE_OUTPUT_USD;
  return usd * USD_TO_BRL;
}

function normalizeForHash(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 16);
}

export async function generateMensagem(input: GenerateInput): Promise<GenerateOutput> {
  const t0 = Date.now();
  const client = getClient();
  const systemPrompt = buildSystemPrompt(input.vozPrompt);
  const userPrompt = buildUserPrompt(input);

  let tentativas = 0;
  let payload: MensagemPayload | null = null;
  let qualidade: QualityResult | null = null;
  let acumInput = 0;
  let acumOutput = 0;
  let acumCacheRead = 0;

  const MAX_TENTATIVAS = input.retryOnFail === false ? 1 : 3;
  while (tentativas < MAX_TENTATIVAS) {
    tentativas++;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: tentativas === 1
            ? userPrompt
            : `${userPrompt}\n\nSua geração anterior foi rejeitada pelos seguintes motivos:\n${qualidade?.issues.map((i) => `- ${i.detalhe}`).join("\n")}\n\nGere uma versão completamente diferente, evitando esses problemas. Atenção especial aos limites de chars do metaTitle (54-60) e metaDescription (124-140).`,
        },
      ],
    });

    acumInput += response.usage.input_tokens;
    acumOutput += response.usage.output_tokens;
    acumCacheRead += response.usage.cache_read_input_tokens ?? 0;

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Claude não retornou bloco de texto");
    }

    const raw = textBlock.text.trim();
    const json = extractJson(raw);
    const parsed = MensagemPayloadSchema.safeParse(json);
    if (!parsed.success) {
      if (tentativas === 1) continue;
      throw new Error(`JSON inválido após ${tentativas} tentativas: ${parsed.error.message}`);
    }

    payload = parsed.data;
    qualidade = checkQuality({
      titulo: payload.titulo,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      conteudo: payload.conteudo,
      tipo: input.tipo ?? mapComprimento(input.comprimentoTipo),
      similares: input.similares,
    });

    // Hard fail-fast: metaTitle/metaDesc estourando o LIMITE (peso 0.5) ou bem abaixo do mínimo (peso 0.4).
    // Issue com peso 0.1 (50-53 chars metaTitle) é tolerado.
    const seoHardFail = qualidade.issues.some(
      (i) =>
        (i.tipo === "length_metatitle" || i.tipo === "length_metadescription") &&
        i.peso >= 0.4,
    );

    if (qualidade.status === "PASS") break;
    if (qualidade.status === "REVIEW" && !seoHardFail) break;
    // Continue: status FAIL ou (REVIEW + SEO bem fora)
  }

  if (!payload || !qualidade) throw new Error("Falha na geração");

  const wordCount = payload.conteudo.trim().split(/\s+/).filter(Boolean).length;

  return {
    payload,
    qualidade,
    custo: {
      inputTokens: acumInput,
      outputTokens: acumOutput,
      cacheReadTokens: acumCacheRead,
      estimadoBRL: estimarCustoBRL(acumInput, acumOutput, acumCacheRead),
    },
    duracaoMs: Date.now() - t0,
    tentativas,
    modelo: MODEL,
    hashes: {
      titulo: sha256(normalizeForHash(payload.titulo)),
      metaTitle: sha256(normalizeForHash(payload.metaTitle)),
      conteudo: sha256(normalizeForHash(payload.conteudo)),
    },
    wordCount,
  };
}

function mapComprimento(c?: "curta" | "media" | "longa"): TipoMensagem {
  if (c === "curta") return "CURTA";
  if (c === "longa") return "LONGA";
  return "MEDIA";
}

function extractJson(raw: string): unknown {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error(`Sem JSON detectável: ${s.slice(0, 100)}`);
  const slice = s.slice(first, last + 1);
  try {
    return JSON.parse(slice);
  } catch {
    try {
      // Fallback 1: escapa quebras de linha + tabs crus dentro de strings.
      return JSON.parse(sanitizeStrings(slice, false));
    } catch {
      // Fallback 2: também tenta escapar aspas internas (heurística — pode ferir bordas de strings).
      return JSON.parse(sanitizeStrings(slice, true));
    }
  }
}

/**
 * State machine que escapa caracteres crus dentro de strings JSON.
 * Detecta string boundaries por aspas duplas não-escapadas. Quando dentro:
 *  - \n / \r → \\n
 *  - \t → \\t
 *  - se escapeInnerQuotes: aspa dupla crua que NÃO termina string (próximo char não é , : } ] ou whitespace) → \"
 */
function sanitizeStrings(slice: string, escapeInnerQuotes: boolean): string {
  let inStr = false;
  let escape = false;
  let out = "";
  for (let i = 0; i < slice.length; i++) {
    const ch = slice[i]!;
    if (escape) {
      out += ch;
      escape = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      escape = true;
      continue;
    }
    if (ch === '"') {
      if (inStr && escapeInnerQuotes) {
        // Olha próximo char não-whitespace pra decidir se é fim de string ou aspa interna
        let j = i + 1;
        while (j < slice.length && /\s/.test(slice[j]!)) j++;
        const nxt = slice[j];
        if (nxt && !(nxt === "," || nxt === ":" || nxt === "}" || nxt === "]")) {
          out += '\\"';
          continue;
        }
      }
      inStr = !inStr;
      out += ch;
      continue;
    }
    if (inStr) {
      if (ch === "\n" || ch === "\r") { out += "\\n"; continue; }
      if (ch === "\t") { out += "\\t"; continue; }
    }
    out += ch;
  }
  return out;
}
