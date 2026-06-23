import { z } from "zod";

/**
 * Typed, validated environment variables.
 *
 * Infrastructure credentials (Neon, R2, SMTP, NextAuth, WhatsApp, analytics)
 * are `optional()` for now and become required in their respective phases:
 *   - DATABASE_URL / DIRECT_URL ...... Phase 4 (Prisma + Neon)
 *   - R2_* ........................... Phase 5 (Cloudflare R2)
 *   - SMTP_* ......................... Phase 17 (Hostinger email)
 *   - NEXTAUTH_* ..................... Phase 14 (auth)
 *   - WHATSAPP_* ..................... Phase 17
 *   - NEXT_PUBLIC_GA_ID / CLARITY .... Phase 17
 */
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),

  // Database (Phase 4)
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),

  // Cloudflare R2 (Phase 5)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ENDPOINT: z.string().url().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),

  // Auth (Phase 14)
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // Email — Hostinger SMTP (Phase 17)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // WhatsApp Cloud API (Phase 17)
  WHATSAPP_PHONE_NUMBER: z.string().optional(),
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),

  // Embeddings for AI search (Phase 9)
  EMBEDDINGS_API_KEY: z.string().optional(),

  // Analytics (Phase 17)
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_CLARITY_ID: z.string().optional(),

  // Secures cron-triggered jobs (e.g. abandoned-cart sweep)
  CRON_SECRET: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
export type Env = z.infer<typeof EnvSchema>;
