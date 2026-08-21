// scripts/indexnow-submit.ts
// One-shot bulk submit of every live URL to IndexNow (Bing/Yandex/etc.).
// Reads the production sitemap, extracts all <loc> URLs, and submits them.
// Run:  dotenv -e .env.local -- tsx scripts/indexnow-submit.ts
//   or: SITE=https://splashrep.com tsx scripts/indexnow-submit.ts
const KEY = "a6c8a198654f4812ae52d2692674c8a2";
const SITE = (
  process.env.SITE ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.splashrep.com"
).replace(/\/$/, "");

async function main() {
  const host = new URL(SITE).host;
  const sm = await fetch(`${SITE}/sitemap.xml`, { redirect: "follow" });
  const xml = await sm.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urls.length === 0) {
    console.error("No URLs found in sitemap. Is SITE correct?", SITE);
    process.exit(1);
  }
  console.log(`Submitting ${urls.length} URLs to IndexNow (host: ${host})…`);

  // The spec allows 10,000 URLs per request, but Bing applies a per-host quota
  // that a young site trips long before that: a single 343-URL POST was
  // rejected 403 while the same key in batches of 100 was accepted 200. So the
  // batch is deliberately small — a 403 here is far more likely to be the
  // quota than a bad key, and the key is easy to verify separately by POSTing
  // one URL.
  const BATCH = 100;
  for (let i = 0; i < urls.length; i += BATCH) {
    const urlList = urls.slice(i, i + BATCH);
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: KEY,
        keyLocation: `${SITE}/${KEY}.txt`,
        urlList,
      }),
    });
    console.log(
      `  batch ${i / BATCH + 1}: ${res.status} ${res.statusText} (${urlList.length} URLs)`,
    );
  }
  console.log(
    "Done. (200/202 = accepted; 403 = key file not reachable at the host.)",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
