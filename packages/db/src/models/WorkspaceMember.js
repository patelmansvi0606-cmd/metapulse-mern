import mongoose from "mongoose";
import { WORKSPACE_ROLES } from "@metapulse/schemas";

const { Schema } = mongoose;

const workspaceMemberSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: WORKSPACE_ROLES,
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

// A user has exactly one role per workspace — this is the closest thing
// Mongo has to a DB-level backstop for tenancy, so it's not optional.
workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export const WorkspaceMember =
  mongoose.models.WorkspaceMember ??
  mongoose.model("WorkspaceMember", workspaceMemberSchema);
