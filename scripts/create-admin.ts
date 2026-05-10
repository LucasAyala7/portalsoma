/**
 * Cria/atualiza usuário admin com senha bcrypt.
 * Uso: npx tsx scripts/create-admin.ts <username> <password>
 */

import bcrypt from "bcryptjs";
import { prisma } from "@nivertotal/db";

async function main() {
  const [, , username, password] = process.argv;
  if (!username || !password) {
    console.error("Uso: npx tsx scripts/create-admin.ts <username> <password>");
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.upsert({
    where: { username },
    create: { username, passwordHash: hash, role: "admin", ativo: true },
    update: { passwordHash: hash, ativo: true },
  });
  console.log(`✓ admin criado/atualizado: ${user.username} (id ${user.id})`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
