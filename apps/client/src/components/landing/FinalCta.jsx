import { Link } from "react-router-dom";

export function FinalCta() {
  return (
    <section className="relative px-4 py-20 sm:px-8">
      <div className="relative mx-auto max-w-5xl space-y-8 overflow-hidden rounded-3xl glass-panel-dark p-10 text-center shadow-2xl sm:p-16">
        <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-brand-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-brand-soft/20 blur-3xl" />

        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Ready to Transform Your Marketing?
        </h2>
        <p className="mx-auto max-w-xl text-base leading-relaxed text-brand-soft/80 sm:text-lg">
          Start using AI to automate your workflow today. Join forward-thinking
          teams using MetaPulse.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
          <Link
            to="/signup"
            className="w-full rounded-2xl gradient-btn px-8 py-4 font-semibold text-white shadow-lg sm:w-auto"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="w-full rounded-2xl border border-white/20 bg-white/10 px-8 py-4 font-semibold text-white transition-all hover:bg-white/20 sm:w-auto"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}
