/**
 * Linka as 6 imagens demo (geradas em apps/web/public/m/) com mensagens reais.
 */

import { prisma } from "@nivertotal/db";

interface Link {
  mensagemSlug: string;
  url: string;
  alt: string;
  modelo: string;
}

const LINKS: Link[] = [
  {
    mensagemSlug: "amiga-do-meu-melhor-pedaco-feliz-aniversario",
    url: "/m/demo-centro-rose-amiga.png",
    alt: "Mensagem 'Você é o tipo de amiga que entende' por Júlia Marques",
    modelo: "satori-centro+flux",
  },
  {
    mensagemSlug: "mae-evangelica-mulher-virtuosa-provérbios",
    url: "/m/demo-centro-violet-evangelica.png",
    alt: "Mensagem 'Provérbios 31' por Pastor Antônio",
    modelo: "satori-centro+flux",
  },
  {
    mensagemSlug: "15-anos-momento-onde-tudo-comeca",
    url: "/m/demo-centro-amber-15anos.png",
    alt: "Mensagem '15 anos é o momento em que você começa' por Júlia Marques",
    modelo: "satori-centro+flux",
  },
  {
    mensagemSlug: "15-anos-coach-rafael-decolagem-vida",
    url: "/m/demo-full-longa-15anos.png",
    alt: "Mensagem '15 anos é a primeira pista de decolagem' por Rafael Andrade",
    modelo: "satori-full+flux",
  },
  {
    mensagemSlug: "mae-suas-maos-ensinaram-quase-tudo",
    url: "/m/demo-card-rose-mae.png",
    alt: "Mensagem 'Mãe, hoje eu olho pras minhas mãos' por Júlia Marques",
    modelo: "satori-card+flux",
  },
  {
    mensagemSlug: "whatsapp-quem-iluminou-meu-dia",
    url: "/m/demo-minimal-warm-curta.png",
    alt: "Mensagem 'Hoje é o dia de quem ilumina os meus dias' por Júlia Marques",
    modelo: "satori-minimal",
  },
];

async function main() {
  for (const link of LINKS) {
    const mensagem = await prisma.mensagem.findUnique({ where: { slug: link.mensagemSlug } });
    if (!mensagem) {
      console.warn(`  ⚠ mensagem "${link.mensagemSlug}" não encontrada, pulando`);
      continue;
    }

    if (mensagem.imagemHeroId) {
      await prisma.image.delete({ where: { id: mensagem.imagemHeroId } }).catch(() => {});
    }

    const novaImg = await prisma.image.create({
      data: {
        url: link.url,
        formato: "hero",
        width: 1200,
        height: 800,
        alt: link.alt,
        modelo: link.modelo,
        custo: 0,
      },
    });

    await prisma.mensagem.update({
      where: { id: mensagem.id },
      data: { imagemHeroId: novaImg.id },
    });

    console.log(`  ✓ ${link.mensagemSlug.padEnd(50)} → ${link.url}`);
  }

  await prisma.$disconnect();
  console.log("\n✅ Links atualizados\n");
}

main().catch((e) => {
  console.error("❌ Falhou:", e);
  process.exit(1);
});
