import mongoose from "mongoose";
import {
  CONTENT_PLATFORMS,
  CONTENT_TYPES,
  CONTENT_STATUSES,
} from "@metapulse/schemas";

const { Schema } = mongoose;

const contentItemSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    briefId: { type: Schema.Types.ObjectId, ref: "BrandBrief", required: true },
    platform: { type: String, enum: CONTENT_PLATFORMS, required: true },
    contentType: { type: String, enum: CONTENT_TYPES, required: true },
    status: {
      type: String,
      enum: CONTENT_STATUSES,
      default: "queued",
      index: true,
    },

    // Populated incrementally as the graph runs — each is null until its node executes.
    research: {
      summary: String,
      keyPoints: [String],
      sources: [String],
      usedFallback: Boolean,
    },
    draft: {
      body: String,
      hashtags: [String],
      usedFallback: Boolean,
    },
    complianceResult: {
      passed: Boolean,
      issues: [String],
      usedFallback: Boolean,
    },
    qualityResult: {
      approved: Boolean,
      feedback: String,
      usedFallback: Boolean,
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

contentItemSchema.index({ workspaceId: 1, status: 1, createdAt: -1 }); // the Studio kanban board's primary query shape

export const ContentItem =
  mongoose.models.ContentItem ??
  mongoose.model("ContentItem", contentItemSchema);
