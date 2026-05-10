/**
 * Gera 6 PNGs demonstrativos cobrindo:
 *  - 3 paletas em CENTRO (rose, violet, amber) — direção principal
 *  - 1 FULL (longa) com bg + scrim
 *  - 1 CARD elegante
 *  - 1 MINIMAL (curtinha sem bg)
 *
 * Salva em apps/web/public/m/demo-{slug}.png
 */

import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { composeMessageImage, type ComposeTemplate, type ComposePaleta } from "@nivertotal/images";

interface Demo {
  slug: string;
  template: ComposeTemplate;
  paleta: ComposePaleta;
  texto: string;
  autor: string;
  bgUrl?: string;
}

const DEMOS: Demo[] = [
  // 1. CENTRO rose — amiga (direção principal — Lucas aprovou)
  {
    slug: "demo-centro-rose-amiga",
    template: "centro",
    paleta: "rose",
    bgUrl: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=1200&h=800&fit=crop&q=80",
    texto: "Você é o tipo de amiga que entende quando eu rio alto demais e quando eu sumo demais.",
    autor: "Júlia Marques",
  },
  // 2. CENTRO violet — evangélica
  {
    slug: "demo-centro-violet-evangelica",
    template: "centro",
    paleta: "violet",
    bgUrl: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&h=800&fit=crop&q=80",
    texto: "Provérbios 31 fala daquela mulher cujo valor excede o de finas joias. Essa mulher é você, mãe.",
    autor: "Pastor Antônio",
  },
  // 3. CENTRO amber — 15 anos (curta-média)
  {
    slug: "demo-centro-amber-15anos",
    template: "centro",
    paleta: "amber",
    bgUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&h=800&fit=crop&q=80",
    texto: "Quinze anos é o momento em que você começa a se descobrir de verdade. Tem tempo. Seja livre.",
    autor: "Júlia Marques",
  },
  // 4. FULL — mensagem longa com scrim pesado (a longa do Lucas que ficou cortada)
  {
    slug: "demo-full-longa-15anos",
    template: "full",
    paleta: "amber",
    bgUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&h=800&fit=crop&q=80",
    texto: "Quinze anos é a primeira pista de decolagem da sua vida. Você ainda não decolou completamente, e tudo bem. Está aprendendo a sentir o motor, a entender o vento, a confiar nos próprios instrumentos. Coragem pra fazer testes, paciência com seus erros.",
    autor: "Rafael Andrade",
  },
  // 5. CARD elegante — mãe poética
  {
    slug: "demo-card-rose-mae",
    template: "card",
    paleta: "rose",
    bgUrl: "https://images.unsplash.com/photo-1454944338482-a69bb95894af?w=1200&h=800&fit=crop&q=80",
    texto: "Mãe, hoje eu olho pras minhas mãos e vejo as suas. Foi com elas que aprendi a abraçar.",
    autor: "Júlia Marques",
  },
  // 6. MINIMAL — bem curtinha, fração pequena (Lucas: usar pouco)
  {
    slug: "demo-minimal-warm-curta",
    template: "minimal",
    paleta: "warm",
    texto: "Hoje é o dia de quem ilumina os meus dias.",
    autor: "Júlia Marques",
  },
];

async function main() {
  const outDir = resolve(__dirname, "..", "apps", "web", "public", "m");
  await mkdir(outDir, { recursive: true });

  console.log(`📸 Gerando ${DEMOS.length} demos em ${outDir}\n`);

  for (const demo of DEMOS) {
    const t0 = Date.now();
    const result = await composeMessageImage({
      texto: demo.texto,
      autorNome: demo.autor,
      template: demo.template,
      paleta: demo.paleta,
      formato: "hero",
      bgUrl: demo.bgUrl,
    });
    const path = resolve(outDir, `${demo.slug}.png`);
    await writeFile(path, result.buffer);
    console.log(
      `  ✓ ${demo.slug.padEnd(34)} ${result.template.padEnd(8)} ${result.fontSize}px (${Date.now() - t0}ms)`,
    );
  }

  console.log("\n✅ Demos geradas. Acesse via /m/{slug}.png\n");
}

main().catch((e) => {
  console.error("❌ Falhou:", e);
  process.exit(1);
});
