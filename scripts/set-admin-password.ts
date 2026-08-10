/*
 * set-admin-password.ts — rotate an admin user's password.
 *
 *   npm run admin:set-password -- <email> "<new password (min 10 chars)>"
 *   e.g. npm run admin:set-password -- admin@bigwavesslides.com "S0me-Str0ng-Pass!"
 *
 * Use this to replace the seeded default password. Tip: clear your shell history
 * afterwards (the password is passed as an argument).
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
import bcrypt from "bcryptjs";

const { PrismaClient } = pkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const [emailArg, passwordArg] = process.argv.slice(2);
const email = (emailArg ?? "").toLowerCase().trim();
const password = passwordArg ?? "";

async function main() {
  if (!email || !password) {
    console.error(
      'Usage: npm run admin:set-password -- <email> "<new password>"',
    );
    process.exitCode = 1;
    return;
  }
  if (password.length < 10) {
    console.error("Password must be at least 10 characters.");
    process.exitCode = 1;
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const updated = await prisma.adminUser
    .update({ where: { email }, data: { passwordHash } })
    .catch(() => null);
  if (!updated) {
    console.error(`No admin user found with email: ${email}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `✓ Password updated for ${email}. The old password no longer works.`,
  );
}

main().finally(() => prisma.$disconnect());
