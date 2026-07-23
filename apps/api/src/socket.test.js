import { describe, it, expect, beforeAll } from "vitest";
import http from "node:http";
import { parseCookie } from "cookie";

// attachSocketServer touches config.js, which strictly validates the
// full environment on import (see config.js) — set the minimum it
// needs before the dynamic import, same pattern as jwt.test.js.
let attachSocketServer, roomFor;

beforeAll(async () => {
  process.env.MONGODB_URI ??= "mongodb://localhost:27017/unused-in-this-test";
  process.env.JWT_SECRET ??=
    "test-only-secret-that-is-at-least-32-characters-long";
  process.env.CLIENT_ORIGIN ??= "http://localhost:5173";
  ({ attachSocketServer, roomFor } = await import("./socket.js"));
});

describe("socket.js", () => {
  it("imports cleanly and attachSocketServer runs against a real http server without throwing", () => {
    // This is the exact regression this test exists to catch: cookie v2
    // renamed its exports, `import cookie from "cookie"` used to
    // silently pass `node --check` (that only validates syntax, not
    // that named/default imports actually resolve) and then threw a
    // SyntaxError the moment the module was actually loaded. Only an
    // actual import — which is what this test file forces — catches it.
    const server = http.createServer();
    expect(() => attachSocketServer(server)).not.toThrow();
    server.close();
  });

  it("roomFor produces a workspace-scoped room name", () => {
    expect(roomFor("abc123")).toBe("workspace:abc123");
  });
});

describe("cookie parsing (the thing that actually broke)", () => {
  it("parseCookie extracts the session cookie value from a raw Cookie header", () => {
    const parsed = parseCookie("mp_session=abc.def.ghi; other=value");
    expect(parsed.mp_session).toBe("abc.def.ghi");
  });

  it("returns undefined for a missing cookie rather than throwing", () => {
    const parsed = parseCookie("other=value");
    expect(parsed.mp_session).toBeUndefined();
  });
});
