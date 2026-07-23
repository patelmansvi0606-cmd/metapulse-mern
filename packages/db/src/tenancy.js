import { WORKSPACE_ROLES } from "@metapulse/schemas";
import { WorkspaceMember } from "./models/WorkspaceMember.js";
import { ForbiddenError, NotFoundError } from "./errors.js";

/**
 * READ THIS BEFORE ADDING A NEW ROUTE OR SERVICE METHOD.
 *
 * The original enforced tenant isolation with Postgres RLS: even a
 * buggy query physically could not return another workspace's rows,
 * because the database itself refused. MongoDB has nothing equivalent
 * — a query with no workspaceId filter, or the wrong one, will happily
 * return whatever matches. There is no database-level backstop here.
 *
 * That means enforcement has exactly one legitimate home: the two
 * functions below. Every Express route that touches a workspace-scoped
 * resource must call one of these — via the requireWorkspaceRole
 * middleware in apps/api, not by re-implementing the check inline —
 * and every service method that queries a workspace-scoped collection
 * must take workspaceId as a required (never optional) parameter and
 * put it in the filter. If you find yourself writing
 * `WorkspaceMember.findOne({ userId, role: 'admin' })` anywhere outside
 * this file, stop — that's a duplicate of this logic, and duplicates
 * drift out of sync with the original. Route everything through here.
 */

const roleRank = Object.fromEntries(
  WORKSPACE_ROLES.map((role, i) => [role, i]),
);

/** Returns the membership doc, or null if the user isn't a member. Doesn't throw. */
export async function getMembership(workspaceId, userId) {
  return WorkspaceMember.findOne({ workspaceId, userId }).lean();
}

/**
 * Throws if the user isn't a member. Deliberately NotFoundError, not
 * ForbiddenError — a non-member gets the same response whether the
 * workspace exists or not, so membership can't be probed for by ID.
 */
export async function assertMember(workspaceId, userId) {
  const membership = await getMembership(workspaceId, userId);
  if (!membership) {
    throw new NotFoundError("Workspace not found");
  }
  return membership;
}

/**
 * Throws NotFoundError for non-members (see assertMember), and
 * ForbiddenError for members whose role doesn't clear minRole — that
 * one *is* a 403, since at that point they've already proven the
 * workspace exists and confirming "you can't do this" leaks nothing
 * new.
 */
export async function assertMinRole(workspaceId, userId, minRole) {
  const membership = await assertMember(workspaceId, userId);
  if (roleRank[membership.role] < roleRank[minRole]) {
    throw new ForbiddenError(
      `This action requires the '${minRole}' role or higher`,
    );
  }
  return membership;
}

/** Non-throwing convenience for UI-type "should I show this button" checks. */
export function roleAtLeast(role, minRole) {
  return roleRank[role] >= roleRank[minRole];
}
