/**
 * Seleciona persona baseada nos pesos por categoria do cluster/complemento.
 * Usa amostragem ponderada: persona com peso maior tem mais chance, mas
 * todas com peso > 0 podem ser escolhidas (variedade evita fingerprint).
 */

import type { Persona } from "@nivertotal/db";

interface ChooseInput {
  personas: Persona[];
  clusterSlug: string;
  clusterTipo?: string;
  complementoSlug?: string;
}

export function choosePersona({
  personas,
  clusterSlug,
  complementoSlug,
}: ChooseInput): Persona {
  const elegiveis = personas.filter((p) => p.ativo);
  if (elegiveis.length === 0) throw new Error("Nenhuma persona ativa");

  const ponderadas = elegiveis.map((p) => {
    const pesos = (p.pesos ?? {}) as Record<string, number>;
    // peso direto pelo cluster ou complemento, com fallback de 0.1 (variedade)
    const candidatos: (number | undefined)[] = [
      complementoSlug ? pesos[complementoSlug] : undefined,
      pesos[clusterSlug],
      pesos["_default"],
    ];
    const w = candidatos.find((x): x is number => typeof x === "number") ?? 0.1;
    return { persona: p, peso: Math.max(0, w) };
  });

  const totalPeso = ponderadas.reduce((acc, x) => acc + x.peso, 0);
  if (totalPeso === 0) {
    // Nenhuma persona tem afinidade → escolhe random uniforme
    return elegiveis[Math.floor(Math.random() * elegiveis.length)]!;
  }

  let r = Math.random() * totalPeso;
  for (const item of ponderadas) {
    r -= item.peso;
    if (r <= 0) return item.persona;
  }
  return ponderadas[ponderadas.length - 1]!.persona;
}

/**
 * Para cluster com voz altamente especializada (ex: tom religioso),
 * filtra apenas personas com peso significativo (> 0.5).
 */
export function chooseStrictPersona(input: ChooseInput): Persona {
  const filtradas = input.personas.filter((p) => {
    const pesos = (p.pesos ?? {}) as Record<string, number>;
    const w = pesos[input.clusterSlug] ?? 0;
    return w >= 0.5;
  });
  if (filtradas.length === 0) return choosePersona(input);
  return choosePersona({ ...input, personas: filtradas });
}
