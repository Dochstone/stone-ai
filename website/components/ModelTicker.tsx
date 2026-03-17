const MODELS = [
  { name: "GPT-5.1", price: "$30/1M" },
  { name: "Claude Opus 4", price: "$130/1M" },
  { name: "Gemini 2.5 Pro", price: "$26/1M" },
  { name: "GPT-4o mini", price: "FREE" },
  { name: "DeepSeek R1", price: "$4.40/1M" },
  { name: "Grok 3", price: "$30/1M" },
  { name: "Llama 4 Maverick", price: "FREE" },
  { name: "Claude Sonnet 4", price: "$18/1M" },
  { name: "Mistral Large", price: "FREE" },
  { name: "Perplexity", price: "$5/1M" },
];

export default function ModelTicker() {
  const items = [...MODELS, ...MODELS];

  return (
    <div className="bg-[#1A1916] py-3 overflow-hidden border-y border-white/[0.06]">
      <div className="flex animate-ticker items-center">
        {items.map((m, i) => (
          <span key={i} className="shrink-0 mx-6 flex items-center gap-2 whitespace-nowrap">
            <span className="text-white/70 text-sm font-semibold">{m.name}</span>
            <span className={`text-xs font-bold ${m.price === "FREE" ? "text-teal" : "text-accent"}`}>
              {m.price}
            </span>
            <span className="text-white/15 ml-4">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
