import { config } from "./config.js";
import { connectDb, dequeue, ack, fail } from "@metapulse/db";
import { createRouterFromEnv } from "@metapulse/model-router";
import { createPoller } from "./poller.js";
import { processContentRun } from "./jobs/process-content-run.js";
import { processCommentEvent } from "./jobs/process-comment-event.js";

const JOB_TYPES = ["content_run", "comment_event"];

async function main() {
  await connectDb(config.MONGODB_URI);

  const router = createRouterFromEnv(config);
  console.log(
    `[worker] providers configured: ${["claude", "gemini"].filter((p) => router.isProviderConfigured(p)).join(", ") || "none"}`,
  );

  const poller = createPoller({
    dequeue: (jobTypes) =>
      dequeue(jobTypes, {
        visibilityTimeoutMs: config.JOB_VISIBILITY_TIMEOUT_MS,
      }),
    ack,
    fail,
    handlers: {
      content_run: processContentRun,
      comment_event: processCommentEvent,
    },
    jobTypes: JOB_TYPES,
    router,
    pollIntervalMs: config.POLL_INTERVAL_MS,
  });

  // Let whatever job is mid-flight finish before exiting, rather than
  // killing it mid-transaction — same reasoning as any queue consumer
  // that cares about not corrupting partial work on deploy/restart.
  const shutdown = (signal) => {
    console.log(
      `[worker] received ${signal}, stopping after the current job finishes...`,
    );
    poller.stop();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  console.log(
    `[worker] polling every ${config.POLL_INTERVAL_MS}ms for: ${JOB_TYPES.join(", ")}`,
  );
  await poller.start();
  console.log("[worker] stopped.");
}

main().catch((err) => {
  console.error("[worker] failed to start:", err.message);
  process.exit(1);
});
