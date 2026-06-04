import { config } from "dotenv";
config({ path: "./.env" });
import { PrismaClient } from "@prisma/client";

async function main() {
  const p = new PrismaClient();
  const e = await p.clusterEditorial.findFirst({
    include: { cluster: { select: { nome: true, slug: true } } },
  });
  if (!e) {
    console.log("nenhum editorial");
    return;
  }
  console.log("CLUSTER:", e.cluster.nome, "(", e.cluster.slug, ")");
  console.log("---INTRO HERO---");
  console.log(e.introHero);
  console.log("\n---RESUMO EDITORIAL---");
  console.log(e.resumoEditorial);
  console.log("\n---FECHAMENTO---");
  console.log(e.fechamento);
  console.log("\n---FAQ TEXTO---");
  console.log(e.faqTexto);
  await p.$disconnect();
}
main();
