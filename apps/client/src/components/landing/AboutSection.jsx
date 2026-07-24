import { Cpu, Share2, BarChart3, Users, Check } from "lucide-react";

const HIGHLIGHTS = [
  {
    title: "Unified Dashboard",
    body: "Eliminate tab-switching across platforms.",
  },
  {
    title: "Autonomous AI Copilot",
    body: "Generate posts, captions, and strategy in seconds.",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="relative px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-white/80 glass-panel shadow-glass p-8 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="relative flex justify-center lg:col-span-5">
              <div className="relative flex aspect-square w-full max-w-md items-center justify-center overflow-hidden rounded-2xl border border-brand-primary/10 bg-gradient-to-br from-brand-primary/10 via-brand-soft/20 to-brand-light/30 p-8">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "radial-gradient(#DC586D 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />
                <div className="relative z-10 flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-3xl border border-brand-primary/30 bg-brand-darkest text-white shadow-2xl">
                  <Cpu className="h-10 w-10 text-brand-soft" />
                  <span className="text-[10px] font-bold tracking-widest text-brand-light uppercase">
                    MetaPulse Engine
                  </span>
                </div>

                <div className="absolute top-6 left-6 flex items-center gap-2 rounded-2xl glass-panel p-3 text-xs font-bold text-brand-text shadow-md">
                  <Share2 className="h-4 w-4 text-brand-primary" /> Social
                  Channels
                </div>
                <div className="absolute right-6 bottom-6 flex items-center gap-2 rounded-2xl glass-panel p-3 text-xs font-bold text-brand-text shadow-md">
                  <BarChart3 className="h-4 w-4 text-brand-secondary" />{" "}
                  Real-time Data
                </div>
                <div className="absolute top-1/2 -right-2 flex -translate-y-1/2 transform items-center gap-2 rounded-2xl glass-panel p-3 text-xs font-bold text-brand-text shadow-md">
                  <Users className="h-4 w-4 text-brand-dark" /> Teams
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold tracking-wider text-brand-primary uppercase">
                Centralized Ecosystem
              </div>
              <h2 className="text-3xl leading-tight font-extrabold text-brand-text sm:text-4xl">
                The All-in-One Engine for High-Velocity Marketing
              </h2>
              <p className="text-base leading-relaxed text-brand-muted sm:text-lg">
                MetaPulse centralizes marketing workflows into one AI-powered
                platform where businesses can create content, collaborate with
                teams, automate repetitive work, and monitor campaign
                performance.
              </p>

              <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
                {HIGHLIGHTS.map((h) => (
                  <div key={h.title} className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-brand-text">
                        {h.title}
                      </h4>
                      <p className="mt-0.5 text-xs text-brand-muted">
                        {h.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
