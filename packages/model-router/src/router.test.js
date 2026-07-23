import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { ModelRouter } from "./router.js";
import {
  ProviderUnavailableError,
  IntegrationError,
  TransientError,
} from "@metapulse/db";

const dummyRequest = {
  system: "sys",
  prompt: "p",
  schema: z.object({ ok: z.boolean() }),
};

describe("ModelRouter", () => {
  it("throws ProviderUnavailableError when nothing is configured — no attempt is made", async () => {
    const router = new ModelRouter({}); // no keys at all
    expect(router.hasAnyProvider()).toBe(false);
    await expect(
      router.complete("content-drafting", dummyRequest),
    ).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it("uses the single configured provider when only one key is set", async () => {
    const router = new ModelRouter({ anthropicApiKey: "fake-key" });
    expect(router.isProviderConfigured("claude")).toBe(true);
    expect(router.isProviderConfigured("gemini")).toBe(false);

    router.providers.claude.complete = vi.fn().mockResolvedValue({ ok: true });
    const result = await router.complete("content-drafting", dummyRequest);
    expect(result).toEqual({ data: { ok: true }, provider: "claude" });
  });

  it("falls through to the next configured provider when the first fails", async () => {
    const router = new ModelRouter({
      anthropicApiKey: "fake",
      googleApiKey: "fake",
    });

    // content-drafting's order is [claude, gemini] — claude fails, gemini should be tried next
    router.providers.claude.complete = vi
      .fn()
      .mockRejectedValue(new TransientError("claude is overloaded"));
    router.providers.gemini.complete = vi.fn().mockResolvedValue({ ok: true });

    const result = await router.complete("content-drafting", dummyRequest);
    expect(result).toEqual({ data: { ok: true }, provider: "gemini" });
    expect(router.providers.claude.complete).toHaveBeenCalledTimes(1);
    expect(router.providers.gemini.complete).toHaveBeenCalledTimes(1);
  });

  it("respects per-task provider order — comment-triage prefers gemini first", async () => {
    const router = new ModelRouter({
      anthropicApiKey: "fake",
      googleApiKey: "fake",
    });
    const callOrder = [];
    router.providers.claude.complete = vi.fn(
      async () => (callOrder.push("claude"), { ok: true }),
    );
    router.providers.gemini.complete = vi.fn(
      async () => (callOrder.push("gemini"), { ok: true }),
    );

    await router.complete("comment-triage", dummyRequest);
    expect(callOrder).toEqual(["gemini"]); // succeeds on the first try, claude never called
  });

  it("throws IntegrationError (NOT ProviderUnavailableError) when every configured provider fails", async () => {
    const router = new ModelRouter({
      anthropicApiKey: "fake",
      googleApiKey: "fake",
    });
    router.providers.claude.complete = vi
      .fn()
      .mockRejectedValue(new IntegrationError("claude broke"));
    router.providers.gemini.complete = vi
      .fn()
      .mockRejectedValue(new IntegrationError("gemini broke"));

    const failure = await router
      .complete("content-drafting", dummyRequest)
      .catch((e) => e);
    expect(failure).toBeInstanceOf(IntegrationError);
    expect(failure).not.toBeInstanceOf(ProviderUnavailableError);
    expect(failure.message).toContain("tried: claude -> gemini");
  });
});
