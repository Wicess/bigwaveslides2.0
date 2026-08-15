// scripts/seed-blog.ts
// Blog-only seed: upserts the author, categories, tags, and posts defined in
// prisma/blog-posts.json. Intentionally touches NOTHING else (no products,
// services, testimonials) so curated catalog content is never reset.
// Run: dotenv -e .env.local -- tsx scripts/seed-blog.ts
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// French was retired (English-only site) — the second argument is
// ignored so the hundreds of existing call sites keep compiling while
// no new `fr` half is ever written to the database.
const L = (en: string, _fr?: string) => ({ en });
const daysFromNow = (d: number) =>
  new Date(Date.now() + d * 24 * 60 * 60 * 1000);

const CATEGORY_NAMES: Record<string, { en: string }> = {
  guides: L("Guides", "Guides"),
  planning: L("Planning", "Planification"),
  safety: L("Safety", "Sécurité"),
  events: L("Events", "Événements"),
  pricing: L("Pricing", "Tarifs"),
  buying: L("Buying", "Achat"),
  ownership: L("Ownership", "Entretien"),
};
const TAG_NAMES: Record<string, { en: string }> = {
  pricing: L("Pricing", "Tarifs"),
  rentals: L("Rentals", "Locations"),
  tips: L("Tips", "Conseils"),
  parties: L("Parties", "Fêtes"),
  safety: L("Safety", "Sécurité"),
  events: L("Events", "Événements"),
  corporate: L("Corporate", "Entreprises"),
  guides: L("Guides", "Guides"),
  buying: L("Buying", "Achat"),
  commercial: L("Commercial", "Commercial"),
  community: L("Community", "Communauté"),
  seasonal: L("Seasonal", "Saisonnier"),
  ownership: L("Ownership", "Entretien"),
};

type SeedPost = {
  slug: string;
  category: string;
  tags: string[];
  coverImage: string;
  featured: boolean;
  publishedDaysAgo: number;
  readingMinutes: number;
  title: { en: string };
  excerpt: { en: string };
  metaTitle: { en: string };
  metaDescription: { en: string };
  content: { en: string };
};

async function main() {
  const author = await prisma.author.upsert({
    where: { id: "author-bigwave-team" },
    update: {},
    create: {
      id: "author-bigwave-team",
      name: "The Splash Republic Team",
      bio: L(
        "The crew behind Splash Republic — water-fun experts who deliver, set up, and sweat the details so your event is effortless.",
        "L'équipe derrière Splash Republic — des experts du plaisir aquatique qui livrent, installent et soignent les détails pour que votre événement soit sans effort.",
      ),
    },
  });

  const posts = JSON.parse(
    readFileSync(new URL("../prisma/blog-posts.json", import.meta.url), "utf8"),
  ) as SeedPost[];

  const categoryIds = new Map<string, string>();
  for (const slug of new Set(posts.map((p) => p.category))) {
    const cat = await prisma.blogCategory.upsert({
      where: { slug },
      update: { name: CATEGORY_NAMES[slug] ?? L(slug, slug) },
      create: { slug, name: CATEGORY_NAMES[slug] ?? L(slug, slug) },
    });
    categoryIds.set(slug, cat.id);
  }

  for (const post of posts) {
    const tags = {
      connectOrCreate: post.tags.map((t) => ({
        where: { slug: t },
        create: { slug: t, name: TAG_NAMES[t] ?? L(t, t) },
      })),
    };
    const common = {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      coverImage: post.coverImage,
      status: "PUBLISHED" as const,
      publishedAt: daysFromNow(-post.publishedDaysAgo),
      readingMinutes: post.readingMinutes,
      featured: post.featured,
      authorId: author.id,
      categoryId: categoryIds.get(post.category)!,
    };
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: { ...common, tags: { set: [], ...tags } },
      create: { slug: post.slug, ...common, tags },
    });
  }

  const count = await prisma.blogPost.count();
  console.log(
    `Seeded ${posts.length} posts. Total published blog posts: ${count}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
