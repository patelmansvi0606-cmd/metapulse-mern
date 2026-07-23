import { z } from "zod";

export const COMMENT_PLATFORMS = ["facebook", "instagram", "whatsapp"];
export const SENTIMENTS = ["positive", "neutral", "negative"];
export const INTENTS = [
  "question",
  "complaint",
  "praise",
  "purchase_intent",
  "spam",
  "other",
];
export const LEAD_TIERS = ["hot", "warm", "cold"];

export const triageCommentSchema = z.object({
  workspaceId: z.string().min(1),
  platform: z.enum(COMMENT_PLATFORMS),
  externalCommentId: z.string().min(1),
  commentText: z.string().min(1).max(5000),
});

/** Structured-output contract for the sentiment task (see content.schema.js for why this doubles as the JSON-schema source). */
export const sentimentResultSchema = z.object({
  sentiment: z.enum(SENTIMENTS),
  confidence: z.number().min(0).max(1),
});

export const intentResultSchema = z.object({
  intent: z.enum(INTENTS),
  confidence: z.number().min(0).max(1),
});

export const entitiesResultSchema = z.object({
  mentionsPrice: z.boolean(),
  mentionsCompetitor: z.boolean(),
  keywords: z.array(z.string()).max(8).default([]),
});
