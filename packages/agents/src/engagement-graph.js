import { StateGraph, StateSchema, END, START } from "@langchain/langgraph";
import { z } from "zod";
import {
  sentimentResultSchema,
  intentResultSchema,
  entitiesResultSchema,
} from "@metapulse/schemas";
import { CommentEvent } from "@metapulse/db";
import { RunRecorder } from "./run-recorder.js";
import {
  sentimentFallback,
  intentFallback,
  entitiesFallback,
} from "./fallbacks.js";

const EngagementGraphState = new StateSchema({
  commentText: z.string(),
  sentiment: z.any().nullable().default(null),
  intent: z.any().nullable().default(null),
  entities: z.any().nullable().default(null),
  leadScore: z.any().nullable().default(null),
});

/** Every triage task follows this exact shape: try the router, fall back on ANY failure, never throw. */
async function runTriageTask({ task, prompt, schema, router, fallback }) {
  try {
    const { data } = await router.complete(task, {
      system:
        "Classify the following social media comment. Return only the requested structure.",
      prompt,
      schema,
    });
    return { ...data, usedFallback: false };
  } catch {
    return fallback();
  }
}

export function buildEngagementGraph({ router, recorder }) {
  async function triageNode(state) {
    const triage = await recorder.recordNode("triage", state, async () => {
      // allSettled, not all — runTriageTask itself never rejects, but this
      // is the belt-and-suspenders layer: a bug in one task's own
      // try/catch must not be able to take the other two results down
      // with it. Sentiment, intent, and entities are independent
      // signals; losing one shouldn't cost you the other two.
      const [sentimentSettled, intentSettled, entitiesSettled] =
        await Promise.allSettled([
          runTriageTask({
            task: "comment-triage",
            prompt: `Sentiment of this comment: "${state.commentText}"`,
            schema: sentimentResultSchema,
            router,
            fallback: () => sentimentFallback(state.commentText),
          }),
          runTriageTask({
            task: "comment-triage",
            prompt: `Intent behind this comment: "${state.commentText}"`,
            schema: intentResultSchema,
            router,
            fallback: () => intentFallback(state.commentText),
          }),
          runTriageTask({
            task: "comment-triage",
            prompt: `Entities mentioned in this comment: "${state.commentText}"`,
            schema: entitiesResultSchema,
            router,
            fallback: () => entitiesFallback(state.commentText),
          }),
        ]);

      const sentiment =
        sentimentSettled.status === "fulfilled"
          ? sentimentSettled.value
          : sentimentFallback(state.commentText);
      const intent =
        intentSettled.status === "fulfilled"
          ? intentSettled.value
          : intentFallback(state.commentText);
      const entities =
        entitiesSettled.status === "fulfilled"
          ? entitiesSettled.value
          : entitiesFallback(state.commentText);

      return {
        sentiment,
        intent,
        entities,
        usedFallback:
          sentiment.usedFallback ||
          intent.usedFallback ||
          entities.usedFallback,
      };
    });
    return {
      sentiment: triage.sentiment,
      intent: triage.intent,
      entities: triage.entities,
    };
  }

  async function scoreLeadNode(state) {
    const leadScore = await recorder.recordNode("scoreLead", state, async () =>
      scoreLead(state),
    );
    return { leadScore };
  }

  return new StateGraph(EngagementGraphState)
    .addNode("triage", triageNode)
    .addNode("scoreLead", scoreLeadNode)
    .addEdge(START, "triage")
    .addEdge("triage", "scoreLead")
    .addEdge("scoreLead", END)
    .compile();
}

/**
 * Deterministic, not AI-scored — a composite of the three triage
 * signals. Baseline 30, purchase intent is the single strongest
 * positive signal, a complaint or negative sentiment pulls it down.
 * Clamped to 0-100, bucketed into hot/warm/cold for the (Phase 5)
 * Studio UI to sort on.
 */
function scoreLead({ sentiment, intent, entities }) {
  let score = 30;
  if (intent.intent === "purchase_intent") score += 40;
  else if (intent.intent === "question") score += 15;
  else if (intent.intent === "complaint") score -= 10;
  else if (intent.intent === "spam") score -= 30;

  if (sentiment.sentiment === "positive") score += 15;
  else if (sentiment.sentiment === "negative") score -= 15;

  if (entities.mentionsPrice) score += 10;

  score = Math.max(0, Math.min(100, score));
  const tier = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";
  return { value: score, tier };
}

/** Top-level entry point — what the worker (Phase 4) calls per inbound comment. */
export async function runEngagementGraph(
  { router },
  { workspaceId, commentEventId },
) {
  const commentEvent = await CommentEvent.findOne({
    _id: commentEventId,
    workspaceId,
  });
  if (!commentEvent)
    throw new Error(
      `CommentEvent ${commentEventId} not found in workspace ${workspaceId}`,
    );

  const recorder = new RunRecorder({
    workspaceId,
    graphName: "engagement",
    targetType: "comment_event",
    targetId: commentEventId,
  });
  await recorder.start();

  try {
    const graph = buildEngagementGraph({ router, recorder });
    const result = await graph.invoke({
      commentText: commentEvent.commentText,
    });

    commentEvent.triage = {
      sentiment: result.sentiment.sentiment,
      sentimentUsedFallback: result.sentiment.usedFallback,
      intent: result.intent.intent,
      intentUsedFallback: result.intent.usedFallback,
      mentionsPrice: result.entities.mentionsPrice,
      mentionsCompetitor: result.entities.mentionsCompetitor,
      keywords: result.entities.keywords,
      entitiesUsedFallback: result.entities.usedFallback,
    };
    commentEvent.leadScore = result.leadScore;
    commentEvent.processedAt = new Date();
    await commentEvent.save();

    await recorder.complete("completed");
    return commentEvent;
  } catch (err) {
    await recorder.complete("failed", err.message);
    throw err;
  }
}
