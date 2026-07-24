import {
  LayoutDashboard,
  Sparkles,
  Calendar,
  BarChart2,
  Users,
  Search,
  Bell,
  Plus,
  Bot,
  Send,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Sparkles, label: "AI Studio" },
  { icon: Calendar, label: "Campaigns" },
  { icon: BarChart2, label: "Analytics" },
  { icon: Users, label: "Team Roles" },
];

const STATS = [
  {
    label: "Total Audience Reach",
    value: "284.5K",
    note: "↑ +14.2% this month",
    noteColor: "text-green-600",
  },
  {
    label: "AI Content Generated",
    value: "1,420",
    note: "98% Auto-Approved",
    noteColor: "text-brand-primary",
  },
  {
    label: "Active Workspaces",
    value: "8",
    note: "3 Teams Active",
    noteColor: "text-brand-muted",
  },
  {
    label: "Avg Engagement",
    value: "6.8%",
    note: "↑ +2.1% benchmark",
    noteColor: "text-green-600",
  },
];

const CAMPAIGNS = [
  {
    name: "Q3 Product Rebrand",
    platform: "LinkedIn, Twitter",
    status: "Active",
    engagement: "12.4k clicks",
  },
  {
    name: "AI Automation Launch",
    platform: "Instagram, TikTok",
    status: "Scheduled",
    engagement: "--",
  },
  {
    name: "Customer Stories Series",
    platform: "Blog, Newsletter",
    status: "Active",
    engagement: "8.1k reads",
  },
];

/** Purely illustrative — a polished "here's what it looks like" preview, not the live app. */
export function DashboardPreview() {
  return (
    <section id="dashboard-preview" className="relative px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold tracking-wider text-brand-primary uppercase">
            Live Platform Preview
          </div>
          <h2 className="text-3xl font-extrabold text-brand-text sm:text-4xl">
            Designed for Absolute Clarity
          </h2>
          <p className="text-base text-brand-muted">
            Explore the unified interface that powers your entire marketing
            workspace.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/80 glass-panel p-3 shadow-2xl sm:p-6">
          <div className="grid min-h-[600px] grid-cols-12 overflow-hidden rounded-2xl border border-brand-primary/10 bg-white shadow-sm">
            {/* Sidebar */}
            <div className="col-span-12 flex flex-col justify-between border-r border-white/10 bg-brand-darkest p-4 text-white lg:col-span-2">
              <div className="space-y-6">
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-2 py-1.5 text-xs font-bold">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-primary text-white">
                    M
                  </div>
                  <span className="truncate">MetaPulse HQ</span>
                </div>

                <div className="space-y-1 text-xs">
                  {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 font-medium transition-colors ${
                        active
                          ? "bg-brand-primary font-semibold text-white"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <Icon className="h-4 w-4" /> {label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-white/10 pt-4 text-xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft font-extrabold text-brand-darkest">
                  JS
                </div>
                <div className="truncate">
                  <div className="font-bold">John Smith</div>
                  <div className="text-[10px] text-white/50">Admin</div>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="col-span-12 space-y-6 bg-brand-bg/40 p-4 sm:p-6 lg:col-span-10">
              <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
                <div className="relative w-64">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-brand-muted" />
                  <input
                    type="text"
                    disabled
                    placeholder="Search campaigns, content..."
                    className="w-full rounded-xl border border-brand-primary/10 bg-white py-1.5 pr-4 pl-9 text-xs focus:ring-2 focus:ring-brand-primary/20 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative rounded-xl border border-brand-primary/10 bg-white p-2 text-brand-muted">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand-primary" />
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl gradient-btn px-4 py-2 text-xs font-semibold text-white"
                  >
                    <Plus className="h-3.5 w-3.5" /> New Campaign
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                {STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-brand-primary/10 bg-white p-4 shadow-sm"
                  >
                    <div className="text-xs font-medium text-brand-muted">
                      {stat.label}
                    </div>
                    <div className="mt-1 text-xl font-extrabold text-brand-text">
                      {stat.value}
                    </div>
                    <div
                      className={`mt-1 text-[10px] font-bold ${stat.noteColor}`}
                    >
                      {stat.note}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-4 rounded-2xl border border-brand-primary/10 bg-white p-5 shadow-sm lg:col-span-8">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-brand-text">
                      Active Campaigns
                    </h4>
                    <span className="cursor-pointer text-xs font-semibold text-brand-primary">
                      View All
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-brand-primary/10 text-[11px] text-brand-muted uppercase">
                          <th className="py-2">Campaign</th>
                          <th className="py-2">Platform</th>
                          <th className="py-2">Status</th>
                          <th className="py-2">Engagement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-primary/5 text-xs">
                        {CAMPAIGNS.map((c) => (
                          <tr key={c.name}>
                            <td className="py-3 font-semibold text-brand-text">
                              {c.name}
                            </td>
                            <td className="py-3 text-brand-muted">
                              {c.platform}
                            </td>
                            <td className="py-3">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  c.status === "Active"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-brand-primary/10 text-brand-primary"
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="py-3 font-bold text-brand-text">
                              {c.engagement}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-col justify-between space-y-4 rounded-2xl bg-gradient-to-br from-brand-darkest to-brand-dark p-5 text-white shadow-sm lg:col-span-4">
                  <div>
                    <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                      <Bot className="h-5 w-5 text-brand-soft" />
                      <h4 className="text-xs font-bold text-white">
                        MetaPulse Copilot
                      </h4>
                    </div>
                    <div className="mt-3 space-y-3 text-xs">
                      <div className="rounded-xl bg-white/10 p-2.5 text-white/80">
                        "I've generated 5 LinkedIn variations based on your
                        recent analytics spike."
                      </div>
                      <div className="rounded-xl border border-brand-primary/40 bg-brand-primary/30 p-2.5 font-medium text-white">
                        ✨ Action Suggested: Post option #2 tomorrow at 9:00 AM
                        EST for optimal reach.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      disabled
                      placeholder="Ask AI to draft..."
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                    />
                    <button
                      type="button"
                      className="rounded-xl bg-brand-primary p-2 text-white"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
