import { config } from "dotenv";
config({ path: "./.env" });
import { PrismaClient } from "@prisma/client";

async function main() {
  const p = new PrismaClient();
  const ids = ["cmoulwtj1006wv21s9vdws8ei", "cmoulwtjo0072v21s04lmkbel", "cmoulwtk10074v21sscr2esgz"];
  for (const id of ids) {
    const m = await p.mensagem.findUnique({
      where: { id },
      select: { titulo: true, resumo: true, conteudo: true, tipo: true, origem: true, criadoEm: true },
    });
    console.log("---", id, "---");
    console.log("TITULO:", m?.titulo);
    console.log("RESUMO:", m?.resumo);
    console.log("CONTEUDO:", m?.conteudo?.slice(0, 200));
    console.log("ORIGEM:", m?.origem, "TIPO:", m?.tipo, "CRIADO:", m?.criadoEm);
  }
  await p.$disconnect();
}
main();
