import mongoose from "mongoose";
import { BRIEF_TONES } from "@metapulse/schemas";

const { Schema } = mongoose;

/**
 * Versioned like the original: editing a brief never mutates the old
 * row, it inserts a new one and flips isCurrent. Anything that already
 * referenced the old version (a ContentItem generated against it) keeps
 * pointing at a brief that still exists exactly as it was when that
 * content was made — useful the moment someone asks "why did it write
 * this?" about a post from three brief-edits ago.
 */
const brandBriefSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    industry: { type: String, required: true, trim: true },
    targetAudience: { type: String, required: true, trim: true },
    tone: { type: String, enum: BRIEF_TONES, required: true },
    goals: { type: String, required: true, trim: true },
    restrictedTopics: { type: [String], default: [] },
    version: { type: Number, required: true, default: 1 },
    isCurrent: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

brandBriefSchema.index({ workspaceId: 1, isCurrent: 1 });

export const BrandBrief =
  mongoose.models.BrandBrief ?? mongoose.model("BrandBrief", brandBriefSchema);
