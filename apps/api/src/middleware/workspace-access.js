import { assertMember, assertMinRole } from "@metapulse/db";

/**
 * Attaches req.membership after confirming req.user (already set by
 * requireAuth, which must run first) belongs to :workspaceId and — if
 * minRole is given — holds at least that role. This is the ONLY place
 * routes should perform this check; see tenancy.js for why a second
 * inline copy anywhere else is a bug waiting to drift.
 *
 * Usage: router.post('/:workspaceId/members', requireWorkspaceRole('admin'), handler)
 */
export function requireWorkspaceRole(minRole = null) {
  return async (req, res, next) => {
    try {
      const { workspaceId } = req.params;
      req.membership = minRole
        ? await assertMinRole(workspaceId, req.userId, minRole)
        : await assertMember(workspaceId, req.userId);
      next();
    } catch (err) {
      next(err);
    }
  };
}
