import { LandingNav } from "../components/landing/LandingNav.jsx";
import { Hero } from "../components/landing/Hero.jsx";
import { AboutSection } from "../components/landing/AboutSection.jsx";
import { ProblemSolution } from "../components/landing/ProblemSolution.jsx";
import { Workflow } from "../components/landing/Workflow.jsx";
import { Features } from "../components/landing/Features.jsx";
import { TechStack } from "../components/landing/TechStack.jsx";
import { DashboardPreview } from "../components/landing/DashboardPreview.jsx";
import { Timeline } from "../components/landing/Timeline.jsx";
import { Faq } from "../components/landing/Faq.jsx";
import { FinalCta } from "../components/landing/FinalCta.jsx";
import { LandingFooter } from "../components/landing/Footer.jsx";

export function LandingPage() {
  return (
    <div className="relative antialiased selection:bg-brand-soft selection:text-brand-darkest">
      {/* Ambient background shapes */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-glow absolute -top-[20%] -left-[10%] h-[50vw] w-[50vw] rounded-full bg-gradient-to-br from-brand-soft/20 to-brand-light/30 blur-[120px]" />
        <div
          className="animate-glow absolute top-[40%] -right-[15%] h-[45vw] w-[45vw] rounded-full bg-gradient-to-br from-brand-primary/15 to-brand-dark/10 blur-[140px]"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="animate-glow absolute -bottom-[10%] left-[20%] h-[40vw] w-[40vw] rounded-full bg-gradient-to-tr from-brand-light/30 to-brand-soft/20 blur-[130px]"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <LandingNav />
      <Hero />
      <AboutSection />
      <ProblemSolution />
      <Workflow />
      <Features />
      <TechStack />
      <DashboardPreview />
      <Timeline />
      <Faq />
      <FinalCta />
      <LandingFooter />
    </div>
  );
}
