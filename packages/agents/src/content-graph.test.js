import { describe, it, expect, vi } from "vitest";
import { buildContentGraph } from "./content-graph.js";
import { ProviderUnavailableError, IntegrationError } from "@metapulse/db";

const brief = {
  name: "Acme Coffee",
  industry: "coffee roasting",
  targetAudience: "young professionals",
  tone: "warm",
  goals: "grow foot traffic",
  restrictedTopics: ["clinical"],
};

// recordNode just runs the node fn directly — no Mongoose, no DB. The
// graph's own routing/fallback logic is what's under test here, not
// RunRecorder's persistence (that's covered separately, and needs a
// real Mongo instance to test for real).
const fakeRecorder = { recordNode: (_name, state, fn) => fn(state) };

function mockRouter(responses) {
  return { complete: vi.fn(async (task) => responses[task]()) };
}

describe("Content Graph — happy path", () => {
  it("routes to approved when every AI call genuinely succeeds", async () => {
    const router = mockRouter({
      research: async () => ({
        data: { summary: "s", keyPoints: ["a"], sources: [] },
      }),
      "content-drafting": async () => ({
        data: { body: "great coffee", hashtags: ["#coffee"] },
      }),
      "compliance-check": async () => ({ data: { passed: true, issues: [] } }),
      "quality-review": async () => ({
        data: { approved: true, feedback: "ready" },
      }),
    });
    const graph = buildContentGraph({ router, recorder: fakeRecorder });
    const result = await graph.invoke({ brief });

    expect(result.finalStatus).toBe("approved");
    expect(result.complianceResult.usedFallback).toBe(false);
    expect(result.qualityResult.usedFallback).toBe(false);
  });
});

describe("Content Graph — total AI outage (zero providers configured)", () => {
  it("routes to in_review, NOT rejected, even though the compliance fallback sets passed:false", async () => {
    const router = mockRouter({
      research: async () => {
        throw new ProviderUnavailableError("no provider for research");
      },
      "content-drafting": async () => {
        throw new ProviderUnavailableError("no provider for content-drafting");
      },
      "compliance-check": async () => {
        throw new ProviderUnavailableError("no provider for compliance-check");
      },
      "quality-review": async () => {
        throw new ProviderUnavailableError("no provider for quality-review");
      },
    });
    const graph = buildContentGraph({ router, recorder: fakeRecorder });
    const result = await graph.invoke({ brief });

    // The pipeline still produces a usable draft via the optimistic fallbacks...
    expect(result.research.usedFallback).toBe(true);
    expect(result.draft.usedFallback).toBe(true);
    expect(result.draft.body.length).toBeGreaterThan(0);
    // ...and the conservative fallbacks correctly default to a non-pass...
    expect(result.complianceResult.passed).toBe(false);
    expect(result.qualityResult.approved).toBe(false);
    // ...but because BOTH used a fallback (not a real check), this is a
    // review case, not a rejection — this is the exact distinction the
    // whole port is built around.
    expect(result.finalStatus).toBe("in_review");
  });
});

describe("Content Graph — a REAL compliance failure (not a fallback)", () => {
  it("routes to rejected when the AI compliance check genuinely finds a violation", async () => {
    const router = mockRouter({
      research: async () => ({
        data: { summary: "s", keyPoints: ["a"], sources: [] },
      }),
      "content-drafting": async () => ({
        data: { body: "our coffee clinically cures anxiety", hashtags: [] },
      }),
      "compliance-check": async () => ({
        data: { passed: false, issues: ["unsubstantiated health claim"] },
      }),
      "quality-review": async () => ({
        data: { approved: true, feedback: "ready" },
      }),
    });
    const graph = buildContentGraph({ router, recorder: fakeRecorder });
    const result = await graph.invoke({ brief });

    expect(result.complianceResult.usedFallback).toBe(false); // a REAL check ran
    expect(result.complianceResult.passed).toBe(false);
    expect(result.finalStatus).toBe("rejected"); // genuinely failed, not sent for review
  });
});

describe("Content Graph — optimistic nodes do not swallow real model errors", () => {
  it("a non-ProviderUnavailableError from research propagates instead of falling back", async () => {
    const router = mockRouter({
      research: async () => {
        throw new IntegrationError(
          "the model returned malformed output twice in a row",
        );
      },
    });
    const graph = buildContentGraph({ router, recorder: fakeRecorder });

    await expect(graph.invoke({ brief })).rejects.toThrow("malformed output");
  });
});

describe("Content Graph — mixed case: fallback fires on ONE node only", () => {
  it("quality-review fallback alone is still enough to force in_review, even with a real passing compliance check", async () => {
    const router = mockRouter({
      research: async () => ({
        data: { summary: "s", keyPoints: ["a"], sources: [] },
      }),
      "content-drafting": async () => ({
        data: { body: "great coffee", hashtags: [] },
      }),
      "compliance-check": async () => ({ data: { passed: true, issues: [] } }),
      "quality-review": async () => {
        throw new IntegrationError("quality model unavailable");
      },
    });
    const graph = buildContentGraph({ router, recorder: fakeRecorder });
    const result = await graph.invoke({ brief });

    expect(result.complianceResult.usedFallback).toBe(false);
    expect(result.qualityResult.usedFallback).toBe(true);
    expect(result.finalStatus).toBe("in_review");
  });
});
