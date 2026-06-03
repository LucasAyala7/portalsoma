import { config } from "dotenv";
config({ path: "./.env" });
import { PrismaClient } from "@prisma/client";

async function main() {
  const p = new PrismaClient();
  const post = await p.post.findFirst({ orderBy: { criadoEm: "desc" }, include: { categoria: true, autor: true } });
  if (!post) { console.log("nenhum"); return; }
  console.log("TITULO:", post.titulo);
  console.log("METATITLE:", post.metaTitle, "(" + (post.metaTitle?.length ?? 0) + ")");
  console.log("METADESC:", post.metaDescription, "(" + (post.metaDescription?.length ?? 0) + ")");
  console.log("RESUMO:", post.resumo);
  console.log("WC:", post.wordCount, "TEMPO:", post.tempoLeitura, "min");
  console.log("AUTOR:", post.autor.nome);
  console.log("---");
  console.log(post.conteudo.slice(0, 2500));
  console.log("...");
  console.log(post.conteudo.slice(-800));
  await p.$disconnect();
}
main();
