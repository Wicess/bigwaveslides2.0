/*
 * trim-blog-meta.ts
 *
 * Trims blog metaDescriptions that run past what Google renders (~160 chars).
 *
 * 30 posts were over, some by a lot, so the snippet was being cut mid-sentence
 * — usually right before the call to action, which is the part worth showing.
 * Bing §13 asks for well-formed descriptions; neither engine penalises a long
 * one, but a truncated one wastes the only copy you control in the result.
 *
 * Cuts at a real sentence boundary and never mid-word. Leaves anything already
 * within budget untouched, so this is safe to re-run.
 *
 * Run: npm run db:trim-blog-meta [-- --dry]
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const DRY = process.argv.includes("--dry");
const MAX = 158;

const text = (v: unknown): string =>
  typeof v === "string" ? v : ((v as { en?: string })?.en ?? "");

/** Keep whole sentences while they fit; fall back to a clause, then a word. */
function trim(s: string, max: number): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;

  const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
  let out = "";
  for (const sentence of sentences) {
    if ((out + sentence).trim().length > max) break;
    out += sentence;
  }
  out = out.trim();
  if (out.length >= 70) return out;

  // One very long sentence: cut at a clause, then a word, and close cleanly.
  const head = clean.slice(0, max);
  const cut = Math.max(head.lastIndexOf(" — "), head.lastIndexOf(", "));
  const base =
    cut > 70 ? head.slice(0, cut) : head.slice(0, head.lastIndexOf(" "));
  return base.replace(/[,;:—-]$/, "").trim() + ".";
}

async function main() {
  const posts = await prisma.blogPost.findMany({
    select: { id: true, slug: true, metaDescription: true },
    orderBy: { slug: "asc" },
  });

  let changed = 0;
  for (const post of posts) {
    const before = text(post.metaDescription);
    if (!before || before.length <= MAX) continue;
    const after = trim(before, MAX);
    if (after === before) continue;
    changed++;
    console.log(
      `${DRY ? "[dry] " : ""}${post.slug}  ${before.length} -> ${after.length}`,
    );
    console.log(`   ${after}`);
    if (!DRY) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { metaDescription: { en: after } },
      });
    }
  }
  console.log(
    `\n${DRY ? "[dry] would trim" : "trimmed"} ${changed} of ${posts.length} posts.`,
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
