import mongoose from "mongoose";

const { Schema } = mongoose;

const workspaceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    monthlyBudgetUsd: {
      type: Number,
      default: null,
      min: 0,
    },
    /**
     * Who created it — an immutable audit fact, not "who owns it now."
     * Current ownership is derived from WorkspaceMember.role === 'owner',
     * which can be transferred (promote someone, demote yourself) without
     * rewriting history here.
     */
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Soft delete: same reasoning as the original — workspaces are
    // referenced by budget_usage/audit history that shouldn't vanish.
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

workspaceSchema.index({ deletedAt: 1 });

export const Workspace =
  mongoose.models.Workspace ?? mongoose.model("Workspace", workspaceSchema);
