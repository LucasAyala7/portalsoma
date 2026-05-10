/**
 * Sanity check do DB seedado.
 * Uso (de qualquer lugar do monorepo): npx tsx scripts/sanity-check.ts
 */
import { prisma } from "@nivertotal/db";

async function main() {
  const [nicho, totalClusters, totalComplementos, personas, autores, admins] = await Promise.all([
    prisma.nicho.findFirst(),
    prisma.cluster.count(),
    prisma.complemento.count(),
    prisma.persona.findMany({ select: { slug: true, nome: true } }),
    prisma.author.findMany({ where: { real: true }, select: { slug: true, nome: true } }),
    prisma.adminUser.findMany({ select: { username: true, role: true } }),
  ]);

  console.log("\n=== SANITY CHECK ===");
  console.log("Nicho:", nicho?.slug, "—", nicho?.nome);
  console.log(`Volume head: ${nicho?.volumeMensal.toLocaleString()} buscas/mês`);
  console.log(`Clusters: ${totalClusters}`);
  console.log(`Complementos: ${totalComplementos}`);
  console.log(`Personas (${personas.length}): ${personas.map((p) => p.nome).join(", ")}`);
  console.log(`Autores reais: ${autores.map((a) => a.nome).join(", ")}`);
  console.log(`Admins: ${admins.map((a) => a.username + "(" + a.role + ")").join(", ")}`);

  const top5 = await prisma.cluster.findMany({
    orderBy: { volumeMensal: "desc" },
    take: 5,
    include: { _count: { select: { complementos: true } } },
  });
  console.log("\nTop 5 clusters por volume:");
  for (const c of top5) {
    const v = c.volumeMensal.toLocaleString().padStart(8);
    console.log(
      `  /${c.slug}/ ${v} | empilha=${c.permiteEmpilhar} | ${c._count.complementos} complementos`,
    );
  }

  const empilhamentos = await prisma.cluster.count({ where: { permiteEmpilhar: true } });
  console.log(`\nClusters com empilhamento (vol ≥ 1k): ${empilhamentos}`);

  await prisma.$disconnect();
}

main();
