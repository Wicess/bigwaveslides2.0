import { ImageResponse } from "next/og";

export const runtime = "edge";

/** Dynamic Open Graph image: /api/og?title=...&subtitle=... */
export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? "Big Wave Slides").slice(0, 120);
  const subtitle = (searchParams.get("subtitle") ?? "Sell · Rent · Install Water Slides").slice(0, 140);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #0099FF 0%, #00D4FF 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", color: "#fff", fontSize: 36, fontWeight: 800 }}>
          🌊 Big Wave Slides
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ color: "#ffffff", fontSize: 68, fontWeight: 800, lineHeight: 1.05, maxWidth: 980 }}>
            {title}
          </div>
          <div style={{ color: "rgba(255,255,255,0.92)", fontSize: 32, maxWidth: 900 }}>
            {subtitle}
          </div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 26 }}>
          bigwaveslides.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
