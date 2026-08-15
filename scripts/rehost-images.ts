/*
 * rehost-images.ts — repoint stored asset URLs at a different host.
 *
 *   npm run media:rehost -- --from <old-host> --to <new-host>          # dry run
 *   npm run media:rehost -- --from <old-host> --to <new-host> --apply  # write
 *
 *   e.g. npm run media:rehost -- \
 *          --from pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev \
 *          --to   media.splashrep.com --apply
 *
 * Why this exists: uploads are stored as ABSOLUTE URLs, so the R2 host is baked
 * into every row. Changing R2_PUBLIC_URL only affects NEW uploads — existing
 * content keeps pointing at the old host until it is rewritten here.
 *
 * Dry run by default: it prints what would change and writes nothing. Only
 * --apply mutates. Idempotent — running it twice is a no-op the second time.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/** Every model.field that can hold an asset URL, per prisma/schema.prisma. */
const TARGETS: { model: string; field: string; json?: boolean }[] = [
  { model: "productCategory", field: "image" },
  { model: "productMedia", field: "url" },
  { model: "productVariation", field: "image" },
  { model: "order", field: "paymentQrUrl" },
  { model: "order", field: "proofImageUrl" },
  { model: "paymentMethodConfig", field: "qrImageUrl" },
  { model: "rentalContract", field: "pdfUrl" },
  { model: "event", field: "coverImage" },
  { model: "event", field: "galleryMedia", json: true },
  { model: "author", field: "avatar" },
  { model: "blogPost", field: "coverImage" },
  { model: "blogPost", field: "ogImage" },
  { model: "blogPost", field: "content", json: true },
  { model: "testimonial", field: "avatar" },
  { model: "testimonial", field: "videoUrl" },
  { model: "service", field: "heroImage" },
  { model: "service", field: "gallery", json: true },
  { model: "mediaAsset", field: "url" },
];

/** Minimal shape we need off a Prisma model delegate, without pulling in 12 generated types. */
type Row = { id: string } & Record<string, unknown>;
type Delegate = {
  findMany: (args: { select: Record<string, boolean> }) => Promise<Row[]>;
  update: (args: {
    where: { id: string };
    data: Record<string, unknown>;
  }) => Promise<unknown>;
};

function parseArgs() {
  const a = process.argv.slice(2);
  const get = (flag: string) => {
    const i = a.indexOf(flag);
    return i >= 0 ? a[i + 1] : undefined;
  };
  return { from: get("--from"), to: get("--to"), apply: a.includes("--apply") };
}

async function main() {
  const { from, to, apply } = parseArgs();
  if (!from || !to) {
    console.error(
      "Usage: npm run media:rehost -- --from <old-host> --to <new-host> [--apply]",
    );
    process.exitCode = 1;
    return;
  }
  if (from === to) {
    console.error("--from and --to are identical; nothing to do.");
    process.exitCode = 1;
    return;
  }

  console.log(
    `${apply ? "APPLYING" : "DRY RUN"} — rewriting "${from}" -> "${to}"\n`,
  );

  let totalRows = 0;
  for (const { model, field, json } of TARGETS) {
    const delegate = (
      prisma as unknown as Record<string, Delegate | undefined>
    )[model];
    if (!delegate?.findMany) {
      console.log(`  ${model}.${field}: SKIPPED (no such model)`);
      continue;
    }

    let rows: Row[];
    try {
      rows = await delegate.findMany({ select: { id: true, [field]: true } });
    } catch (e) {
      console.log(`  ${model}.${field}: SKIPPED (${String(e).slice(0, 80)})`);
      continue;
    }

    const hits = rows.filter((r) => {
      const v = r[field];
      if (v == null) return false;
      return (json ? JSON.stringify(v) : String(v)).includes(from);
    });
    if (hits.length === 0) continue;

    totalRows += hits.length;
    console.log(`  ${model}.${field}: ${hits.length} row(s)`);

    if (!apply) continue;
    for (const row of hits) {
      const current = row[field];
      const next = json
        ? JSON.parse(JSON.stringify(current).split(from).join(to))
        : String(current).split(from).join(to);
      await delegate.update({ where: { id: row.id }, data: { [field]: next } });
    }
  }

  console.log(
    `\n${totalRows} row(s) ${apply ? "rewritten" : "would change"}.` +
      (apply || totalRows === 0 ? "" : "\nRe-run with --apply to write."),
  );
}

main().finally(() => prisma.$disconnect());
