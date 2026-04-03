"use client";

interface SlideData {
  title: string;
  bullets: string[];
  notes: string;
  layout: string;
}

interface Props {
  slide: SlideData;
  style: string;
  slideNumber: number;
  totalSlides: number;
  compact?: boolean;
}

const THEMES: Record<string, { bg: string; text: string; accent: string }> = {
  modern: { bg: "#ffffff", text: "#1a1a2e", accent: "#4361ee" },
  minimal: { bg: "#fafafa", text: "#333333", accent: "#666666" },
  corporate: { bg: "#ffffff", text: "#2c3e50", accent: "#2980b9" },
  creative: { bg: "#1a1a2e", text: "#e8e8e8", accent: "#e94560" },
  bold: { bg: "#000000", text: "#ffffff", accent: "#ffd93d" },
  dark: { bg: "#0f0f1a", text: "#d1d5db", accent: "#6c8cff" },
};

export default function SlidePreview({ slide, style, slideNumber, totalSlides, compact }: Props) {
  const theme = THEMES[style] || THEMES.modern;
  const layout = slide.layout || "content";

  const renderContent = () => {
    switch (layout) {
      case "title":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-12">
            <h1 className="text-[2.4em] font-bold leading-tight mb-4" style={{ color: theme.text }}>
              {slide.title}
            </h1>
            {slide.bullets.length > 0 && (
              <p className="text-[1.1em] opacity-60" style={{ color: theme.text }}>
                {slide.bullets[0]}
              </p>
            )}
          </div>
        );

      case "section-header":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-12">
            <div className="w-16 h-1 rounded-full mb-6" style={{ backgroundColor: theme.accent }} />
            <h2 className="text-[2em] font-bold leading-tight" style={{ color: theme.text }}>
              {slide.title}
            </h2>
          </div>
        );

      case "quote":
        return (
          <div className="flex flex-col items-center justify-center h-full px-16">
            <div className="text-[3em] leading-none mb-2" style={{ color: theme.accent }}>&ldquo;</div>
            <p className="text-[1.3em] italic text-center leading-relaxed" style={{ color: theme.text }}>
              {slide.bullets[0] || slide.title}
            </p>
            {slide.bullets.length > 1 && (
              <p className="mt-4 text-[0.9em] font-semibold" style={{ color: theme.accent }}>
                {slide.bullets[1]}
              </p>
            )}
          </div>
        );

      case "two-column":
        const mid = Math.ceil(slide.bullets.length / 2);
        const left = slide.bullets.slice(0, mid);
        const right = slide.bullets.slice(mid);
        return (
          <div className="flex flex-col h-full px-10 py-8">
            <h2 className="text-[1.5em] font-bold mb-6" style={{ color: theme.text }}>
              {slide.title}
            </h2>
            <div className="flex-1 grid grid-cols-2 gap-8">
              <ul className="space-y-3">
                {left.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-[0.85em] leading-relaxed">
                    <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: theme.accent }} />
                    <span style={{ color: theme.text }}>{b}</span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-3">
                {right.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-[0.85em] leading-relaxed">
                    <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: theme.accent }} />
                    <span style={{ color: theme.text }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      default: // "content"
        return (
          <div className="flex flex-col h-full px-10 py-8">
            <h2 className="text-[1.5em] font-bold mb-6" style={{ color: theme.text }}>
              {slide.title}
            </h2>
            <ul className="flex-1 space-y-3">
              {slide.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-[0.85em] leading-relaxed">
                  <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: theme.accent }} />
                  <span style={{ color: theme.text }}>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        );
    }
  };

  if (compact) {
    return (
      <div className="w-[200px] h-[112px] shrink-0 overflow-hidden rounded-lg border border-text/10 cursor-pointer hover:border-accent/50 transition-colors">
        <div
          className="w-[800px] h-[450px] origin-top-left"
          style={{
            backgroundColor: theme.bg,
            transform: "scale(0.25)",
            fontSize: "16px",
          }}
        >
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div
      className="aspect-video rounded-xl overflow-hidden relative shadow-lg"
      style={{ backgroundColor: theme.bg }}
    >
      {renderContent()}
      {/* Accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: theme.accent }} />
      {/* Slide number */}
      <div
        className="absolute bottom-3 right-4 text-[0.7em] font-medium opacity-40"
        style={{ color: theme.text }}
      >
        {slideNumber} / {totalSlides}
      </div>
    </div>
  );
}
