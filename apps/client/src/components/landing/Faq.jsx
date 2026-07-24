import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "How does MetaPulse generate AI content?",
    a: "MetaPulse leverages dual LLM integration (Claude AI for nuanced copywriting and Gemini AI for multimodal analytics) orchestrated via LangGraph workflows to generate high-converting, channel-optimized content automatically.",
  },
  {
    q: "Can I manage multiple brand workspaces?",
    a: "Yes! MetaPulse allows agencies and businesses to create distinct, isolated workspaces with individual team member permissions, campaign calendars, and custom social media channels.",
  },
  {
    q: "How are role-based permissions handled?",
    a: "We utilize JWT token authentication paired with role middleware. Workspace Owners can assign Admin, Editor, or Viewer roles to team members to control publishing and account configuration privileges.",
  },
  {
    q: "Are live notifications supported?",
    a: "Yes, Socket.io powers our real-time notification layer, delivering instant alerts when posts are published, comments are left, or team approvals occur.",
  },
];

export function Faq() {
  return (
    <section
      id="faq"
      className="relative bg-brand-primary/5 px-4 py-20 sm:px-8"
    >
      <div className="mx-auto max-w-3xl space-y-12">
        <div className="space-y-3 text-center">
          <h2 className="text-3xl font-extrabold text-brand-text sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-brand-muted">
            Everything you need to know about the MetaPulse engine.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl glass-panel p-6 transition-all duration-300 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between text-sm font-bold text-brand-text sm:text-base">
                <span>{faq.q}</span>
                <ChevronDown className="h-5 w-5 text-brand-primary transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-4 text-xs leading-relaxed text-brand-muted sm:text-sm">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
