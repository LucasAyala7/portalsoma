/**
 * Diagnostica se eventos estão sendo persistidos.
 */
import { prisma } from "@nivertotal/db";

async function main() {
  console.log("\n=== EVENTOS NO DB ===");
  const totalEventos = await prisma.evento.count();
  console.log(`Total de eventos: ${totalEventos}`);

  const ultimos = await prisma.evento.findMany({
    orderBy: { criadoEm: "desc" },
    take: 10,
  });
  console.log("\nÚltimos 10 eventos:");
  for (const e of ultimos) {
    console.log(
      `  ${e.criadoEm.toISOString()} | ${e.tipo.padEnd(8)} | mensagem=${e.mensagemId?.slice(-8) ?? "—"} | ip=${e.ip ?? "—"}`,
    );
  }

  console.log("\n=== TOP 5 MENSAGENS POR LIKES ===");
  const topLikes = await prisma.mensagem.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { likes: "desc" },
    take: 5,
    select: { slug: true, likes: true, copies: true, shares: true },
  });
  for (const m of topLikes) {
    console.log(`  ${m.slug.padEnd(55)} | ❤ ${m.likes} | 📋 ${m.copies} | 🔗 ${m.shares}`);
  }

  console.log("\n=== EVENTOS POR TIPO (últimas 24h) ===");
  const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const tipos = await prisma.evento.groupBy({
    by: ["tipo"],
    where: { criadoEm: { gte: ontem } },
    _count: true,
  });
  if (tipos.length === 0) {
    console.log("  (nenhum evento nas últimas 24h)");
  } else {
    for (const t of tipos) {
      console.log(`  ${t.tipo.padEnd(10)} ${t._count}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
