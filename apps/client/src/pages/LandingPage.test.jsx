import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LandingPage } from "./LandingPage.jsx";

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe("LandingPage", () => {
  it("renders without crashing and shows the main headline", () => {
    renderLanding();
    expect(screen.getByText(/Marketing Smarter with/i)).toBeInTheDocument();
  });

  it("the primary hero CTA links to signup, not a dead anchor", () => {
    renderLanding();
    expect(
      screen.getByRole("link", { name: /Explore Platform/i }),
    ).toHaveAttribute("href", "/signup");
  });

  it("nav Sign In and Get Started link to real auth routes", () => {
    renderLanding();
    const signInLinks = screen.getAllByRole("link", { name: "Sign In" });
    const getStartedLinks = screen.getAllByRole("link", {
      name: "Get Started",
    });
    expect(signInLinks.some((el) => el.getAttribute("href") === "/login")).toBe(
      true,
    );
    expect(
      getStartedLinks.some((el) => el.getAttribute("href") === "/signup"),
    ).toBe(true);
  });

  it("shows all 8 feature cards", () => {
    renderLanding();
    expect(screen.getByText("AI Content Generation")).toBeInTheDocument();
    expect(screen.getByText("Responsive Design")).toBeInTheDocument();
  });

  it("shows the tech stack matching the actual build", () => {
    renderLanding();
    for (const tech of [
      "React",
      "MongoDB",
      "LangGraph",
      "Claude AI",
      "Gemini AI",
    ]) {
      expect(screen.getByText(tech)).toBeInTheDocument();
    }
  });

  it("renders all 4 FAQ questions", () => {
    renderLanding();
    expect(
      screen.getByText("How does MetaPulse generate AI content?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Are live notifications supported?"),
    ).toBeInTheDocument();
  });
});
