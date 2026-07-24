const EVENTS = [
  {
    dot: "bg-brand-primary",
    tag: "Productivity Bottleneck",
    tagColor: "text-brand-primary",
    title: "Eliminating Manual Hours",
    body: "Traditional teams waste 15+ hours weekly manually formatting content across different social media platforms. MetaPulse automates this completely.",
  },
  {
    dot: "bg-brand-secondary",
    tag: "AI Automation First",
    tagColor: "text-brand-secondary",
    title: "Intelligent Campaign Creation",
    body: "Rather than simple post scheduling, our agentic AI generates copy, formats images, and optimizes timing based on live performance feedback.",
  },
  {
    dot: "bg-brand-dark",
    tag: "Team Synergy",
    tagColor: "text-brand-dark",
    title: "Seamless Collaboration",
    body: "Single-source-of-truth workspaces allow marketing leads, copywriters, and clients to approve campaigns in seconds with zero friction.",
  },
];

export function Timeline() {
  return (
    <section className="relative px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-16">
        <div className="space-y-3 text-center">
          <h2 className="text-3xl font-extrabold text-brand-text sm:text-4xl">
            Why MetaPulse Was Built
          </h2>
          <p className="text-base text-brand-muted">
            Eliminating friction points to accelerate marketing momentum.
          </p>
        </div>

        <div className="relative ml-4 space-y-12 border-l-2 border-brand-primary/20 sm:ml-32">
          {EVENTS.map((event) => (
            <div key={event.title} className="group relative pl-8 sm:pl-12">
              <div
                className={`absolute top-1.5 -left-[9px] h-4 w-4 rounded-full border-4 border-white shadow-md ${event.dot}`}
              />
              <div className="space-y-2 rounded-2xl glass-panel p-6">
                <span
                  className={`text-xs font-bold uppercase ${event.tagColor}`}
                >
                  {event.tag}
                </span>
                <h3 className="text-lg font-bold text-brand-text">
                  {event.title}
                </h3>
                <p className="text-xs leading-relaxed text-brand-muted">
                  {event.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
