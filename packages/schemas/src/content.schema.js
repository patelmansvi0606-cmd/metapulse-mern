import { z } from "zod";

export const CONTENT_PLATFORMS = ["facebook", "instagram", "whatsapp"];
export const CONTENT_TYPES = ["post", "story", "caption"];
export const BRIEF_TONES = ["professional", "playful", "bold", "warm"];

/**
 * Terminal states a content item can land in. 'in_review' is reserved
 * specifically for "a deterministic fallback fired somewhere in the
 * pipeline" — see fallbacks.js and content-graph.js's routeApproval.
 * It is never set for any other reason.
 */
export const CONTENT_STATUSES = [
  "queued",
  "researching",
  "drafting",
  "compliance_review",
  "quality_review",
  "approved",
  "in_review",
  "rejected",
];

export const createBrandBriefSchema = z.object({
  name: z.string().trim().min(1).max(120),
  industry: z.string().trim().min(1).max(80),
  targetAudience: z.string().trim().min(1).max(300),
  tone: z.enum(BRIEF_TONES),
  goals: z.string().trim().min(1).max(300),
  restrictedTopics: z
    .array(z.string().trim().min(1).max(80))
    .max(50)
    .default([]),
});

export const createContentRunSchema = z.object({
  briefId: z.string().min(1),
  platform: z.enum(CONTENT_PLATFORMS),
  contentType: z.enum(CONTENT_TYPES),
});

/**
 * Everything below is passed as the `schema` argument to
 * router.complete(task, { schema, ... }) — it is simultaneously the
 * runtime validator for the AI's structured output AND (via
 * z.toJSONSchema) the tool input_schema / responseSchema sent to
 * Claude/Gemini. One definition, two consumers — no drift possible
 * between "what we asked for" and "what we validate."
 */

export const researchResultSchema = z.object({
  summary: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).min(1).max(6),
  sources: z.array(z.string()).max(10).default([]),
});

export const contentDraftSchema = z.object({
  body: z.string().min(1).max(2200), // Instagram's caption ceiling is the tightest of the three platforms
  hashtags: z.array(z.string().min(1).max(30)).max(10).default([]),
});

export const complianceResultSchema = z.object({
  passed: z.boolean(),
  issues: z.array(z.string()).default([]),
});

export const qualityResultSchema = z.object({
  approved: z.boolean(),
  feedback: z.string().min(1),
});

/** A human overriding the pipeline's outcome — approving/rejecting directly, whether it landed in in_review or even a genuine AI rejection. */
export const manualReviewDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
<<<<<<< HEAD
});
=======
});
>>>>>>> 64c3c44eb5acaf338a9cfcb7bf034ad0b9d71942
