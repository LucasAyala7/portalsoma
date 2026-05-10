/**
 * Builders dos prompts entregues ao Claude — v2 com SEO + humanização.
 *
 * Estratégia de prompt caching (90% economia):
 *   - System prompt = base do nicho (FIXO) + voz da persona (FIXO por persona)
 *     → ambos com cache_control ephemeral.
 *   - User prompt = task específico (variável: cluster, complemento, restrições, tipo)
 *     → não cacheado.
 */

export type TipoMensagem = "CURTA" | "MEDIA" | "LONGA" | "POEMA";

export interface BuildPromptInput {
  vozPrompt: string;
  cluster: { nome: string; headKeyword: string; tipo: string };
  complemento?: { nome: string; headKeyword: string } | null;
  evitarFrases?: string[];
  exemplosRecentes?: string[];
  /** comprimento legado, mantido pra compat */
  comprimentoTipo?: "curta" | "media" | "longa";
  /** novo: tipo (com POEMA explícito) */
  tipo?: TipoMensagem;
  /** títulos/h1 já existentes no DB pra evitar repetição (cross-cluster) */
  titulosEvitar?: string[];
}

export const BASE_NIVERTOTAL_SYSTEM = `Você escreve mensagens de aniversário em português brasileiro pro Portal Soma — um site de mensagens pra emocionar quem importa.

# PRINCÍPIOS

## Humanização (ESSENCIAL)
1. Escreva em PRIMEIRA PESSOA — quem fala é alguém real (filho, amigo, mãe) dirigindo a palavra direta a quem aniversaria. Use "eu", "você", "te", "minha", "meu".
2. A mensagem é uma DEDICATÓRIA: tem remetente e destinatário implícitos.
3. Soa como bilhete escrito à mão, não como definição de dicionário.

## Anti-clichê (CRÍTICO)
NUNCA comece com:
- "Hoje celebro a sua vida"
- "Neste dia tão especial"
- "Mais um ano de vida"
- "Parabéns, querid___"
- "Feliz aniversário, querid___"
- "Que neste dia/em mais este dia"

NUNCA termine com fórmulas batidas:
- "Que Deus te abençoe" como fechamento mecânico (só use se a persona é religiosa E faz sentido orgânico)
- "Felicidades sempre"
- "Te amo muito muito"

Cada abertura deve ser ÚNICA: pode começar com uma cena, uma reflexão, uma pergunta, uma observação, um detalhe sensorial, uma quebra de expectativa.

## SEO (sem forçar)
- Inclua a keyword principal no título OU no h1 OU na primeira frase, naturalmente
- NÃO repita a keyword 3+ vezes (parece spam)
- Variações semânticas são bem-vindas: "para mãe" / "à minha mãe" / "pra minha mãezinha"

## Formato
- Sem emojis em excesso (máximo 1, e só se a persona usa)
- Sem hashtags
- Sem placeholders tipo "[NOME]" ou "[idade]" — escreva como se fosse pra UMA pessoa específica
- Português do Brasil natural

# OUTPUT JSON

Responda SEMPRE em JSON válido com este formato exato:

\`\`\`
{
  "titulo": "h1 da mensagem — até 90 chars, pode ser frase emocional",
  "metaTitle": "title SEO — 54 a 60 chars EXATOS, com keyword principal",
  "metaDescription": "meta description SEO — 124 a 140 chars EXATOS, conviva, com keyword secundária",
  "conteudo": "a mensagem completa em primeira pessoa. Use \\n pra quebrar linha (POEMA exige; outros tipos pode ser \\n\\n entre parágrafos).",
  "resumo": "frase curta de até 100 chars pra usar como quote/preview"
}
\`\`\`

REGRAS DE JSON (CRÍTICO — JSON inválido = retrabalho):
- Quebras de linha em "conteudo" SEMPRE como \\n (literal: barra invertida + n). NUNCA quebra crua.
- Aspas dentro de valores: usa "" simples ("aspas brasileiras") ou apóstrofo (', '), NUNCA " escapada como \\".
- Sem trailing commas. Sem comentários // ou /* */.

CRITÉRIOS DE TAMANHO (cumprir cuidadosamente — CONTE OS CHARS antes de fechar o JSON):
- titulo: 30-90 chars (h1 visual, pode ser emocional, não precisa de keyword se ficar canhestro)
- metaTitle: TARGET 56-58 chars (range tolerável 54-60). Sempre com keyword + diferencial.
  ❌ ERRADO (52 chars): "Mensagem de aniversário para amiga: poema real"
  ✅ CERTO (58 chars): "Mensagem de Aniversário para Amiga: Poema com Verdade"
  Se sair com 53 ou menos, EXPANDE: adicione adjetivo/diferencial ("emocionante", "que toca", "para emocionar", "única", "do coração", "feita à mão", "com alma", "pra emocionar", "verdadeira").
  Se sair com 61+, corta o diferencial mantendo a keyword.
- metaDescription: TARGET 130-138 chars (range tolerável 124-140).
  Convida ao clique, com keyword (mesma ou variação) e gancho emocional.
  Se sair com 123 ou menos, expande com CTA natural ("Lê e manda", "Toca a alma", "Pra emocionar quem importa", "Vale cada palavra").
  Se sair com 141+, corta uma frase secundária.

ANTES DE FECHAR O JSON: conte os chars de metaTitle e metaDescription. Se estiver fora dos ranges, RESCREVE até bater.

Sem texto fora do JSON. Sem markdown nas respostas. Sem comentários.`;

export function buildSystemPrompt(vozPrompt: string): string {
  return `${BASE_NIVERTOTAL_SYSTEM}\n\n=== VOZ DA PERSONA ===\n\n${vozPrompt}`;
}

const TIPO_GUIA: Record<TipoMensagem, string> = {
  CURTA: `MENSAGEM CURTA (60-90 palavras)
- Direta, marcante, dispara emoção rápida
- Boa pra WhatsApp/status
- 1-2 parágrafos curtos
- Cada palavra carrega peso`,

  MEDIA: `MENSAGEM MÉDIA (100-160 palavras)
- Espaço pra construir cena ou ideia central
- 2-4 parágrafos
- Tem início, miolo e fechamento
- A maioria das nossas mensagens é assim`,

  LONGA: `MENSAGEM LONGA (180-280 palavras)
- Dá pra desenvolver várias camadas
- 3-5 parágrafos
- Cabe metáfora estendida, narrativa pequena
- Pra dedicatórias mais cerimoniosas (mãe, pai, padrinho, casamento)`,

  POEMA: `POEMA (60-180 palavras em formato poético)
- Versos quebrados (não parágrafo corrido)
- Ritmo, repetição estratégica, imagens
- Pode rimar ou não — se rimar, deve fluir natural
- Linha em branco entre estrofes
- ATENÇÃO: estilo livre, NÃO precisa rimar bobamente. Pode ser poesia contemporânea, prosa poética.
- Usa metáfora central, sensorial, imagem viva`,
};

export function buildUserPrompt(input: BuildPromptInput): string {
  const partes: string[] = [];

  // Resolve tipo (compat com comprimentoTipo legado)
  const tipo: TipoMensagem =
    input.tipo ??
    (input.comprimentoTipo === "curta" ? "CURTA" :
     input.comprimentoTipo === "longa" ? "LONGA" :
     "MEDIA");

  partes.push(`Escreva uma mensagem de aniversário com a voz acima.`);
  partes.push(``);
  partes.push(`CONTEXTO:`);
  partes.push(`- Cluster (destinatário/categoria): ${input.cluster.nome}`);
  partes.push(`- Keyword principal SEO: "${input.cluster.headKeyword}"`);

  if (input.complemento) {
    partes.push(`- Refinamento: ${input.complemento.nome}`);
    partes.push(`- Keyword refinada: "${input.complemento.headKeyword}"`);
  }

  partes.push(``);
  partes.push(`TIPO: ${tipo}`);
  partes.push(TIPO_GUIA[tipo]);

  if (input.titulosEvitar && input.titulosEvitar.length > 0) {
    partes.push(``);
    partes.push(`TÍTULOS JÁ EXISTEM NO SITE (NÃO repetir, NÃO fazer variação óbvia):`);
    for (const t of input.titulosEvitar.slice(0, 10)) {
      partes.push(`- "${t}"`);
    }
  }

  if (input.evitarFrases && input.evitarFrases.length > 0) {
    partes.push(``);
    partes.push(`EVITE estas aberturas/fórmulas:`);
    for (const f of input.evitarFrases) partes.push(`- "${f}"`);
  }

  if (input.exemplosRecentes && input.exemplosRecentes.length > 0) {
    partes.push(``);
    partes.push(`Mensagens RECENTES neste cluster — sua nova mensagem deve ter ESTRUTURA, ABERTURA e FECHAMENTO claramente diferentes:`);
    for (const ex of input.exemplosRecentes.slice(0, 3)) {
      partes.push(`---`);
      partes.push(ex.slice(0, 250));
    }
    partes.push(`---`);
  }

  partes.push(``);
  partes.push(`LEMBRA: 1ª pessoa (eu pra alguém), título único no site, metaTitle 54-60 chars com keyword, metaDescription 124-140 chars convidativa. Responda APENAS o JSON.`);

  return partes.join("\n");
}
