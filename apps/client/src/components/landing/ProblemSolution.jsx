import {
  XCircle,
  Minus,
  CheckCircle2,
  Sparkles,
  LayoutDashboard,
  Users,
  Zap,
  LineChart,
} from "lucide-react";

const PROBLEMS = [
  {
    label: "Manual Marketing",
    body: "Hours spent creating repetitive posts manually",
  },
  {
    label: "Multiple Tools",
    body: "Juggling 5-10 apps for graphics, text, and scheduling",
  },
  {
    label: "Poor Collaboration",
    body: "Clunky email threads and missed approvals",
  },
  {
    label: "No Automation",
    body: "Missing key posting times due to manual steps",
  },
  {
    label: "Time Consuming",
    body: "Slow execution draining creative bandwidth",
  },
];

const SOLUTIONS = [
  {
    icon: Sparkles,
    label: "AI Content Engine",
    body: "Generate multi-channel campaigns in seconds",
  },
  {
    icon: LayoutDashboard,
    label: "Central Dashboard",
    body: "Manage strategy, execution, & analytics together",
  },
  {
    icon: Users,
    label: "Workspace Management",
    body: "Seamless multi-user role permissions",
  },
  {
    icon: Zap,
    label: "Smart Automation",
    body: "Set up background publishing workflows",
  },
  {
    icon: LineChart,
    label: "Live Analytics",
    body: "Actionable intelligence for continuous ROI growth",
  },
];

export function ProblemSolution() {
  return (
    <section className="relative px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 className="text-3xl font-extrabold text-brand-text sm:text-4xl">
            Transforming How Teams Work
          </h2>
          <p className="text-base text-brand-muted">
            Say goodbye to fragmented tools and manual overhead. Step into
            streamlined AI automation.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl glass-panel p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 font-bold text-red-600">
                <XCircle className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-brand-text">
                The Old Way (Problems)
              </h3>
            </div>
            <ul className="space-y-4 text-sm font-medium text-brand-muted">
              {PROBLEMS.map((p) => (
                <li
                  key={p.label}
                  className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/50 p-3"
                >
                  <Minus className="h-4 w-4 shrink-0 text-red-500" />
                  <span>
                    <b>{p.label}:</b> {p.body}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-3xl glass-panel shadow-glass p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 font-bold text-green-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-brand-text">
                The MetaPulse Way (Solutions)
              </h3>
            </div>
            <ul className="space-y-4 text-sm font-semibold text-brand-text">
              {SOLUTIONS.map(({ icon: Icon, label, body }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-green-100 bg-white/80 p-3 shadow-sm"
                >
                  <Icon className="h-4 w-4 shrink-0 text-brand-primary" />
                  <span>
                    <b>{label}:</b> {body}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
