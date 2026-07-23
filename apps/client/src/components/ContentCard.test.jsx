import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContentCard } from "./ContentCard.jsx";

const base = {
  _id: "1",
  platform: "instagram",
  contentType: "post",
  status: "queued",
  draft: null,
  complianceResult: null,
  qualityResult: null,
};

describe("ContentCard", () => {
  it('shows a "Generating…" placeholder before a draft exists', () => {
    render(<ContentCard item={base} />);
    expect(screen.getByText(/generating/i)).toBeInTheDocument();
  });

  it("renders the draft body once one exists", () => {
    render(
      <ContentCard
        item={{ ...base, draft: { body: "Try our new seasonal latte!" } }}
      />,
    );
    expect(screen.getByText("Try our new seasonal latte!")).toBeInTheDocument();
  });

  it("shows the fallback warning when the draft used the deterministic fallback", () => {
    render(
      <ContentCard
        item={{ ...base, draft: { body: "x", usedFallback: true } }}
      />,
    );
    expect(screen.getByText(/without AI/i)).toBeInTheDocument();
  });

  it("does not show the fallback warning when AI actually produced the draft", () => {
    render(
      <ContentCard
        item={{ ...base, draft: { body: "x", usedFallback: false } }}
      />,
    );
    expect(screen.queryByText(/without AI/i)).not.toBeInTheDocument();
  });

  it("lists compliance issues when present", () => {
    render(
      <ContentCard
        item={{
          ...base,
          draft: { body: "x" },
          complianceResult: {
            issues: ['Contains restricted term: "clinical"'],
          },
        }}
      />,
    );
    expect(screen.getByText(/clinical/)).toBeInTheDocument();
  });

  it('shows the "Needs review" label for in_review status, not a generic rejection label', () => {
    render(
      <ContentCard
        item={{ ...base, status: "in_review", draft: { body: "x" } }}
      />,
    );
    expect(screen.getByText("Needs review")).toBeInTheDocument();
  });

  it('shows "Approved" and "Rejected" labels for their respective statuses', () => {
    const { rerender } = render(
      <ContentCard
        item={{ ...base, status: "approved", draft: { body: "x" } }}
      />,
    );
    expect(screen.getByText("Approved")).toBeInTheDocument();

    rerender(
      <ContentCard
        item={{ ...base, status: "rejected", draft: { body: "x" } }}
      />,
    );
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });
});
