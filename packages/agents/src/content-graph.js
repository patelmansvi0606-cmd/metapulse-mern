import { StateGraph, StateSchema, END, START } from "@langchain/langgraph";
import { z } from "zod";
import {
  researchResultSchema,
  contentDraftSchema,
  complianceResultSchema,
  qualityResultSchema,
} from "@metapulse/schemas";
import { ProviderUnavailableError, ContentItem } from "@metapulse/db";
import { RunRecorder } from "./run-recorder.js";
import {
  researchFallback,
  contentDraftingFallback,
  complianceFallback,
  qualityReviewFallback,
} from "./fallbacks.js";

const ContentGraphState = new StateSchema({
  brief: z.any(),
  research: z.any().nullable().default(null),
  draft: z.any().nullable().default(null),
  complianceResult: z.any().nullable().default(null),
  qualityResult: z.any().nullable().default(null),
  finalStatus: z.string().nullable().default(null),
});

/**
 * routeApproval is where the whole point of this port comes together.
 * `genuinelyFailed` deliberately excludes anything where usedFallback
 * is true — a conservative fallback's passed:false is not the same
 * claim as a real compliance check's passed:false, and conflating them
 * would turn "we couldn't check this" into "we checked this and it's
 * bad," which is a worse failure mode than either alone.
 */
function routeApproval(state) {
  const genuinelyFailed =
    (!state.complianceResult.passed && !state.complianceResult.usedFallback) ||
    (!state.qualityResult.approved && !state.qualityResult.usedFallback);
  if (genuinelyFailed) return "rejected";

  const needsReview =
    state.complianceResult.usedFallback || state.qualityResult.usedFallback;
  if (needsReview) return "needsReview";

  return "approved";
}

/**
 * @param {{ router: import('@metapulse/model-router').ModelRouter, recorder: RunRecorder }} deps
 */
export function buildContentGraph({ router, recorder }) {
  async function researchNode(state) {
    const research = await recorder.recordNode("research", state, async () => {
      try {
        const { data } = await router.complete("research", {
          system:
            "You are a marketing researcher. Given a brand brief, summarize what a content writer needs to know before drafting a social post: who the audience is, what tone to strike, and 2-6 concrete angles worth writing about.",
          prompt: `Brand: ${state.brief.name}\nIndustry: ${state.brief.industry}\nTarget audience: ${state.brief.targetAudience}\nTone: ${state.brief.tone}\nGoal: ${state.brief.goals}`,
          schema: researchResultSchema,
        });
        return { ...data, usedFallback: false };
      } catch (err) {
        // Optimistic node: only a confirmed "nothing is configured" falls
        // back silently. Any other failure (the model actually ran and
        // something went wrong) surfaces — see fallbacks.js for why.
        if (err instanceof ProviderUnavailableError)
          return researchFallback(state.brief);
        throw err;
      }
    });
    return { research };
  }

  async function contentDraftingNode(state) {
    const draft = await recorder.recordNode(
      "contentDrafting",
      state,
      async () => {
        try {
          const { data } = await router.complete("content-drafting", {
            system: `You write social copy for ${state.brief.name}, a ${state.brief.industry} brand. Tone: ${state.brief.tone}. Stay under the platform's caption limits.`,
            prompt: `Research notes:\n${state.research.summary}\nKey points: ${state.research.keyPoints.join("; ")}\n\nWrite one post.`,
            schema: contentDraftSchema,
          });
          return { ...data, usedFallback: false };
        } catch (err) {
          if (err instanceof ProviderUnavailableError)
            return contentDraftingFallback(state.brief, state.research);
          throw err;
        }
      },
    );
    return { draft };
  }

  async function complianceCheckNode(state) {
    const complianceResult = await recorder.recordNode(
      "complianceCheck",
      state,
      async () => {
        try {
          const { data } = await router.complete("compliance-check", {
            system: `Check the draft against this brand's restricted topics: ${state.brief.restrictedTopics.join(", ") || "(none listed)"}. Flag anything that violates them or reads as a regulated claim (medical, financial, or legal promises) the brand shouldn't make.`,
            prompt: state.draft.body,
            schema: complianceResultSchema,
          });
          return { ...data, usedFallback: false };
        } catch {
          // Conservative node: ANY failure falls back — not just
          // ProviderUnavailableError. A model error here gets the same
          // "needs a human" treatment as no provider being configured at
          // all, because the one thing this node must never do is guess
          // optimistically about compliance.
          return complianceFallback(state.brief, state.draft);
        }
      },
    );
    return { complianceResult };
  }

  async function qualityReviewNode(state) {
    const qualityResult = await recorder.recordNode(
      "qualityReview",
      state,
      async () => {
        try {
          const { data } = await router.complete("quality-review", {
            system: `Review this draft for ${state.brief.name} against its intended tone (${state.brief.tone}) and goal (${state.brief.goals}). Approve only if it's genuinely ready to publish as-is.`,
            prompt: state.draft.body,
            schema: qualityResultSchema,
          });
          return { ...data, usedFallback: false };
        } catch {
          return qualityReviewFallback();
        }
      },
    );
    return { qualityResult };
  }

  const graph = new StateGraph(ContentGraphState)
    .addNode("runResearch", researchNode)
    .addNode("contentDrafting", contentDraftingNode)
    .addNode("complianceCheck", complianceCheckNode)
    .addNode("qualityReview", qualityReviewNode)
    .addNode("approved", () => ({ finalStatus: "approved" }))
    .addNode("needsReview", () => ({ finalStatus: "in_review" }))
    .addNode("rejected", () => ({ finalStatus: "rejected" }))
    .addEdge(START, "runResearch")
    .addEdge("runResearch", "contentDrafting")
    .addEdge("contentDrafting", "complianceCheck")
    .addEdge("complianceCheck", "qualityReview")
    .addConditionalEdges("qualityReview", routeApproval)
    .addEdge("approved", END)
    .addEdge("needsReview", END)
    .addEdge("rejected", END)
    .compile();

  return graph;
}

/**
 * Top-level entry point — what the worker (Phase 4) calls per job.
 * Loads the ContentItem + its BrandBrief, runs the graph, writes every
 * stage's result back to the ContentItem, and records the run via
 * RunRecorder regardless of how the run ends.
 */
export async function runContentGraph(
  { router },
  { workspaceId, contentItemId },
) {
  const contentItem = await ContentItem.findOne({
    _id: contentItemId,
    workspaceId,
  }).populate("briefId");
  if (!contentItem)
    throw new Error(
      `ContentItem ${contentItemId} not found in workspace ${workspaceId}`,
    );

  const recorder = new RunRecorder({
    workspaceId,
    graphName: "content",
    targetType: "content_item",
    targetId: contentItemId,
  });
  await recorder.start();

  try {
    const graph = buildContentGraph({ router, recorder });
    const result = await graph.invoke({
      brief: contentItem.briefId.toObject(),
    });

    contentItem.research = result.research;
    contentItem.draft = result.draft;
    contentItem.complianceResult = result.complianceResult;
    contentItem.qualityResult = result.qualityResult;
    contentItem.status = result.finalStatus;
    await contentItem.save();

    await recorder.complete("completed");
    return contentItem;
  } catch (err) {
    contentItem.status = "rejected"; // a genuine, unrecovered failure — surfaced, not hidden as any other status
    await contentItem.save();
    await recorder.complete("failed", err.message);
    throw err;
  }
}
