/**
 * Shared OG image template. Rendered server-side by Next.js ImageResponse
 * into a 1200×630 PNG. Used by every route's opengraph-image.tsx.
 *
 * Note: ImageResponse uses Satori which supports a subset of CSS (flex,
 * colors, transforms). Avoid grid, filters, pseudo-elements, external
 * stylesheets. Avoid webp in <img> — use PNG/JPG or inline base64 SVG.
 */

export interface OgTemplateProps {
  title: string;
  subtitle?: string;
  category?: string;
  accent?: string;
}

const BG = "#0a0a0a";
const ACCENT = "#D97757";
const PURPLE = "#7C3AED";
const TEAL = "#2DD4BF";
const TEXT = "#f5f5f5";
const TEXT_DIM = "rgba(245,245,245,0.55)";

export function OgTemplate({ title, subtitle, category, accent = ACCENT }: OgTemplateProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: `linear-gradient(135deg, ${BG} 0%, #1a1210 100%)`,
        color: TEXT,
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Accent glow — top right */}
      <div
        style={{
          position: "absolute",
          top: -180,
          right: -180,
          width: 560,
          height: 560,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent} 0%, rgba(217,119,87,0) 70%)`,
          opacity: 0.5,
          display: "flex",
        }}
      />
      {/* Purple glow — bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: -160,
          left: -160,
          width: 460,
          height: 460,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${PURPLE} 0%, rgba(124,58,237,0) 70%)`,
          opacity: 0.32,
          display: "flex",
        }}
      />

      {/* Header: Logo + brand */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <img
            src="https://stoneai.ru/stone-mascot-idle.png"
            width="96"
            height="96"
            style={{
              borderRadius: 22,
              border: `2px solid ${accent}`,
            }}
          />
          <span style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-0.03em" }}>Stone AI</span>
        </div>
        {category ? (
          <div
            style={{
              display: "flex",
              padding: "14px 28px",
              borderRadius: 999,
              border: `2px solid ${accent}`,
              color: accent,
              fontSize: 20,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            {category}
          </div>
        ) : null}
      </div>

      {/* Main title block */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 940 }}>
        <div
          style={{
            fontSize: title.length > 50 ? 64 : 96,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 30, color: TEXT_DIM, lineHeight: 1.35, maxWidth: 880 }}>
            {subtitle}
          </div>
        ) : null}
      </div>

      {/* Models badges + URL */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 32,
          borderTop: "2px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {["GPT-5", "Claude", "Midjourney", "Sora", "Gemini"].map((name, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                padding: "8px 16px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontSize: 18,
                color: TEXT,
                fontWeight: 700,
              }}
            >
              {name}
            </div>
          ))}
          <span style={{ fontSize: 18, color: TEXT_DIM, fontWeight: 600, marginLeft: 8 }}>
            и ещё 60+
          </span>
        </div>
        <span style={{ fontSize: 28, color: accent, fontWeight: 800 }}>stoneai.ru</span>
      </div>
    </div>
  );
}

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";
