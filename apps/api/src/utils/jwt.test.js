import { describe, it, expect, beforeAll } from "vitest";
import jwt from "jsonwebtoken";

// config.js validates the full environment (via Zod) the moment it's
// imported — including MONGODB_URI, which this test has no need for
// but which config.js still requires to exist. A dynamic import after
// setting process.env sidesteps static-import hoisting, which would
// otherwise run config.js before this file gets a chance to set anything.
let signAuthToken, verifyAuthToken;

beforeAll(async () => {
  process.env.MONGODB_URI ??= "mongodb://localhost:27017/unused-in-this-test";
  process.env.JWT_SECRET ??=
    "test-only-secret-that-is-at-least-32-characters-long";
  process.env.CLIENT_ORIGIN ??= "http://localhost:5173";
  ({ signAuthToken, verifyAuthToken } = await import("./jwt.js"));
});

describe("JWT sign/verify", () => {
  it("issues a token with three dot-separated segments", () => {
    const token = signAuthToken("64f1a2b3c4d5e6f7a8b9c0d1");
    expect(token.split(".")).toHaveLength(3);
  });

  it("round-trips the user id through sign -> verify", () => {
    const token = signAuthToken("64f1a2b3c4d5e6f7a8b9c0d1");
    const payload = verifyAuthToken(token);
    expect(payload.sub).toBe("64f1a2b3c4d5e6f7a8b9c0d1");
  });

  it("returns null (never throws) for a garbage token", () => {
    expect(verifyAuthToken("not-a-real-token")).toBeNull();
  });

  it("returns null for a token signed with a different secret", () => {
    // simulates a forged/stale token — must not verify against a different secret
    const forged = jwt.sign(
      { sub: "x" },
      "a-completely-different-secret-value-here",
    );
    expect(verifyAuthToken(forged)).toBeNull();
  });
});
