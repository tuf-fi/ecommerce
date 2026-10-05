import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";

// Usage: npm run create-staff -- <email> <password> <name> [ADMINISTRATOR|STAFF]
async function main() {
  const [email, password, name, role = "ADMINISTRATOR"] = process.argv.slice(2);
  if (!email || !password || !name || (role !== "ADMINISTRATOR" && role !== "STAFF")) {
    throw new Error("Usage: npm run create-staff -- <email> <password> <name> [ADMINISTRATOR|STAFF]");
  }
  const staff = await prisma.staffMember.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash: await bcrypt.hash(password, 12), name, role },
    create: { email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12), name, role },
  });
  console.log(`Staff ${staff.email} (${staff.role}) ready, id ${staff.id}`);
}

main().finally(() => prisma.$disconnect());
