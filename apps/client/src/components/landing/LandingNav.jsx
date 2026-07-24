import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "Workflow" },
  { href: "#tech", label: "Architecture" },
  { href: "#about", label: "About" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 px-4 py-4 transition-all duration-300 sm:px-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl glass-panel shadow-glass px-6 py-3.5">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-dark text-white shadow-md shadow-brand-primary/20 transition-transform duration-300 group-hover:scale-105">
            <Zap className="h-5 w-5 fill-white/20" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-brand-text">
            Meta<span className="text-brand-primary">Pulse</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-brand-muted md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-brand-primary"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden px-4 py-2 text-sm font-semibold text-brand-text transition-colors hover:text-brand-primary sm:block"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="gradient-btn rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
