/*
 * strip-retired-locale.ts
 *
 * Removes the dead `fr` half from localized JSON fields.
 *
 * French was retired, so nothing renders `fr` — but it is still stored, still
 * serialized into the page payload, and still holds PRE-REBRAND text. Product
 * names ship as {"en":"Palmetto Coast 24","fr":"Palm Paradise 24"}, so the old
 * catalog name is in the HTML of every page listing that product. Invisible to
 * a reader, fully visible to a crawler comparing this site to the other one.
 *
 * Run: npm run db:strip-fr [-- --dry]
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const DRY = process.argv.includes("--dry");

/** Drop `fr` wherever a localized object still carries one. */
function strip(v: unknown): { value: unknown; hits: number } {
  if (Array.isArray(v)) {
    let n = 0;
    const out = v.map((x) => {
      const r = strip(x);
      n += r.hits;
      return r.value;
    });
    return { value: out, hits: n };
  }
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    let n = 0;
    const out: Record<string, unknown> = {};
    for (const [k, inner] of Object.entries(o)) {
      if (k === "fr" && "en" in o) {
        n++;
        continue;
      }
      const r = strip(inner);
      out[k] = r.value;
      n += r.hits;
    }
    return { value: out, hits: n };
  }
  return { value: v, hits: 0 };
}

async function sweep<T extends { id: string }>(
  label: string,
  rows: T[],
  fields: (keyof T)[],
  update: (id: string, data: Record<string, unknown>) => Promise<unknown>,
) {
  let changed = 0,
    hits = 0;
  for (const r of rows) {
    const data: Record<string, unknown> = {};
    let n = 0;
    for (const f of fields) {
      const res = strip(r[f]);
      if (res.hits) {
        data[f as string] = res.value;
        n += res.hits;
      }
    }
    if (!n) continue;
    changed++;
    hits += n;
    if (!DRY) await update(r.id, data);
  }
  console.log(`  ${label}: ${changed} rows, ${hits} fr key(s)`);
  return hits;
}

async function main() {
  let total = 0;
  total += await sweep(
    "products",
    await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        shortDescription: true,
        description: true,
      },
    }),
    ["name", "shortDescription", "description"],
    (id, data) => prisma.product.update({ where: { id }, data: data as never }),
  );

  total += await sweep(
    "categories",
    await prisma.productCategory.findMany({
      select: { id: true, name: true, description: true },
    }),
    ["name", "description"],
    (id, data) =>
      prisma.productCategory.update({ where: { id }, data: data as never }),
  );

  total += await sweep(
    "blog posts",
    await prisma.blogPost.findMany({
      select: {
        id: true,
        title: true,
        excerpt: true,
        content: true,
        metaTitle: true,
        metaDescription: true,
      },
    }),
    ["title", "excerpt", "content", "metaTitle", "metaDescription"],
    (id, data) =>
      prisma.blogPost.update({ where: { id }, data: data as never }),
  );

  console.log(`\n${DRY ? "Would strip" : "Stripped"} ${total} dead fr key(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
