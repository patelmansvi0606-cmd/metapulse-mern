const STEPS = [
  {
    color: "bg-brand-primary",
    title: "Create Account",
    body: "Instant onboarding with JWT authentication",
  },
  {
    color: "bg-brand-secondary",
    title: "Create Workspace",
    body: "Setup dedicated brand hubs",
  },
  {
    color: "bg-brand-dark",
    title: "Invite Team",
    body: "Grant custom role permissions",
  },
  {
    color: "bg-brand-darkest",
    title: "Generate AI Content",
    body: "Draft copy with Claude & Gemini AI",
    highlighted: true,
  },
  {
    color: "bg-brand-dark",
    title: "Manage Campaigns",
    body: "Schedule & review social posts",
  },
  {
    color: "bg-brand-secondary",
    title: "Track Performance",
    body: "Monitor live metrics & engagement",
  },
  {
    color: "bg-brand-primary",
    title: "Optimize using AI",
    body: "Continuous automated refinements",
  },
];

export function Workflow() {
  return (
    <section
      id="workflow"
      className="relative bg-brand-primary/5 px-4 py-20 sm:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-16">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold tracking-wider text-brand-primary uppercase">
            Step-by-step Execution
          </div>
          <h2 className="text-3xl font-extrabold text-brand-text sm:text-4xl">
            How MetaPulse Powers Your Engine
          </h2>
          <p className="text-base text-brand-muted">
            A seamless flow designed to get you from setup to automated growth
            in minutes.
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className={`flex flex-col items-center space-y-3 rounded-2xl glass-panel p-5 text-center transition-transform duration-300 hover:-translate-y-2 ${
                step.highlighted ? "border-2 border-brand-primary/30" : ""
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-md ${step.color}`}
              >
                {i + 1}
              </div>
              <h4 className="text-sm font-bold text-brand-text">
                {step.title}
              </h4>
              <p className="text-[11px] text-brand-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
