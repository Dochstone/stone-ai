interface Example {
  prompt: string;
  tag?: string;
}

interface ToolExamplesProps {
  title?: string;
  subtitle?: string;
  examples: Example[];
}

export default function ToolExamples({
  title = "Примеры запросов",
  subtitle,
  examples,
}: ToolExamplesProps) {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-3">
          {title}
        </h2>
        {subtitle && (
          <p className="text-text/60 text-center mb-12 max-w-lg mx-auto">{subtitle}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {examples.map((ex, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-text/5 card-hover">
              {ex.tag && (
                <span className="inline-block bg-accent/10 text-accent px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-3">
                  {ex.tag}
                </span>
              )}
              <p className="text-sm text-text/70 leading-relaxed italic">
                &ldquo;{ex.prompt}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
