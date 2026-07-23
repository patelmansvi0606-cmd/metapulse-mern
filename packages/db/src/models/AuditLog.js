import mongoose from "mongoose";

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // e.g. 'workspace.created', 'member.invited', 'member.role_updated'
    action: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      default: null,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }, // immutable log — no updatedAt to track
);

export const AuditLog =
  mongoose.models.AuditLog ?? mongoose.model("AuditLog", auditLogSchema);
