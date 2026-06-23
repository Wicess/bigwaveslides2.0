import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  // Prisma 7 driver adapter — runtime connects via the pooled Neon URL.
  // Bounded timeouts so a flaky connection fails fast (and retries quickly)
  // instead of hanging the request/build for minutes.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    // Generous connect timeout for Neon cold-starts; bounded so a truly dead
    // connection still fails (and retries) rather than hanging indefinitely.
    connectionTimeoutMillis: 30000,
    max: 10,
  });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
