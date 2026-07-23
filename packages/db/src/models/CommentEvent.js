import mongoose from "mongoose";
import {
  COMMENT_PLATFORMS,
  SENTIMENTS,
  INTENTS,
  LEAD_TIERS,
} from "@metapulse/schemas";

const { Schema } = mongoose;

const commentEventSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    platform: { type: String, enum: COMMENT_PLATFORMS, required: true },
    externalCommentId: { type: String, required: true },
    commentText: { type: String, required: true },

    triage: {
      sentiment: { type: String, enum: SENTIMENTS },
      sentimentUsedFallback: Boolean,
      intent: { type: String, enum: INTENTS },
      intentUsedFallback: Boolean,
      mentionsPrice: Boolean,
      mentionsCompetitor: Boolean,
      keywords: [String],
      entitiesUsedFallback: Boolean,
    },

    leadScore: {
      value: Number, // 0-100
      tier: { type: String, enum: LEAD_TIERS },
    },

    processedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// A webhook can redeliver the same comment more than once — this is
// what makes reprocessing a no-op/upsert instead of a duplicate row.
commentEventSchema.index(
  { workspaceId: 1, platform: 1, externalCommentId: 1 },
  { unique: true },
);

export const CommentEvent =
  mongoose.models.CommentEvent ??
  mongoose.model("CommentEvent", commentEventSchema);
