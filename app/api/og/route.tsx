import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * Dynamic Open Graph / Twitter card — 1200×630.
 *
 * Every page that has no real photo of its own falls back to this card, so it
 * is the image a customer actually sees when the site is shared into iMessage,
 * WhatsApp, Facebook or Slack. That makes it a conversion surface, not
 * decoration: it carries the page's subject (eyebrow), the promise (headline +
 * subtitle), the price hook, and the domain.
 *
 *   /api/og?title=…&eyebrow=…&subtitle=…&badge=…&price=…
 *
 * Satori (the renderer behind ImageResponse) supports a flexbox subset only —
 * no CSS grid, no external stylesheets — and requires an explicit
 * `display: flex` on any element with more than one child.
 */

const BRAND = "#0099FF";
const ACCENT = "#7FE7FF";

function clamp(v: string | null, max: number): string {
  return (v ?? "").trim().slice(0, max);
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = clamp(searchParams.get("title"), 110) || "Splash Republic";
  const eyebrow = clamp(searchParams.get("eyebrow"), 42);
  const subtitle =
    clamp(searchParams.get("subtitle"), 120) ||
    "Delivered, set up, sanitized & fully insured";
  const badge = clamp(searchParams.get("badge"), 24);
  const price = clamp(searchParams.get("price"), 28) || "From $199/day";

  // Long headlines need a smaller size or they overflow the card.
  const titleSize = title.length > 78 ? 54 : title.length > 48 ? 64 : 76;

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        // Deep ocean → brand blue. Darker than the old flat cyan so white
        // type sits at a comfortable contrast ratio and the card reads
        // premium rather than like a default template.
        background: `linear-gradient(135deg, #041C33 0%, #06355C 42%, ${BRAND} 100%)`,
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Soft light bloom in the lower right — depth without a photo. */}
      <div
        style={{
          position: "absolute",
          right: -180,
          bottom: -240,
          width: 720,
          height: 720,
          borderRadius: 720,
          background:
            "radial-gradient(circle, rgba(127,231,255,0.34) 0%, rgba(127,231,255,0) 68%)",
        }}
      />

      {/* ── Header: brand lockup + optional badge ─────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.22)",
              fontSize: 28,
            }}
          >
            🌊
          </div>
          <div
            style={{
              color: "#ffffff",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 4,
            }}
          >
            SPLASH REPUBLIC
          </div>
        </div>

        {badge ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 26px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.28)",
              color: "#ffffff",
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            {badge}
          </div>
        ) : null}
      </div>

      {/* ── Body: eyebrow → headline → subtitle ───────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {eyebrow ? (
          <div
            style={{
              color: ACCENT,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 6,
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            {eyebrow}
          </div>
        ) : null}

        <div
          style={{
            color: "#ffffff",
            fontSize: titleSize,
            fontWeight: 800,
            lineHeight: 1.06,
            letterSpacing: -1.5,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: "rgba(255,255,255,0.82)",
            fontSize: 30,
            lineHeight: 1.35,
            maxWidth: 900,
            marginTop: 22,
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* ── Footer: price hook · domain ───────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid rgba(255,255,255,0.20)",
          paddingTop: 26,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            color: "#ffffff",
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          {price}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            color: "rgba(255,255,255,0.78)",
            fontSize: 26,
            letterSpacing: 1,
          }}
        >
          splashrep.com
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        // The card is a pure function of the query string, so it can be cached
        // hard at the edge — social scrapers re-fetch it on every share.
        "cache-control": "public, max-age=31536000, immutable, no-transform",
      },
    },
  );
}
