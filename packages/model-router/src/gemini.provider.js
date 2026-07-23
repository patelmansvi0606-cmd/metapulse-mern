import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { TransientError, IntegrationError } from "@metapulse/db";

const MODELS = {
  flagship: "gemini-3.5-flash",
  fast: "gemini-3.1-flash-lite",
};

/**
 * Structured output on Gemini goes through responseMimeType +
 * responseSchema rather than tool use — the API constrains the raw
 * JSON response directly. Symmetric with ClaudeProvider in every way
 * that matters to the router: same method name, same input shape, same
 * error classification, same re-validation against the original Zod
 * schema before returning.
 */
export class GeminiProvider {
  constructor(apiKey) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async complete({
    system,
    prompt,
    schema,
    tier = "flagship",
    maxTokens = 2048,
  }) {
    const { $schema: _omit, ...responseSchema } = z.toJSONSchema(schema);

    let response;
    try {
      response = await this.client.models.generateContent({
        model: MODELS[tier] ?? MODELS.flagship,
        contents: prompt,
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          responseSchema,
          maxOutputTokens: maxTokens,
        },
      });
    } catch (err) {
      if (err?.status === 429 || (err?.status ?? 0) >= 500) {
        throw new TransientError(
          `Gemini API transient failure: ${err.message}`,
          { cause: err },
        );
      }
      throw new IntegrationError(
        `Gemini API call failed (status ${err?.status ?? "unknown"}): ${err.message}`,
        {
          cause: err,
        },
      );
    }

    const text = response.text;
    if (!text) {
      throw new IntegrationError(
        "Gemini returned an empty response for a structured-output request",
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      throw new IntegrationError(
        `Gemini's response was not valid JSON despite responseSchema: ${err.message}`,
        {
          cause: err,
        },
      );
    }

    try {
      return schema.parse(parsed);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new IntegrationError(
          `Gemini's structured output failed schema validation: ${err.message}`,
          {
            cause: err,
          },
        );
      }
      throw err;
    }
  }
}
