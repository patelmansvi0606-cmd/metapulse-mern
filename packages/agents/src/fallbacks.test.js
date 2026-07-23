import { describe, it, expect } from "vitest";
import {
  researchFallback,
  contentDraftingFallback,
  complianceFallback,
  qualityReviewFallback,
  sentimentFallback,
  intentFallback,
  entitiesFallback,
} from "./fallbacks.js";

const brief = {
  name: "Acme Coffee",
  industry: "coffee roasting",
  targetAudience: "young professionals",
  tone: "warm",
  goals: "grow foot traffic",
  restrictedTopics: ["clinical", "cures anxiety"],
};

describe("optimistic fallbacks (research, content-drafting)", () => {
  it("researchFallback always returns usedFallback: true and never throws", () => {
    const result = researchFallback(brief);
    expect(result.usedFallback).toBe(true);
    expect(result.keyPoints.length).toBeGreaterThan(0);
  });

  it("contentDraftingFallback produces a non-empty body derived from the brief", () => {
    const research = researchFallback(brief);
    const draft = contentDraftingFallback(brief, research);
    expect(draft.usedFallback).toBe(true);
    expect(draft.body.length).toBeGreaterThan(0);
    expect(draft.body).toContain("Acme Coffee");
  });
});

describe("conservative fallbacks (compliance, quality) — must NEVER return an optimistic pass", () => {
  it("complianceFallback returns passed:false even when no restricted keyword matches", () => {
    const draft = { body: "Come try our new seasonal latte this week!" };
    const result = complianceFallback(brief, draft);
    expect(result.passed).toBe(false); // conservative default, not "nothing matched so it's fine"
    expect(result.usedFallback).toBe(true);
  });

  it("complianceFallback surfaces the specific matched restricted term in issues", () => {
    const draft = {
      body: "Our coffee clinically cures anxiety, science says so!",
    };
    const result = complianceFallback(brief, draft);
    expect(result.passed).toBe(false);
    expect(result.issues.some((i) => i.includes("clinical"))).toBe(true);
  });

  it("qualityReviewFallback always returns approved:false", () => {
    const result = qualityReviewFallback();
    expect(result.approved).toBe(false);
    expect(result.usedFallback).toBe(true);
  });
});

describe("engagement triage fallbacks", () => {
  it("sentimentFallback detects positive keywords", () => {
    expect(
      sentimentFallback("I absolutely love this, amazing job!").sentiment,
    ).toBe("positive");
  });

  it("sentimentFallback detects negative keywords", () => {
    expect(
      sentimentFallback("This was terrible, worst experience ever").sentiment,
    ).toBe("negative");
  });

  it("sentimentFallback defaults to neutral with no signal either way", () => {
    expect(
      sentimentFallback("What time do you open on Sundays").sentiment,
    ).toBe("neutral");
  });

  it("intentFallback recognizes a purchase-intent question", () => {
    expect(
      intentFallback("What is the price and is it available in store?").intent,
    ).toBe("purchase_intent");
  });

  it('REGRESSION: a price question is purchase_intent, not the generic question catch-all, even though it ends in "?"', () => {
    expect(intentFallback("What's the price?").intent).toBe("purchase_intent");
  });

  it("a plain question with no purchase/complaint signal still falls through to question", () => {
    expect(intentFallback("When are you open on Sundays?").intent).toBe(
      "question",
    );
  });

  it("intentFallback recognizes a complaint", () => {
    expect(intentFallback("This arrived broken, I want a refund").intent).toBe(
      "complaint",
    );
  });

  it("entitiesFallback flags price mentions", () => {
    expect(
      entitiesFallback("How much does the medium size cost?").mentionsPrice,
    ).toBe(true);
  });

  it("every triage fallback is marked usedFallback: true", () => {
    expect(sentimentFallback("x").usedFallback).toBe(true);
    expect(intentFallback("x").usedFallback).toBe(true);
    expect(entitiesFallback("x").usedFallback).toBe(true);
  });
});
