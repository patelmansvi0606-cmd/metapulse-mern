import mongoose from "mongoose";
import { Workspace } from "../models/Workspace.js";
import { WorkspaceMember } from "../models/WorkspaceMember.js";
import { AuditLog } from "../models/AuditLog.js";
import { User } from "../models/User.js";
import { assertMember, assertMinRole, getMembership } from "../tenancy.js";
import { ConflictError, NotFoundError } from "../errors.js";

/**
 * Workspace + owner-membership + audit-log entry, created together or
 * not at all. The original needed a transaction here to work around
 * RLS's chicken-and-egg problem (can't insert into workspace_members
 * until you're already a member). That specific reason is gone — Mongo
 * has no RLS to satisfy — but a plainer reason survives: a workspace
 * that exists with no owner, or an owner-membership pointing at a
 * workspace that doesn't exist, is a broken state either way.
 *
 * Requires MONGODB_URI to point at a replica set — see connection.js.
 */
export async function createWorkspace(
  { name, slug, monthlyBudgetUsd },
  ownerUserId,
) {
  const session = await mongoose.startSession();
  try {
    let workspace;
    await session.withTransaction(async () => {
      const existing = await Workspace.findOne({ slug }).session(session);
      if (existing) {
        throw new ConflictError(`Workspace slug "${slug}" is already taken`);
      }

      const [createdWorkspace] = await Workspace.create(
        [
          {
            name,
            slug,
            monthlyBudgetUsd: monthlyBudgetUsd ?? null,
            createdBy: ownerUserId,
          },
        ],
        { session },
      );
      workspace = createdWorkspace;

      await WorkspaceMember.create(
        [{ workspaceId: workspace._id, userId: ownerUserId, role: "owner" }],
        { session },
      );

      await AuditLog.create(
        [
          {
            workspaceId: workspace._id,
            actorId: ownerUserId,
            action: "workspace.created",
            targetType: "workspace",
            targetId: workspace._id,
          },
        ],
        { session },
      );
    });
    return workspace;
  } catch (err) {
    if (err?.code === 11000) {
      throw new ConflictError(`Workspace slug "${slug}" is already taken`);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

/** Every workspace a user belongs to, with their role attached, newest first. */
export async function listWorkspacesForUser(userId) {
  const memberships = await WorkspaceMember.find({ userId })
    .populate({ path: "workspaceId", match: { deletedAt: null } })
    .sort({ createdAt: -1 })
    .lean();

  return memberships
    .filter((m) => m.workspaceId) // populate match nulls out soft-deleted workspaces rather than omitting them
    .map((m) => ({ ...m.workspaceId, role: m.role }));
}

/** Requires the caller to be a member — any role. */
export async function getWorkspace(workspaceId, userId) {
  const membership = await assertMember(workspaceId, userId);
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    deletedAt: null,
  }).lean();
  if (!workspace) throw new NotFoundError("Workspace not found");
  return { ...workspace, role: membership.role };
}

/** Requires the caller to be a member — any role. */
export async function listMembers(workspaceId, userId) {
  await assertMember(workspaceId, userId);
  return WorkspaceMember.find({ workspaceId })
    .populate({ path: "userId", select: "fullName email avatarUrl" })
    .sort({ createdAt: 1 })
    .lean();
}

/**
 * Requires admin+. Silently no-ops the "invite a non-existent email"
 * case for now — a pending-invite-by-email flow (create the row before
 * the person has an account, resolve it on their first signup) is real
 * scope, not a one-line addition, and Phase 1 is deliberately just the
 * foundation. Flagging it here rather than quietly leaving it out.
 */
export async function inviteMember(workspaceId, actingUserId, { email, role }) {
  await assertMinRole(workspaceId, actingUserId, "admin");

  const targetUser = await User.findOne({ email }).lean();
  if (!targetUser) {
    throw new NotFoundError(
      `No account exists yet for ${email}. Pending email invites aren't built in this phase — they need to sign up first.`,
    );
  }

  const alreadyMember = await getMembership(workspaceId, targetUser._id);
  if (alreadyMember) {
    throw new ConflictError(`${email} is already a member of this workspace`);
  }

  const membership = await WorkspaceMember.create({
    workspaceId,
    userId: targetUser._id,
    role,
    invitedBy: actingUserId,
  });

  await AuditLog.create({
    workspaceId,
    actorId: actingUserId,
    action: "member.invited",
    targetType: "user",
    targetId: targetUser._id,
    metadata: { role },
  });

  return membership;
}

/**
 * Requires admin+ for ordinary role changes. Granting or revoking the
 * 'owner' role specifically requires the caller to already *be* an
 * owner — an admin promoting themselves (or anyone) to owner would be
 * a privilege escalation admin-level access was never meant to allow.
 * Also refuses to demote the workspace's last owner, same reasoning
 * the original's RLS + application logic protected: a workspace with
 * zero owners is a stuck workspace.
 */
export async function updateMemberRole(
  workspaceId,
  actingUserId,
  targetMembershipId,
  newRole,
) {
  const actingMembership = await assertMinRole(
    workspaceId,
    actingUserId,
    "admin",
  );

  const target = await WorkspaceMember.findOne({
    _id: targetMembershipId,
    workspaceId,
  });
  if (!target) throw new NotFoundError("Membership not found");

  const touchesOwnership = target.role === "owner" || newRole === "owner";
  if (touchesOwnership && actingMembership.role !== "owner") {
    throw new ConflictError(
      "Only an owner can grant or revoke the 'owner' role",
    );
  }

  if (target.role === "owner" && newRole !== "owner") {
    const otherOwners = await WorkspaceMember.countDocuments({
      workspaceId,
      role: "owner",
      _id: { $ne: target._id },
    });
    if (otherOwners === 0) {
      throw new ConflictError("A workspace must have at least one owner");
    }
  }

  const previousRole = target.role;
  target.role = newRole;
  await target.save();

  await AuditLog.create({
    workspaceId,
    actorId: actingUserId,
    action: "member.role_updated",
    targetType: "user",
    targetId: target.userId,
    metadata: { from: previousRole, to: newRole },
  });

  return target;
}

/** Requires admin+. Same last-owner protection as updateMemberRole. */
export async function removeMember(
  workspaceId,
  actingUserId,
  targetMembershipId,
) {
  await assertMinRole(workspaceId, actingUserId, "admin");

  const target = await WorkspaceMember.findOne({
    _id: targetMembershipId,
    workspaceId,
  });
  if (!target) throw new NotFoundError("Membership not found");

  if (target.role === "owner") {
    const otherOwners = await WorkspaceMember.countDocuments({
      workspaceId,
      role: "owner",
      _id: { $ne: target._id },
    });
    if (otherOwners === 0) {
      throw new ConflictError(
        "A workspace must have at least one owner — transfer ownership first",
      );
    }
  }

  await target.deleteOne();

  await AuditLog.create({
    workspaceId,
    actorId: actingUserId,
    action: "member.removed",
    targetType: "user",
    targetId: target.userId,
  });
}
