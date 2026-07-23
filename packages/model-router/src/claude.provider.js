import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { TransientError, IntegrationError } from "@metapulse/db";

const MODELS = {
  flagship: "claude-sonnet-5",
  fast: "claude-haiku-4-5-20251001",
};

/**
 * Structured output on Claude goes through forced tool use: define one
 * tool whose input_schema IS the caller's Zod schema (converted to
 * plain JSON Schema), force tool_choice to it, and read the tool call's
 * input back out. This is more reliable than asking for JSON in prose
 * and regex-extracting it — the API-level constraint does the work
 * instead of a hopeful prompt instruction.
 */
export class ClaudeProvider {
  constructor(apiKey) {
    this.client = new Anthropic({ apiKey });
  }

  async complete({
    system,
    prompt,
    schema,
    tier = "flagship",
    maxTokens = 2048,
  }) {
    const { $schema: _omit, ...inputSchema } = z.toJSONSchema(schema);

    let response;
    try {
      response = await this.client.messages.create({
        model: MODELS[tier] ?? MODELS.flagship,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: prompt }],
        tools: [
          {
            name: "emit_result",
            description:
              "Return the result. This is the only allowed response format.",
            input_schema: inputSchema,
          },
        ],
        tool_choice: { type: "tool", name: "emit_result" },
      });
    } catch (err) {
      // 429 (rate limit) and 5xx (overloaded/server error) are the API
      // telling us to back off and retry — exactly what the router's
      // "try the next configured provider" path is for. Anything else
      // (401 bad key, 400 bad request) is a config/programming problem
      // that another provider might still work around, but it's logged
      // distinctly since it usually means something needs fixing, not
      // just bad luck.
      if (err?.status === 429 || (err?.status ?? 0) >= 500) {
        throw new TransientError(
          `Claude API transient failure: ${err.message}`,
          { cause: err },
        );
      }
      throw new IntegrationError(
        `Claude API call failed (status ${err?.status ?? "unknown"}): ${err.message}`,
        {
          cause: err,
        },
      );
    }

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse) {
      throw new IntegrationError(
        "Claude did not return the forced tool call — unexpected response shape",
      );
    }

    try {
      return schema.parse(toolUse.input); // re-validate: forced tool_choice narrows the odds of drift, doesn't eliminate them
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new IntegrationError(
          `Claude's structured output failed schema validation: ${err.message}`,
          {
            cause: err,
          },
        );
      }
      throw err;
    }
  }
}
