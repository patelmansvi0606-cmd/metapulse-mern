<<<<<<< HEAD
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
=======
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
>>>>>>> 64c3c44eb5acaf338a9cfcb7bf034ad0b9d71942
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

<<<<<<< HEAD
  it("lists compliance issues when present, for a rejected item", () => {
=======
  it("lists compliance issues when present", () => {
>>>>>>> 64c3c44eb5acaf338a9cfcb7bf034ad0b9d71942
    render(
      <ContentCard
        item={{
          ...base,
<<<<<<< HEAD
          status: "rejected",
          draft: { body: "x" },
          complianceResult: {
            passed: false,
            usedFallback: false,
=======
          draft: { body: "x" },
          complianceResult: {
>>>>>>> 64c3c44eb5acaf338a9cfcb7bf034ad0b9d71942
            issues: ['Contains restricted term: "clinical"'],
          },
        }}
      />,
    );
    expect(screen.getByText(/clinical/)).toBeInTheDocument();
  });

<<<<<<< HEAD
  it("shows quality-review feedback for a rejected item — this is the gap that prompted this fix", () => {
    render(
      <ContentCard
        item={{
          ...base,
          status: "rejected",
          draft: { body: "x" },
          complianceResult: { passed: true, usedFallback: false, issues: [] },
          qualityResult: {
            approved: false,
            usedFallback: false,
            feedback: "Tone reads too formal for this brand's playful voice.",
          },
        }}
      />,
    );
    expect(screen.getByText(/too formal/)).toBeInTheDocument();
    expect(screen.getByText("Quality review:")).toBeInTheDocument();
  });

  it("does not show the reasoning breakdown for an approved item — keeps clean cards clean", () => {
    render(
      <ContentCard
        item={{
          ...base,
          status: "approved",
          draft: { body: "x" },
          complianceResult: { passed: true, usedFallback: false, issues: [] },
          qualityResult: {
            approved: true,
            usedFallback: false,
            feedback: "Ready to publish.",
          },
        }}
      />,
    );
    expect(screen.queryByText(/ready to publish/i)).not.toBeInTheDocument();
  });

=======
>>>>>>> 64c3c44eb5acaf338a9cfcb7bf034ad0b9d71942
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
<<<<<<< HEAD

  it("shows Approve/Reject buttons for an in_review item when onDecide is provided", () => {
    render(
      <ContentCard
        item={{ ...base, status: "in_review", draft: { body: "x" } }}
        onDecide={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
  });

  it("does not show action buttons for an approved item — nothing left to decide", () => {
    render(
      <ContentCard
        item={{ ...base, status: "approved", draft: { body: "x" } }}
        onDecide={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Approve" }),
    ).not.toBeInTheDocument();
  });

  it("does not show action buttons when no onDecide handler is passed", () => {
    render(
      <ContentCard
        item={{ ...base, status: "in_review", draft: { body: "x" } }}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Approve" }),
    ).not.toBeInTheDocument();
  });

  it("still allows Approve on a rejected item — a human can override a genuine AI rejection", () => {
    render(
      <ContentCard
        item={{ ...base, status: "rejected", draft: { body: "x" } }}
        onDecide={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });

  it("clicking Approve calls onDecide with the item id and 'approved'", async () => {
    const onDecide = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <ContentCard
        item={{ ...base, status: "in_review", draft: { body: "x" } }}
        onDecide={onDecide}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Approve" }));
    expect(onDecide).toHaveBeenCalledWith("1", "approved");
  });

  it("shows an error message inline if the decision fails, without crashing", async () => {
    const onDecide = vi.fn().mockRejectedValue(new Error("Network error"));
    const user = userEvent.setup();
    render(
      <ContentCard
        item={{ ...base, status: "in_review", draft: { body: "x" } }}
        onDecide={onDecide}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Reject" }));
    expect(await screen.findByText("Network error")).toBeInTheDocument();
  });
=======
>>>>>>> 64c3c44eb5acaf338a9cfcb7bf034ad0b9d71942
});
