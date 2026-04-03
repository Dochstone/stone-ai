"use client";

const STYLES = [
  { id: "modern", name: "Современный", bg: "#ffffff", text: "#1a1a2e", accent: "#6c63ff" },
  { id: "minimal", name: "Минимальный", bg: "#fafafa", text: "#333333", accent: "#000000" },
  { id: "corporate", name: "Корпоративный", bg: "#ffffff", text: "#2c3e50", accent: "#2980b9" },
  { id: "creative", name: "Креативный", bg: "#fff8f0", text: "#2d2d2d", accent: "#ff6b6b" },
  { id: "bold", name: "Яркий", bg: "#0f0f0f", text: "#e0e0e0", accent: "#ffcc00" },
  { id: "dark", name: "Тёмный", bg: "#1e1e2e", text: "#cdd6f4", accent: "#89b4fa" },
];

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export default function StylePicker({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {STYLES.map((s) => {
        const isActive = selected === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={`
              flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-150
              ${isActive
                ? "border-accent ring-2 ring-accent/30"
                : "border-text/10 hover:border-text/20"
              }
            `}
          >
            {/* Mini preview */}
            <div
              className="w-full aspect-video rounded-lg relative overflow-hidden"
              style={{ backgroundColor: s.bg }}
            >
              {/* Title line */}
              <div
                className="absolute top-[20%] left-[12%] w-[50%] h-[12%] rounded-sm"
                style={{ backgroundColor: s.text, opacity: 0.8 }}
              />
              {/* Bullet lines */}
              <div
                className="absolute top-[42%] left-[12%] w-[70%] h-[6%] rounded-sm"
                style={{ backgroundColor: s.text, opacity: 0.2 }}
              />
              <div
                className="absolute top-[54%] left-[12%] w-[55%] h-[6%] rounded-sm"
                style={{ backgroundColor: s.text, opacity: 0.2 }}
              />
              <div
                className="absolute top-[66%] left-[12%] w-[60%] h-[6%] rounded-sm"
                style={{ backgroundColor: s.text, opacity: 0.2 }}
              />
              {/* Accent bar */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[6%]"
                style={{ backgroundColor: s.accent }}
              />
            </div>
            <span className="text-[11px] font-medium text-text/60">{s.name}</span>
          </button>
        );
      })}
    </div>
  );
}
