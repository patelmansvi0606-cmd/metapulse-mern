import {
  Sparkles,
  FolderKanban,
  Calendar,
  ShieldCheck,
  LineChart,
  BellRing,
  Users,
  Smartphone,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    color: "primary",
    title: "AI Content Generation",
    body: "Auto-create channel-tailored copy, hashtags, and social creatives using advanced LLMs.",
  },
  {
    icon: FolderKanban,
    color: "secondary",
    title: "Workspace Management",
    body: "Isolate brands, clients, or internal teams into clean, organized workspaces.",
  },
  {
    icon: Calendar,
    color: "dark",
    title: "Campaign Dashboard",
    body: "Plan, edit, and queue posts across all networks from a central calendar interface.",
  },
  {
    icon: ShieldCheck,
    color: "darkest",
    title: "Role Authentication",
    body: "Secure access controls with Admin, Editor, and Viewer permissions powered by JWT.",
  },
  {
    icon: LineChart,
    color: "primary",
    title: "Real-Time Analytics",
    body: "Track impression trends, engagement ratios, and growth metrics in real-time.",
  },
  {
    icon: BellRing,
    color: "secondary",
    title: "Socket.io Notifications",
    body: "Get instant live updates when posts publish or team members comment.",
  },
  {
    icon: Users,
    color: "dark",
    title: "Team Collaboration",
    body: "Inline approvals, direct feedback, and shared media asset libraries for fast reviews.",
  },
  {
    icon: Smartphone,
    color: "darkest",
    title: "Responsive Design",
    body: "Flawless user experience across mobile devices, tablets, and desktop workstations.",
  },
];

const COLOR_CLASSES = {
  primary:
    "bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary",
  secondary:
    "bg-brand-secondary/10 text-brand-secondary group-hover:bg-brand-secondary",
  dark: "bg-brand-dark/10 text-brand-dark group-hover:bg-brand-dark",
  darkest:
    "bg-brand-darkest/10 text-brand-darkest group-hover:bg-brand-darkest",
};

export function Features() {
  return (
    <section id="features" className="relative px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-16">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 className="text-3xl font-extrabold text-brand-text sm:text-4xl">
            Built for Scale &amp; Precision
          </h2>
          <p className="text-base text-brand-muted">
            Eight core modules designed to handle everything from creation to
            execution.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, color, title, body }) => (
            <div
              key={title}
              className="group space-y-4 rounded-3xl glass-panel p-6 transition-all duration-300 hover:shadow-glass-hover hover:-translate-y-1"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors group-hover:text-white ${COLOR_CLASSES[color]}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-text">{title}</h3>
              <p className="text-xs leading-relaxed text-brand-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
