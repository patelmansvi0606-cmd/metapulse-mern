import { ContentItem, AgentRunStep, CommentEvent } from "@metapulse/db";
import { roomFor } from "./socket.js";

/**
 * The worker updates MongoDB; it never talks to this API process
 * directly (they're separate processes, possibly separate machines).
 * Change Streams — a native feature of a Mongo replica set, which this
 * app already requires for transactions — is what closes that gap:
 * watch the collections the worker writes to, and re-emit each change
 * over the socket room for the workspace it belongs to. No Redis, no
 * direct process-to-process link, just the replica set doing what it
 * already does.
 */
export function watchForRealtimeUpdates(io) {
  const contentItemStream = ContentItem.watch(
    [{ $match: { operationType: { $in: ["insert", "update", "replace"] } } }],
    {
      fullDocument: "updateLookup",
    },
  );
  contentItemStream.on("change", (change) => {
    const doc = change.fullDocument;
    if (!doc) return;
    io.to(roomFor(doc.workspaceId)).emit("content_item:changed", {
      contentItemId: doc._id,
      status: doc.status,
    });
  });

  const agentRunStepStream = AgentRunStep.watch(
    [{ $match: { operationType: "insert" } }],
    {
      fullDocument: "updateLookup",
    },
  );
  agentRunStepStream.on("change", (change) => {
    const doc = change.fullDocument;
    if (!doc) return;
    io.to(roomFor(doc.workspaceId)).emit("agent_run_step:recorded", {
      agentRunId: doc.agentRunId,
      nodeName: doc.nodeName,
      status: doc.status,
    });
  });

  const commentEventStream = CommentEvent.watch(
    [{ $match: { operationType: { $in: ["insert", "update", "replace"] } } }],
    {
      fullDocument: "updateLookup",
    },
  );
  commentEventStream.on("change", (change) => {
    const doc = change.fullDocument;
    if (!doc) return;
    io.to(roomFor(doc.workspaceId)).emit("comment_event:changed", {
      commentEventId: doc._id,
      processed: Boolean(doc.processedAt),
    });
  });

  for (const stream of [
    contentItemStream,
    agentRunStepStream,
    commentEventStream,
  ]) {
    stream.on("error", (err) =>
      console.error("[change-stream] error:", err.message),
    );
  }

  return () => {
    contentItemStream.close();
    agentRunStepStream.close();
    commentEventStream.close();
  };
}
