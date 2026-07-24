const TECHNOLOGIES = [
  { name: "React", label: "Frontend UI Framework" },
  { name: "Node.js", label: "Runtime Environment" },
  { name: "Express", label: "Backend API Routing" },
  { name: "MongoDB", label: "NoSQL Database" },
  { name: "Socket.io", label: "Real-Time WebSockets" },
  { name: "JWT", label: "Secure Auth Tokens" },
  { name: "Claude AI", label: "Content & Copy Model" },
  { name: "Gemini AI", label: "Multimodal Analytics AI" },
  { name: "LangGraph", label: "Agentic Orchestration" },
  { name: "Tailwind CSS", label: "Utility-First Styling" },
];

export function TechStack() {
  return (
    <section
      id="tech"
      className="relative mx-4 my-10 overflow-hidden rounded-3xl bg-brand-darkest px-4 py-20 text-white sm:mx-8 sm:px-8"
    >
      <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-brand-primary/20 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-12">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <span className="text-xs font-bold tracking-widest text-brand-soft uppercase">
            Production Architecture
          </span>
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Powered by Modern MERN + AI Tech Stack
          </h2>
          <p className="text-sm text-brand-soft/70">
            Built with enterprise-ready frameworks for performance, scalability,
            and security.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {TECHNOLOGIES.map((tech) => (
            <div
              key={tech.name}
              className="group space-y-2 rounded-2xl glass-panel-dark p-4 text-center transition-colors hover:border-brand-primary"
            >
              <div className="text-lg font-bold text-brand-soft transition-transform group-hover:scale-110">
                {tech.name}
              </div>
              <p className="text-[11px] text-white/60">{tech.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
