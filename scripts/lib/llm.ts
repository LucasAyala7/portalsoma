/**
 * Cliente LLM provider-agnostic para os geradores de conteudo.
 *
 * Detecta o provider pela URL base e adapta formato de request/response.
 * Suporta: OpenAI-compat (DeepSeek, OpenAI, Groq, Together) e Anthropic.
 *
 * Configuracao por env:
 *   LLM_API_KEY   chave do provider
 *   LLM_API_BASE  default https://api.deepseek.com/v1
 *   LLM_MODEL     default deepseek-v4-pro
 *
 * Para trocar pra Claude quando houver saldo:
 *   LLM_API_BASE=https://api.anthropic.com/v1
 *   LLM_MODEL=claude-haiku-4-5-20251001
 *   LLM_API_KEY=sk-ant-...
 */

export interface LlmOptions {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  /** Forca resposta em JSON. Anthropic nao tem flag nativa: injeta instrucao. */
  json?: boolean;
}

export interface LlmResult {
  content: string;
  tokensIn: number;
  tokensOut: number;
}

const API_KEY = process.env.LLM_API_KEY ?? process.env.DEEPSEEK_API_KEY ?? "";
const API_BASE = (process.env.LLM_API_BASE ?? "https://api.deepseek.com/v1").replace(/\/$/, "");
const MODEL = process.env.LLM_MODEL ?? "deepseek-v4-pro";

const isAnthropic = API_BASE.includes("anthropic.com");

export const llmInfo = { model: MODEL, base: API_BASE, provider: isAnthropic ? "anthropic" : "openai-compat" };

/** Acumuladores globais pra report de custo no fim do batch. */
export const llmUsage = { tokensIn: 0, tokensOut: 0, calls: 0 };

function extrairJson(texto: string): string {
  // Modelos as vezes embrulham em cerca markdown mesmo com instrucao contraria
  const cerca = texto.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (cerca) return cerca[1]!.trim();
  // Ou vem com preambulo antes do objeto
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio >= 0 && fim > inicio) return texto.slice(inicio, fim + 1);
  return texto.trim();
}

async function chamarAnthropic(o: LlmOptions): Promise<LlmResult> {
  const system = o.json
    ? `${o.system}\n\nResponda SOMENTE com o objeto JSON pedido. Sem cerca de markdown, sem texto antes ou depois.`
    : o.system;

  const res = await fetch(`${API_BASE}/messages`, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: o.maxTokens ?? 8000,
      temperature: o.temperature ?? 1.0,
      system,
      messages: [{ role: "user", content: o.user }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const d = await res.json();
  const texto = (d.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("");
  const u = d.usage ?? {};
  return {
    content: o.json ? extrairJson(texto) : texto,
    tokensIn: u.input_tokens ?? 0,
    tokensOut: u.output_tokens ?? 0,
  };
}

async function chamarOpenAiCompat(o: LlmOptions): Promise<LlmResult> {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: o.maxTokens ?? 8000,
      temperature: o.temperature ?? 1.0,
      messages: [
        { role: "system", content: o.system },
        { role: "user", content: o.user },
      ],
      ...(o.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`llm ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const d = await res.json();
  const msg = d.choices?.[0]?.message ?? {};
  // Modelos de raciocinio (deepseek-v4-pro) separam reasoning_content de content.
  // Se content veio vazio, o budget de tokens acabou dentro do raciocinio.
  const texto: string = msg.content ?? "";
  const u = d.usage ?? {};
  if (!texto && msg.reasoning_content) {
    throw new Error("budget de tokens consumido no raciocinio; aumente maxTokens");
  }
  return {
    content: o.json ? extrairJson(texto) : texto,
    tokensIn: u.prompt_tokens ?? 0,
    tokensOut: u.completion_tokens ?? 0,
  };
}

export async function llm(o: LlmOptions): Promise<LlmResult> {
  if (!API_KEY) throw new Error("Falta LLM_API_KEY");
  const r = isAnthropic ? await chamarAnthropic(o) : await chamarOpenAiCompat(o);
  llmUsage.tokensIn += r.tokensIn;
  llmUsage.tokensOut += r.tokensOut;
  llmUsage.calls += 1;
  return r;
}

/** Chama o modelo esperando JSON e ja devolve parseado. Null se nao parsear. */
export async function llmJson<T>(o: Omit<LlmOptions, "json">): Promise<T | null> {
  const r = await llm({ ...o, json: true });
  try {
    return JSON.parse(r.content) as T;
  } catch {
    return null;
  }
}
