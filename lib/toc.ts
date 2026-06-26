// lib/toc.ts
// Helpers to turn a Markdown article into a table of contents. `slugify` is
// shared by the renderer (to id each <h2>) and the TOC (to link to it) so the
// anchors always match.

/** URL/anchor-safe slug from heading text. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export type Heading = { id: string; text: string };

/** Extract the H2 (`## `) headings from a Markdown string, in order. */
export function extractHeadings(markdown: string): Heading[] {
  const out: Heading[] = [];
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    // Match exactly "## " (an H2), not "### " or deeper.
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (!m || !m[1]) continue;
    const text = m[1].replace(/[*_`]/g, "").trim();
    out.push({ id: slugify(text), text });
  }
  return out;
}
