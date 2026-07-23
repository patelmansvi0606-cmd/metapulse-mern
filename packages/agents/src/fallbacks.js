/**
 * Deterministic, non-AI fallbacks for every AI-backed node in both
 * graphs. Every function here returns a plain object shaped like the
 * node's normal AI-produced output, plus `usedFallback: true` — never
 * throws, never calls out to anything, safe to run with zero AI
 * providers configured.
 *
 * The split that matters:
 *
 *   Research & Content Drafting -> OPTIMISTIC. A templated draft that's
 *   merely mediocre is a fine thing to hand a human for editing. There
 *   is no safety reason to hold it back.
 *
 *   Compliance & Quality Review -> CONSERVATIVE, always. These fallbacks
 *   never return passed:true / approved:true — a safety gate that
 *   silently rubber-stamps content nobody actually checked would be a
 *   regression, not resilience. content-graph.js's routeApproval reads
 *   usedFallback (not just passed/approved) to route these to in_review
 *   rather than treating the conservative default as a real rejection.
 */

function slugWords(text, max = 3) {
  return (text ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean);
}

// --- Content Graph: optimistic ---------------------------------------------

export function researchFallback(brief) {
  return {
    summary: `Research unavailable (no AI provider configured) — working from the brand brief directly. ${brief.name} operates in ${brief.industry}, targeting ${brief.targetAudience}, with the goal: ${brief.goals}.`,
    keyPoints: [
      `Target audience: ${brief.targetAudience}`,
      `Primary goal: ${brief.goals}`,
      `Tone to maintain: ${brief.tone}`,
    ],
    sources: [],
    usedFallback: true,
  };
}

export function contentDraftingFallback(brief, research) {
  const opener =
    brief.tone === "playful" || brief.tone === "bold"
      ? `${brief.name} has something new for you!`
      : `${brief.name} is pleased to share an update.`;
  const body = research?.summary ? `${opener} ${research.summary}` : opener;

  const hashtags = [
    ...slugWords(brief.industry, 2),
    ...slugWords(brief.name, 2),
  ].map((w) => `#${w.toLowerCase()}`);

  return { body, hashtags, usedFallback: true };
}

// --- Content Graph: conservative --------------------------------------------

/**
 * Keyword scan against the brief's restricted-topics list. A match is
 * real signal worth surfacing in `issues` — but `passed` is false
 * regardless of whether anything matched, because "no keyword hit"
 * is not the same claim as "an AI compliance reviewer looked at this
 * and it's clean." Both cases need a human, just for different reasons.
 */
export function complianceFallback(brief, draft) {
  const text = (draft?.body ?? "").toLowerCase();
  const matched = (brief.restrictedTopics ?? []).filter((topic) =>
    text.includes(topic.toLowerCase()),
  );

  const issues =
    matched.length > 0
      ? matched.map((topic) => `Contains restricted term: "${topic}"`)
      : [
          "Automated compliance check unavailable — no AI provider configured. Needs manual review regardless of keyword scan result.",
        ];

  return { passed: false, issues, usedFallback: true };
}

export function qualityReviewFallback() {
  return {
    approved: false,
    feedback:
      "Automated quality review unavailable — no AI provider configured. Needs manual review.",
    usedFallback: true,
  };
}

// --- Engagement Graph: per-task heuristics -----------------------------------
// Triage tasks aren't a safety gate the way compliance/quality are — a
// missed "positive" sentiment doesn't let anything unsafe through, it
// just misprioritizes a lead. Best-effort keyword heuristics are a
// reasonable stand-in, same reasoning as research/content-drafting.

const POSITIVE_WORDS = [
  "love",
  "great",
  "amazing",
  "thanks",
  "awesome",
  "best",
  "perfect",
];
const NEGATIVE_WORDS = [
  "bad",
  "worst",
  "hate",
  "terrible",
  "refund",
  "broken",
  "disappointed",
];

export function sentimentFallback(commentText) {
  const text = commentText.toLowerCase();
  const positiveHits = POSITIVE_WORDS.filter((w) => text.includes(w)).length;
  const negativeHits = NEGATIVE_WORDS.filter((w) => text.includes(w)).length;

  let sentiment = "neutral";
  if (positiveHits > negativeHits) sentiment = "positive";
  else if (negativeHits > positiveHits) sentiment = "negative";

  return { sentiment, confidence: 0.4, usedFallback: true }; // low confidence — this is a keyword count, not a model
}

// Order is priority, not just a list — a comment matching more than one
// pattern should classify as the more business-actionable intent, not
// whichever happens to be checked first. "What's the price?" contains
// both a question mark and "price" — it should score as purchase_intent
// (the strongest lead signal), not the generic 'question' catch-all, so
// complaint and purchase_intent are checked ahead of the loose
// question/praise patterns.
const INTENT_PATTERNS = [
  {
    intent: "complaint",
    test: (t) => /\b(refund|broken|terrible|worst|disappointed)\b/.test(t),
  },
  {
    intent: "purchase_intent",
    test: (t) => /\b(price|buy|order|cost|available|purchase)\b/.test(t),
  },
  {
    intent: "praise",
    test: (t) => /\b(love|great|amazing|awesome|best)\b/.test(t),
  },
  {
    intent: "question",
    test: (t) => t.includes("?") || /\b(how|when|where|does)\b/.test(t),
  },
];

export function intentFallback(commentText) {
  const text = commentText.toLowerCase();
  const match = INTENT_PATTERNS.find(({ test }) => test(text));
  return {
    intent: match?.intent ?? "other",
    confidence: 0.4,
    usedFallback: true,
  };
}

export function entitiesFallback(commentText) {
  const text = commentText.toLowerCase();
  return {
    mentionsPrice: /\b(price|cost|\$|expensive|cheap)\b/.test(text),
    mentionsCompetitor: false, // no brief-specific competitor list wired into this fallback yet — Phase 3 scope, not a bug
    keywords: slugWords(commentText, 5).map((w) => w.toLowerCase()),
    usedFallback: true,
  };
}
