// scripts/upload-blog-covers.ts
// Uploads the matched blog cover images (images/Blogs/*) to R2 and rewrites the
// coverImage URLs in prisma/blog-posts.json. Run:
//   dotenv -e .env.local -- tsx scripts/upload-blog-covers.ts
import { readFileSync, writeFileSync } from "node:fs";
import { readFile as readFileAsync } from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const r2 = new S3Client({
  region: "auto",
  endpoint:
    process.env.R2_ENDPOINT ??
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined),
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});
const PUBLIC_BASE = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

// Verified post-slug → local image file mapping (each image inspected by eye).
const MAP: Record<string, string> = {
  "best-inflatable-water-slides-to-buy-2026": "Kids_sliding_on_water_slide_202606290448.jpeg",
  "commercial-water-slide-buying-guide": "Commercial_water_slide_at_festival_202606290451.jpeg",
  "residential-vs-commercial-water-slide": "Inflatable_slides_backyard_park_202606290455.jpeg",
  "clean-dry-store-inflatable-water-slide": "Adult_rinsing_water_slide_202606290458.jpeg",
  "water-slide-rentals-churches-schools-hoas": "Inflatable_water_slide_church_fair_202606290501.jpeg",
  "water-slide-season-state-by-state": "Inflatable_water_slide_blue_sky_202606290520.jpeg",
};

async function upload(slug: string, file: string): Promise<string> {
  const body = await readFileAsync(path.join(process.cwd(), "images", "Blogs", file));
  const rand = Math.random().toString(36).slice(2, 8);
  const key = `blog/${Date.now()}-${rand}-${slug}.jpg`;
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME ?? "",
      Key: key,
      Body: body,
      ContentType: "image/jpeg",
    }),
  );
  return `${PUBLIC_BASE}/${key}`;
}

async function main() {
  const POSTS = "prisma/blog-posts.json";
  const posts = JSON.parse(readFileSync(POSTS, "utf8")) as { slug: string; coverImage: string }[];
  for (const [slug, file] of Object.entries(MAP)) {
    const url = await upload(slug, file);
    const post = posts.find((p) => p.slug === slug);
    if (!post) {
      console.warn(`! No post found for ${slug}`);
      continue;
    }
    post.coverImage = url;
    console.log(`✓ ${slug}\n    ${url}`);
  }
  writeFileSync(POSTS, JSON.stringify(posts, null, 2) + "\n");
  console.log(`\nUpdated ${POSTS}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
