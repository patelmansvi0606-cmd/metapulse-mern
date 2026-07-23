import mongoose from "mongoose";

const { Schema } = mongoose;

const agentRunSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    graphName: {
      type: String,
      enum: ["content", "engagement"],
      required: true,
    },
    // Polymorphic on purpose: a content run points at a ContentItem, an
    // engagement run points at a CommentEvent. targetType says which.
    targetType: {
      type: String,
      enum: ["content_item", "comment_event"],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    status: {
      type: String,
      enum: ["running", "completed", "failed"],
      default: "running",
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    error: { type: String, default: null },
  },
  { timestamps: true },
);

export const AgentRun =
  mongoose.models.AgentRun ?? mongoose.model("AgentRun", agentRunSchema);
