import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * One document per node execution. This is deliberately NOT LangGraph's
 * own checkpoint/state-history format — that's an internal
 * implementation detail of whichever graph engine happens to be
 * running, and tying the audit trail to it would mean a LangGraph
 * upgrade (or a future switch away from it entirely) could silently
 * change what history looks like. RunRecorder is the seam: the graph
 * calls it, it writes this fixed shape, and nothing downstream needs
 * to know or care what's on the other side of that call.
 */
const agentRunStepSchema = new Schema(
  {
    agentRunId: {
      type: Schema.Types.ObjectId,
      ref: "AgentRun",
      required: true,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    nodeName: { type: String, required: true },
    status: {
      type: String,
      enum: ["success", "fallback", "error"],
      required: true,
    },
    input: { type: Schema.Types.Mixed, default: null },
    output: { type: Schema.Types.Mixed, default: null },
    usedFallback: { type: Boolean, default: false },
    durationMs: { type: Number, required: true },
    error: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const AgentRunStep =
  mongoose.models.AgentRunStep ??
  mongoose.model("AgentRunStep", agentRunStepSchema);
