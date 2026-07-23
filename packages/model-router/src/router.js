import { ProviderUnavailableError, IntegrationError } from "@metapulse/db";
import { ClaudeProvider } from "./claude.provider.js";
import { GeminiProvider } from "./gemini.provider.js";

/**
 * Which provider goes first per task, and which model tier (flagship
 * vs fast) that task warrants. Order is "try this one, then that one"
 * — not "this one is required." A task with no entry here gets
 * DEFAULT_TASK_CONFIG, so adding a new agent node never requires
 * touching this file first.
 */
const TASK_CONFIG = {
  research: { order: ["gemini", "claude"], tier: "flagship" },
  "content-drafting": { order: ["claude", "gemini"], tier: "flagship" },
  "compliance-check": { order: ["claude", "gemini"], tier: "flagship" },
  "quality-review": { order: ["claude", "gemini"], tier: "flagship" },
  // High-volume, latency-sensitive — every inbound comment runs this — so
  // it defaults to the fast/cheap tier rather than the flagship one.
  "comment-triage": { order: ["gemini", "claude"], tier: "fast" },
};
const DEFAULT_TASK_CONFIG = { order: ["claude", "gemini"], tier: "flagship" };

export class ModelRouter {
  /**
   * @param {{ anthropicApiKey?: string, googleApiKey?: string }} config
   *   Both optional, by design — this is the exact change the original
   *   resilience upgrade made: a missing key means "this provider isn't
   *   available," not "crash on startup."
   */
  constructor({ anthropicApiKey, googleApiKey } = {}) {
    this.providers = {};
    if (anthropicApiKey)
      this.providers.claude = new ClaudeProvider(anthropicApiKey);
    if (googleApiKey) this.providers.gemini = new GeminiProvider(googleApiKey);

    if (Object.keys(this.providers).length === 0) {
      console.warn(
        "[model-router] No AI provider configured (ANTHROPIC_API_KEY / GOOGLE_API_KEY both unset). " +
          "Every AI-backed graph node will run its deterministic fallback instead.",
      );
    }
  }

  hasAnyProvider() {
    return Object.keys(this.providers).length > 0;
  }

  isProviderConfigured(name) {
    return name in this.providers;
  }

  /**
   * @param {string} task            one of TASK_CONFIG's keys, or anything —
   *                                  unlisted tasks just use the default order
   * @param {{ system: string, prompt: string, schema: import('zod').ZodType, maxTokens?: number }} request
   * @returns the parsed object matching `schema`, plus which provider produced it
   *
   * Throws ProviderUnavailableError only when NO configured provider
   * exists for this task at all — nothing was even attempted. Throws
   * IntegrationError when one or more providers WERE tried and all of
   * them failed. That distinction is deliberate and load-bearing: it's
   * what lets a calling graph node tell "there was never any AI here"
   * apart from "the AI actually failed," and react differently to each.
   */
  async complete(task, request) {
    const { order, tier } = TASK_CONFIG[task] ?? DEFAULT_TASK_CONFIG;
    const available = order.filter((name) => this.isProviderConfigured(name));

    if (available.length === 0) {
      throw new ProviderUnavailableError(
        `No AI provider configured for task "${task}"`,
      );
    }

    const attempts = [];
    for (const name of available) {
      try {
        const result = await this.providers[name].complete({
          ...request,
          tier,
        });
        return { data: result, provider: name };
      } catch (err) {
        attempts.push({ provider: name, error: err });
        console.warn(
          `[model-router] "${task}" failed on ${name}: ${err.message} — trying next provider`,
        );
      }
    }

    const tried = attempts.map((a) => a.provider).join(" -> ");
    const last = attempts[attempts.length - 1].error;
    throw new IntegrationError(
      `All configured providers failed for task "${task}" (tried: ${tried}). Most recent: ${last.message}`,
      { cause: last },
    );
  }
}

/**
 * Convenience factory reading the two well-known env var names, so api
 * and worker don't each re-implement "read these two env vars."
 */
export function createRouterFromEnv(env = process.env) {
  return new ModelRouter({
    anthropicApiKey: env.ANTHROPIC_API_KEY || undefined,
    googleApiKey: env.GOOGLE_API_KEY || undefined,
  });
}
