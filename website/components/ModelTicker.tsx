const PROVIDERS = [
  { name: "OpenAI", weight: "800", style: "" },
  { name: "Anthropic", weight: "400", style: "" },
  { name: "Google", weight: "500", style: "" },
  { name: "xAI", weight: "800", style: "italic" },
  { name: "DeepSeek", weight: "300", style: "" },
  { name: "Meta", weight: "700", style: "" },
  { name: "Mistral", weight: "500", style: "" },
  { name: "Perplexity", weight: "400", style: "italic" },
  { name: "Google", weight: "500", style: "" },
  { name: "OpenAI", weight: "800", style: "" },
  { name: "Anthropic", weight: "400", style: "" },
  { name: "xAI", weight: "800", style: "italic" },
  { name: "DeepSeek", weight: "300", style: "" },
  { name: "Meta", weight: "700", style: "" },
  { name: "Mistral", weight: "500", style: "" },
  { name: "Perplexity", weight: "400", style: "italic" },
];

export default function ModelTicker() {
  const items = [...PROVIDERS, ...PROVIDERS];

  return (
    <div className="py-10 md:py-14 overflow-hidden border-y border-text/[0.04]">
      <div className="flex animate-ticker items-center">
        {items.map((p, i) => (
          <span
            key={i}
            className="shrink-0 mx-6 sm:mx-10 text-xl sm:text-2xl md:text-3xl text-text opacity-[0.15] hover:opacity-[0.5] transition-opacity duration-300 cursor-default select-none"
            style={{
              fontWeight: Number(p.weight),
              fontStyle: p.style === "italic" ? "italic" : "normal",
            }}
          >
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}
