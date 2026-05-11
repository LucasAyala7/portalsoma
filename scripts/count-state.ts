import { config } from "dotenv";
config({ path: "./.env" });
import { PrismaClient } from "@prisma/client";

async function main() {
  const p = new PrismaClient();
  const total = await p.mensagem.count();
  const pub = await p.mensagem.count({ where: { status: "PUBLISHED" } });
  const comHero = await p.mensagem.count({ where: { status: "PUBLISHED", imagemHeroId: { not: null } } });
  const composed = await p.image.count({ where: { modelo: "hero-composed" } });
  console.log({ total, pub, comHero, semHero: pub - comHero, composed });
  await p.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
