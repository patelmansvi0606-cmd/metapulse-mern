import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { enqueue, dequeue, ack, fail } from "./queue.js";
import { Job } from "./models/Job.js";

const testUri = process.env.MONGODB_TEST_URI;

describe.skipIf(!testUri)("queue (requires MONGODB_TEST_URI)", () => {
  beforeAll(async () => {
    await mongoose.connect(testUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Job.deleteMany({});
  });

  it("enqueue creates a pending job immediately claimable", async () => {
    await enqueue("content_run", { workspaceId: "w1", contentItemId: "c1" });
    const job = await dequeue(["content_run"]);
    expect(job).not.toBeNull();
    expect(job.status).toBe("processing");
    expect(job.attempts).toBe(1);
  });

  it("dequeue returns null when nothing is claimable", async () => {
    const job = await dequeue(["content_run"]);
    expect(job).toBeNull();
  });

  it("two concurrent dequeues never claim the same job — the core atomicity guarantee", async () => {
    await enqueue("content_run", {
      workspaceId: "w1",
      contentItemId: "only-one-job",
    });

    const [a, b] = await Promise.all([
      dequeue(["content_run"]),
      dequeue(["content_run"]),
    ]);
    const claimed = [a, b].filter(Boolean);
    expect(claimed).toHaveLength(1); // exactly one of the two calls got it, never both
  });

  it("dequeue only returns jobs of the requested type", async () => {
    await enqueue("comment_event", {
      workspaceId: "w1",
      commentEventId: "ce1",
    });
    const job = await dequeue(["content_run"]);
    expect(job).toBeNull();
  });

  it("ack marks a job completed", async () => {
    await enqueue("content_run", { workspaceId: "w1", contentItemId: "c1" });
    const job = await dequeue(["content_run"]);
    await ack(job._id);

    const updated = await Job.findById(job._id);
    expect(updated.status).toBe("completed");
  });

  it("fail under maxAttempts returns the job to pending with a future visibleAt", async () => {
    const created = await enqueue(
      "content_run",
      { workspaceId: "w1", contentItemId: "c1" },
      { maxAttempts: 3 },
    );
    const job = await dequeue(["content_run"]); // attempts -> 1
    await fail(job._id, "transient error");

    const updated = await Job.findById(created._id);
    expect(updated.status).toBe("pending");
    expect(updated.lastError).toBe("transient error");
    expect(updated.visibleAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("fail at maxAttempts marks the job permanently failed (dead-letter)", async () => {
    const created = await enqueue(
      "content_run",
      { workspaceId: "w1", contentItemId: "c1" },
      { maxAttempts: 1 },
    );
    const job = await dequeue(["content_run"]); // attempts -> 1, equals maxAttempts
    await fail(job._id, "still failing");

    const updated = await Job.findById(created._id);
    expect(updated.status).toBe("failed");
  });

  it('a job stuck in "processing" past its visibleAt becomes claimable again', async () => {
    const created = await enqueue("content_run", {
      workspaceId: "w1",
      contentItemId: "c1",
    });
    await Job.updateOne(
      { _id: created._id },
      {
        $set: { status: "processing", visibleAt: new Date(Date.now() - 1000) },
      }, // simulate a crashed worker
    );

    const reclaimed = await dequeue(["content_run"]);
    expect(reclaimed._id.toString()).toBe(created._id.toString());
    expect(reclaimed.attempts).toBe(1);
  });
});
