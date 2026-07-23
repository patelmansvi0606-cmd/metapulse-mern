import { describe, it, expect, vi } from "vitest";
import { buildEngagementGraph } from "./engagement-graph.js";
import { ProviderUnavailableError } from "@metapulse/db";

const fakeRecorder = { recordNode: (_name, state, fn) => fn(state) };

function mockRouter(impl) {
  return { complete: vi.fn(impl) };
}

describe("Engagement Graph — happy path", () => {
  it("scores a clear purchase-intent, positive-sentiment comment as hot", async () => {
    let call = 0;
    const router = mockRouter(async (_task, { prompt }) => {
      call += 1;
      if (prompt.includes("Sentiment"))
        return { data: { sentiment: "positive", confidence: 0.9 } };
      if (prompt.includes("Intent"))
        return { data: { intent: "purchase_intent", confidence: 0.9 } };
      return {
        data: {
          mentionsPrice: true,
          mentionsCompetitor: false,
          keywords: ["price"],
        },
      };
    });
    const graph = buildEngagementGraph({ router, recorder: fakeRecorder });
    const result = await graph.invoke({
      commentText: "Love this! What is the price?",
    });

    expect(result.leadScore.tier).toBe("hot");
    expect(call).toBe(3); // all three triage tasks actually ran
  });
});

describe("Engagement Graph — one provider outage does not null out the other two signals", () => {
  it("sentiment fails, intent and entities still succeed via the real AI call", async () => {
    const router = mockRouter(async (_task, { prompt }) => {
      if (prompt.includes("Sentiment"))
        throw new ProviderUnavailableError("down");
      if (prompt.includes("Intent"))
        return { data: { intent: "purchase_intent", confidence: 0.9 } };
      return {
        data: { mentionsPrice: true, mentionsCompetitor: false, keywords: [] },
      };
    });
    const graph = buildEngagementGraph({ router, recorder: fakeRecorder });
    const result = await graph.invoke({
      commentText: "irrelevant text for this test",
    });

    expect(result.sentiment.usedFallback).toBe(true); // fell back
    expect(result.intent.usedFallback).toBe(false); // NOT affected by sentiment's failure
    expect(result.entities.usedFallback).toBe(false); // NOT affected either
    expect(result.intent.intent).toBe("purchase_intent");
  });
});

describe("Engagement Graph — total outage still produces a usable (if low-confidence) score", () => {
  it("all three tasks fall back to keyword heuristics, never throws", async () => {
    const router = mockRouter(async () => {
      throw new ProviderUnavailableError("nothing configured");
    });
    const graph = buildEngagementGraph({ router, recorder: fakeRecorder });
    const result = await graph.invoke({
      commentText: "This is terrible, I want a refund",
    });

    expect(result.sentiment.usedFallback).toBe(true);
    expect(result.intent.usedFallback).toBe(true);
    expect(result.entities.usedFallback).toBe(true);
    expect(result.intent.intent).toBe("complaint"); // keyword heuristic still catches this
    expect(result.leadScore.value).toBeLessThan(30); // negative sentiment + complaint pulls the baseline down
  });
});
