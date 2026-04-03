"use client";

interface SlideData {
  title: string;
  bullets: string[];
  notes: string;
  layout: string;
  image_url?: string;
}

interface Props {
  slide: SlideData;
  style: string;
  slideNumber: number;
  totalSlides: number;
  compact?: boolean;
}

const THEMES: Record<string, { bg: string; text: string; accent: string; titleBg: string; titleText: string }> = {
  modern:    { bg: "#ffffff", text: "#1a1a2e", accent: "#6c63ff", titleBg: "linear-gradient(135deg, #6c63ff 0%, #3f3d9e 100%)", titleText: "#ffffff" },
  minimal:   { bg: "#fafafa", text: "#333333", accent: "#000000", titleBg: "#111111", titleText: "#ffffff" },
  corporate: { bg: "#ffffff", text: "#2c3e50", accent: "#2980b9", titleBg: "linear-gradient(135deg, #2980b9 0%, #1a5276 100%)", titleText: "#ffffff" },
  creative:  { bg: "#fff8f0", text: "#2d2d2d", accent: "#ff6b6b", titleBg: "linear-gradient(135deg, #ff6b6b 0%, #ffa07a 100%)", titleText: "#ffffff" },
  bold:      { bg: "#0f0f0f", text: "#e0e0e0", accent: "#ffcc00", titleBg: "linear-gradient(135deg, #ffcc00 0%, #ff9900 100%)", titleText: "#0f0f0f" },
  dark:      { bg: "#1e1e2e", text: "#cdd6f4", accent: "#89b4fa", titleBg: "linear-gradient(135deg, #313244 0%, #1e1e2e 100%)", titleText: "#cdd6f4" },
};

export default function SlidePreview({ slide, style, slideNumber, totalSlides, compact }: Props) {
  const theme = THEMES[style] || THEMES.modern;
  const layout = slide.layout || "content";

  const renderContent = () => {
    switch (layout) {
      case "title":
      case "section-header":
        return (
          <div
            className="flex flex-col items-center justify-center h-full text-center px-12"
            style={{ background: theme.titleBg }}
          >
            <h1
              className={`${layout === "title" ? "text-[2.4em]" : "text-[2em]"} font-bold leading-tight mb-4`}
              style={{ color: theme.titleText }}
            >
              {slide.title}
            </h1>
            {slide.bullets.length > 0 && layout === "title" && (
              <p className="text-[1.1em] opacity-80" style={{ color: theme.titleText }}>
                {slide.bullets[0]}
              </p>
            )}
          </div>
        );

      case "quote":
        return (
          <div className="flex flex-col items-center justify-center h-full px-16" style={{ backgroundColor: theme.bg }}>
            <div className="border-l-4 pl-6 max-w-[80%]" style={{ borderColor: theme.accent }}>
              <p className="text-[1.3em] italic leading-relaxed mb-3" style={{ color: theme.text }}>
                &ldquo;{slide.bullets[0] || slide.title}&rdquo;
              </p>
              {slide.bullets.length > 1 && (
                <p className="text-[0.9em] font-semibold" style={{ color: theme.accent }}>
                  &mdash; {slide.bullets[1]}
                </p>
              )}
            </div>
          </div>
        );

      case "two-column": {
        // If image exists, show text left + image right
        if (slide.image_url) {
          return (
            <div className="flex h-full" style={{ backgroundColor: theme.bg }}>
              <div className="w-[55%] flex flex-col py-8 px-10">
                <h2 className="text-[1.5em] font-bold mb-6" style={{ color: theme.text }}>{slide.title}</h2>
                <ul className="flex-1 space-y-3">
                  {slide.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-[0.85em] leading-relaxed">
                      <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: theme.accent }} />
                      <span style={{ color: theme.text }}>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-[45%] flex items-center justify-center p-4">
                <img src={slide.image_url} alt="" className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
              </div>
            </div>
          );
        }
        const mid = Math.ceil(slide.bullets.length / 2);
        const left = slide.bullets.slice(0, mid);
        const right = slide.bullets.slice(mid);
        return (
          <div className="flex flex-col h-full px-10 py-8" style={{ backgroundColor: theme.bg }}>
            <h2 className="text-[1.5em] font-bold mb-6" style={{ color: theme.text }}>{slide.title}</h2>
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
      }

      default: // "content"
        return (
          <div className="flex h-full" style={{ backgroundColor: theme.bg }}>
            <div className={`flex flex-col py-8 px-10 ${slide.image_url ? "w-[60%]" : "w-full"}`}>
              <h2 className="text-[1.5em] font-bold mb-2" style={{ color: theme.text }}>{slide.title}</h2>
              <div className="w-10 h-0.5 rounded mb-5" style={{ backgroundColor: theme.accent }} />
              <ul className="flex-1 space-y-3">
                {slide.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-[0.85em] leading-relaxed">
                    <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: theme.accent }} />
                    <span style={{ color: theme.text }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            {slide.image_url && (
              <div className="w-[40%] flex items-center justify-center p-4">
                <img src={slide.image_url} alt="" className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
              </div>
            )}
          </div>
        );
    }
  };

  if (compact) {
    return (
      <div className="w-[160px] h-[90px] shrink-0 overflow-hidden rounded-lg border border-text/10 cursor-pointer hover:border-accent/50 transition-colors">
        <div
          className="w-[800px] h-[450px] origin-top-left"
          style={{
            backgroundColor: layout === "title" || layout === "section-header" ? undefined : theme.bg,
            background: layout === "title" || layout === "section-header" ? theme.titleBg : undefined,
            transform: "scale(0.2)",
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
      style={{ backgroundColor: layout === "title" || layout === "section-header" ? undefined : theme.bg }}
    >
      {renderContent()}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: theme.accent }} />
      <div
        className="absolute bottom-3 right-4 text-[0.7em] font-medium opacity-40"
        style={{ color: layout === "title" || layout === "section-header" ? theme.titleText : theme.text }}
      >
        {slideNumber} / {totalSlides}
      </div>
    </div>
  );
}
