import { Zap } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-brand-primary/10 px-4 py-12 text-xs text-brand-muted sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary font-bold text-white">
            <Zap className="h-4 w-4" />
          </div>
          <span className="text-lg font-extrabold text-brand-text">
            Meta<span className="text-brand-primary">Pulse</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-6 font-semibold">
          <a
            href="https://github.com"
            className="transition-colors hover:text-brand-primary"
          >
            GitHub
          </a>
          <a
            href="#about"
            className="transition-colors hover:text-brand-primary"
          >
            Documentation
          </a>
          <a
            href="https://linkedin.com"
            className="transition-colors hover:text-brand-primary"
          >
            LinkedIn
          </a>
          <a
            href="mailto:hello@metapulse.ai"
            className="transition-colors hover:text-brand-primary"
          >
            Email
          </a>
        </div>

        <div>© 2026 MetaPulse. AI Marketing Platform.</div>
      </div>
    </footer>
  );
}
