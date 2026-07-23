import { Job } from "./models/Job.js";

/** Called from apps/api after creating the row a job should process. */
export async function enqueue(jobType, payload, { maxAttempts = 3 } = {}) {
  return Job.create({
    jobType,
    payload,
    maxAttempts,
    status: "pending",
    visibleAt: new Date(),
  });
}

/**
 * Atomically claims and returns exactly one job, or null if nothing is
 * claimable right now. The atomicity comes entirely from Mongo's
 * single-document findOneAndUpdate guarantee — two worker processes
 * calling this at the same instant cannot both receive the same job,
 * the same way two Postgres transactions can't both win a `SELECT ...
 * FOR UPDATE SKIP LOCKED` on the same row. That guarantee is the one
 * thing this whole queue design depends on; everything else here is
 * bookkeeping around it.
 *
 * A claimed job's visibleAt moves forward by visibilityTimeoutMs — if
 * whatever called dequeue() doesn't ack() or fail() it before that
 * time, the job becomes claimable again (see the schema comment in
 * Job.js), attempts increments either way.
 */
export async function dequeue(jobTypes, { visibilityTimeoutMs = 30_000 } = {}) {
  const now = new Date();
  return Job.findOneAndUpdate(
    {
      jobType: { $in: jobTypes },
      status: { $in: ["pending", "processing"] },
      visibleAt: { $lte: now },
    },
    {
      $set: {
        status: "processing",
        visibleAt: new Date(now.getTime() + visibilityTimeoutMs),
      },
      $inc: { attempts: 1 },
    },
    { sort: { createdAt: 1 }, new: true },
  );
}

export async function ack(jobId) {
  await Job.updateOne({ _id: jobId }, { $set: { status: "completed" } });
}

/**
 * Under maxAttempts: goes back to 'pending' with an exponential-ish
 * backoff (attempts is already incremented by dequeue, so this reads
 * naturally as "wait longer each time it's tried again"). At or over
 * maxAttempts: 'failed' permanently — this is the dead-letter case,
 * and nothing will retry it further without a person looking at
 * lastError first.
 */
export async function fail(jobId, errorMessage) {
  const job = await Job.findById(jobId);
  if (!job) return;

  if (job.attempts >= job.maxAttempts) {
    job.status = "failed";
  } else {
    job.status = "pending";
    const backoffMs = Math.min(60_000, 1_000 * 2 ** job.attempts);
    job.visibleAt = new Date(Date.now() + backoffMs);
  }
  job.lastError = errorMessage;
  await job.save();
}
