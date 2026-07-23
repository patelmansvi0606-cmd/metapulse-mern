import { Server } from "socket.io";
import { parseCookie } from "cookie";
import { User } from "@metapulse/db";
import { verifyAuthToken } from "./utils/jwt.js";
import { getMembership } from "@metapulse/db";
import { config } from "./config.js";

const COOKIE_NAME = "mp_session";

/**
 * Replaces Supabase Realtime. Same session cookie the REST API uses —
 * no separate token for the client to manage — verified once at
 * connection time, then again per-room-join so a socket can't sit open
 * and later be pointed at a workspace it was never a member of.
 *
 * Event names follow `<workspace>:<resource>:<verb>` — Phase 2/3 will
 * emit `content_item:status_changed`, `agent_run:step_recorded`, etc.
 * into a room scoped to that workspace only.
 */
export function attachSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: config.CLIENT_ORIGIN, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const raw = socket.handshake.headers.cookie;
      const token = raw ? parseCookie(raw)[COOKIE_NAME] : null;
      const payload = token ? verifyAuthToken(token) : null;
      if (!payload?.sub) return next(new Error("unauthenticated"));

      const user = await User.findById(payload.sub);
      if (!user) return next(new Error("unauthenticated"));

      socket.userId = user._id.toString();
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on("connection", (socket) => {
    socket.on("workspace:join", async (workspaceId, ack) => {
      try {
        const membership = await getMembership(workspaceId, socket.userId);
        if (!membership) {
          return ack?.({ ok: false, error: "not a member of this workspace" });
        }
        socket.join(roomFor(workspaceId));
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("workspace:leave", (workspaceId) => {
      socket.leave(roomFor(workspaceId));
    });
  });

  return io;
}

export function roomFor(workspaceId) {
  return `workspace:${workspaceId}`;
}
