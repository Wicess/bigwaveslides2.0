/*
 * gen-priority-index-urls.ts — regenerate PRIORITY-INDEX-URLS.txt.
 *
 * The manual-submission list, ordered by what is worth spending Search
 * Console's ~10-15 URL/day inspection quota on first.
 *
 * WHY THIS IS NOW GENERATED
 * It was written by hand and immediately went stale: two new blog posts
 * shipped and the file still listed 343 URLs, missing the fall-festival guide
 * whose whole point is an October window that closes. A hand-maintained mirror
 * of a generated sitemap will always drift, which is the same lesson
 * indexing-urls.txt already learned.
 *
 * ORDERING, and the reasoning behind it:
 *   Day 1     entity + commercial + seasonal. The homepage is how Google
 *             discovers everything else, and the fall pages have a deadline.
 *   Day 2     the 17 hand-written city profiles — the only location pages with
 *             genuine local content, and the page type that has already
 *             produced a real order via Bing.
 *   Day 3     core site pages.
 *   Day 4-5   blog. The strongest long-tail surface, and what search engines
 *             have actually been landing on.
 *   Day 6-7   rental product pages (the money pages).
 *   Day 8-9   shop product pages.
 *   Later     state hubs, use-case and taxonomy pages — real, but they are
 *             navigation more than destinations.
 *
 * Reads the LIVE sitemap so the file can never list a URL the site does not
 * serve, and verifies the count matches.
 *
 * Run: npm run gen:priority-urls
 */
import { writeFileSync } from "node:fs";

const BASE = "https://www.splashrep.com";
const EN = `${BASE}/en`;

/** Seasonal and commercial pages that should go out before anything else. */
const DAY1_EXTRA = [
  `${EN}/blog/fall-festival-inflatable-rentals`,
  `${EN}/blog/what-to-rent-when-its-too-cold-for-a-water-slide`,
  `${EN}/water-slides-for/fall-festivals`,
  `${EN}/water-slides-for/trunk-or-treat`,
  `${EN}/water-slides-for/halloween-parties`,
  `${EN}/water-slides-for/harvest-festivals`,
  `${EN}/water-slides-for/school-carnivals`,
];

const CORE = [
  EN,
  `${EN}/rent`,
  `${EN}/shop`,
  `${EN}/contact`,
  `${EN}/about`,
  `${EN}/services`,
  `${EN}/blog`,
  `${EN}/answers`,
  `${EN}/faq`,
  `${EN}/water-slide-rentals`,
  `${EN}/bounce-house-rentals`,
  `${EN}/water-slides-for`,
  `${EN}/testimonials`,
];

async function main() {
  const res = await fetch(`${BASE}/sitemap.xml`, { redirect: "follow" });
  const xml = await res.text();
  const all = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
  if (all.length === 0) throw new Error("no URLs in sitemap — is the site up?");

  const pool = new Set(all);
  const take = (pred: (u: string) => boolean) => {
    const got = [...pool].filter(pred);
    for (const u of got) pool.delete(u);
    return got.sort();
  };

  // Day 1: homepage + commercial entry points + the seasonal cluster.
  const day1 = take(
    (u) => CORE.slice(0, 4).includes(u) || DAY1_EXTRA.includes(u),
  );
  const cities = take((u) =>
    /\/(water-slide|bounce-house)-rentals\/[^/]+\/[^/]+$/.test(u),
  );
  const core = take((u) => CORE.includes(u));
  const blog = take(
    (u) => /\/blog\/[^/]+$/.test(u) && !/\/blog\/(category|tag)\//.test(u),
  );
  const rent = take((u) => /\/rent\/[^/]+$/.test(u));
  const shop = take((u) => /\/shop\/[^/]+$/.test(u));
  const rest = take(() => true);

  const sections: [string, string[], string[]][] = [
    [
      "DAY 1 — entity, commercial and seasonal",
      [
        "Do these first: the homepage is how Google discovers everything else,",
        "and the fall pages have a real October window that closes.",
      ],
      day1,
    ],
    [
      "DAY 2 — hand-written city profiles",
      [
        "The only location pages with genuine local content behind them, and the",
        "page type that has already produced a real order (via Bing, Atlanta).",
      ],
      cities,
    ],
    ["DAY 3 — core site pages", [], core],
    [
      "DAY 4-5 — blog",
      ["Original posts; the strongest long-tail surface you have."],
      blog,
    ],
    ["DAY 6-7 — rental product pages", [], rent],
    ["DAY 8-9 — shop product pages", [], shop],
    [
      "LATER — state hubs, use-case and taxonomy pages",
      [
        "Real pages, but navigation more than destinations. Submit only if",
        "everything above is indexed and you still have quota spare.",
      ],
      rest,
    ],
  ];

  const out: string[] = [
    "# Splash Republic — full manual indexing list",
    "#",
    "# Google Search Console -> URL Inspection -> paste -> Request Indexing.",
    "# Quota is roughly 10-15 URLs per property per day. Work top to bottom and stop",
    "# when GSC refuses; do NOT retry the same URL, repeats can throttle the quota.",
    "#",
    "# Every URL is read from the live sitemap, so this file cannot list a page the",
    "# site does not serve. Regenerate with `npm run gen:priority-urls`.",
    "#",
    "# You do not need to submit all of these by hand. Once Google crawls Day 1 and",
    "# finds real content it follows the internal links and picks up the rest. Manual",
    "# submission is a kickstart; what actually raises crawl budget is a Google",
    "# Business Profile and the first real backlinks.",
    "#",
    `# Generated ${new Date().toISOString().slice(0, 10)} from ${BASE}/sitemap.xml — ${all.length} URLs`,
    "",
  ];
  let total = 0;
  for (const [title, notes, urls] of sections) {
    if (!urls.length) continue;
    total += urls.length;
    out.push("", "# " + "-".repeat(74), `# ${title}`);
    for (const n of notes) out.push(`#   ${n}`);
    out.push(`# ${urls.length} URLs`, "");
    out.push(...urls);
  }
  out.push("");

  writeFileSync("PRIORITY-INDEX-URLS.txt", out.join("\n"));
  if (total !== all.length) {
    console.error(`✗ bucketed ${total} but sitemap has ${all.length}`);
    process.exit(1);
  }
  console.log(
    `Wrote PRIORITY-INDEX-URLS.txt — ${total}/${all.length} URLs, all accounted for.`,
  );
  for (const [title, , urls] of sections)
    if (urls.length)
      console.log(`   ${urls.length.toString().padStart(3)}  ${title}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
