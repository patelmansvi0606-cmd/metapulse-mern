import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * The MERN-native replacement for Supabase's pgmq. Same core idea —
 * the queue is just rows in the same database as everything else, no
 * second system (Redis) to run or reason about — implemented with the
 * primitive Mongo actually offers for this: an atomic
 * findOneAndUpdate. See queue.js for how claiming uses it.
 */
const jobSchema = new Schema(
  {
    jobType: {
      type: String,
      enum: ["content_run", "comment_event"],
      required: true,
      index: true,
    },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    // A job is claimable when visibleAt <= now — true immediately for a
    // fresh 'pending' job, and true again for a 'processing' job whose
    // claiming worker never came back to ack/fail it before this time
    // (crashed, lost network, etc.). That second case is what makes
    // this a real queue with stuck-job recovery, not just a to-do list.
    visibleAt: { type: Date, default: Date.now, index: true },
    lastError: { type: String, default: null },
  },
  { timestamps: true },
);

jobSchema.index({ jobType: 1, status: 1, visibleAt: 1 }); // the exact shape dequeue() filters on

export const Job = mongoose.models.Job ?? mongoose.model("Job", jobSchema);
