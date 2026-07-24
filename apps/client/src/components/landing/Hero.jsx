import { Link } from "react-router-dom";
import {
  ArrowRight,
  PlayCircle,
  Sparkles,
  Bot,
  TrendingUp,
  Bell,
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-12 pb-20 sm:px-8 lg:pt-20 lg:pb-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
        {/* Left column: copy */}
        <div className="space-y-6 text-center lg:col-span-6 lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full glass-panel border-brand-primary/20 px-4 py-1.5 text-xs font-bold text-brand-dark shadow-sm">
            <span className="flex h-2 w-2 animate-ping rounded-full bg-brand-primary" />
            ✨ AI-Powered Marketing Platform
          </div>

          <h1 className="text-4xl leading-[1.15] font-extrabold tracking-tight text-brand-text sm:text-5xl lg:text-6xl">
            Marketing Smarter with{" "}
            <span className="gradient-text">Artificial Intelligence</span>
          </h1>

          <p className="mx-auto max-w-xl text-base leading-relaxed font-normal text-brand-muted sm:text-lg lg:mx-0">
            MetaPulse helps businesses simplify social media marketing through
            intelligent automation, AI-generated content, collaborative
            workspaces, and powerful campaign management tools.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row lg:justify-start">
            <Link
              to="/signup"
              className="group flex w-full items-center justify-center gap-2 rounded-2xl gradient-btn px-8 py-4 font-semibold text-white shadow-lg sm:w-auto"
            >
              Explore Platform
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#workflow"
              className="flex w-full items-center justify-center gap-2 rounded-2xl glass-panel border border-brand-primary/20 px-8 py-4 font-semibold text-brand-text transition-all hover:bg-white sm:w-auto"
            >
              <PlayCircle className="h-4 w-4 text-brand-primary" />
              Get Started
            </a>
          </div>

          <div className="flex items-center justify-center gap-4 pt-6 text-xs font-medium text-brand-muted lg:justify-start">
            <div className="flex -space-x-2">
              {["JD", "SK", "AM"].map((initials, i) => (
                <div
                  key={initials}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white font-bold text-brand-dark ${
                    [
                      "bg-brand-primary/20",
                      "bg-brand-secondary/20",
                      "bg-brand-soft/40",
                    ][i]
                  }`}
                >
                  {initials}
                </div>
              ))}
            </div>
            <span>Trusted by modern marketing teams &amp; agencies</span>
          </div>
        </div>

        {/* Right column: floating mockup */}
        <div className="relative lg:col-span-6">
          <div className="animate-float-slow relative mx-auto max-w-lg rounded-3xl border border-white/60 glass-panel shadow-glass p-4 sm:p-6 lg:max-w-none">
            <div className="mb-4 flex items-center justify-between border-b border-brand-primary/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="rounded-full border border-brand-primary/10 bg-brand-primary/5 px-3 py-1 text-[11px] font-semibold text-brand-muted/70">
                metapulse.ai/workspace/overview
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-7 rounded-2xl border border-brand-primary/10 bg-white/80 p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between">
                  <span className="text-xs font-semibold text-brand-muted">
                    Campaign Engagement
                  </span>
                  <span className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-bold text-green-600">
                    +28.4%
                  </span>
                </div>
                <div className="mb-3 text-2xl font-extrabold text-brand-text">
                  142,890
                </div>
                <div className="flex h-12 items-end gap-1.5 pt-2">
                  {[
                    ["bg-brand-soft/40", "40%"],
                    ["bg-brand-soft/60", "60%"],
                    ["bg-brand-primary/40", "35%"],
                    ["bg-brand-primary/70", "80%"],
                    ["bg-brand-secondary", "65%"],
                    ["bg-brand-primary", "100%"],
                  ].map(([color, height], i) => (
                    <div
                      key={i}
                      className={`w-1/6 rounded-t-sm ${color}`}
                      style={{ height }}
                    />
                  ))}
                </div>
              </div>

              <div className="col-span-5 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-brand-darkest to-brand-dark p-4 text-white shadow-sm">
                <div className="flex items-center justify-between">
                  <Sparkles className="h-5 w-5 text-brand-soft" />
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                    AI Active
                  </span>
                </div>
                <div>
                  <div className="text-xs font-medium text-brand-light">
                    Generated Copy
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs font-semibold">
                    "Boost your reach with automated social triggers..."
                  </div>
                </div>
              </div>

              <div className="col-span-12 flex items-center justify-between gap-4 rounded-2xl border border-brand-primary/10 bg-white/90 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-brand-text">
                      Multi-Platform Campaign
                    </div>
                    <div className="text-[11px] text-brand-muted">
                      LinkedIn, Twitter, Instagram • Scheduled
                    </div>
                  </div>
                </div>
                <span className="rounded-xl bg-brand-primary/10 px-3 py-1.5 text-xs font-bold text-brand-primary">
                  Auto-Posting
                </span>
              </div>
            </div>
          </div>

          <div className="animate-float-medium absolute -top-6 -right-4 z-20 flex items-center gap-3 rounded-2xl border border-white/80 glass-panel shadow-glass p-3.5 sm:right-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-brand-muted">Conversion Rate</div>
              <div className="text-sm font-extrabold text-brand-text">
                4.85% <span className="text-xs text-green-600">↑</span>
              </div>
            </div>
          </div>

          <div
            className="animate-float-medium absolute -bottom-8 -left-4 z-20 flex items-center gap-3 rounded-2xl border border-white/80 glass-panel shadow-glass p-3.5 sm:left-2"
            style={{ animationDelay: "2s" }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-brand-text">
                New Campaign Live
              </div>
              <div className="text-[11px] text-brand-muted">
                Team 'Growth' launched #Q3Launch
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
