import { Router } from "express";
import {
  createWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from "@metapulse/schemas";
import { workspaceService } from "@metapulse/db";
import { requireAuth } from "../middleware/auth.js";
import { requireWorkspaceRole } from "../middleware/workspace-access.js";

export const workspaceRouter = Router();

workspaceRouter.use(requireAuth); // every route below needs a signed-in user

workspaceRouter.post("/", async (req, res, next) => {
  try {
    const input = createWorkspaceSchema.parse(req.body);
    const workspace = await workspaceService.createWorkspace(input, req.userId);
    res.status(201).json({ workspace });
  } catch (err) {
    next(err);
  }
});

workspaceRouter.get("/", async (req, res, next) => {
  try {
    const workspaces = await workspaceService.listWorkspacesForUser(req.userId);
    res.json({ workspaces });
  } catch (err) {
    next(err);
  }
});

workspaceRouter.get(
  "/:workspaceId",
  requireWorkspaceRole(),
  async (req, res, next) => {
    try {
      const workspace = await workspaceService.getWorkspace(
        req.params.workspaceId,
        req.userId,
      );
      res.json({ workspace });
    } catch (err) {
      next(err);
    }
  },
);

workspaceRouter.get(
  "/:workspaceId/members",
  requireWorkspaceRole(),
  async (req, res, next) => {
    try {
      const members = await workspaceService.listMembers(
        req.params.workspaceId,
        req.userId,
      );
      res.json({ members });
    } catch (err) {
      next(err);
    }
  },
);

workspaceRouter.post(
  "/:workspaceId/members",
  requireWorkspaceRole("admin"),
  async (req, res, next) => {
    try {
      const input = inviteMemberSchema.parse(req.body);
      const membership = await workspaceService.inviteMember(
        req.params.workspaceId,
        req.userId,
        input,
      );
      res.status(201).json({ membership });
    } catch (err) {
      next(err);
    }
  },
);

workspaceRouter.patch(
  "/:workspaceId/members/:membershipId",
  requireWorkspaceRole("admin"),
  async (req, res, next) => {
    try {
      const { role } = updateMemberRoleSchema.parse(req.body);
      const membership = await workspaceService.updateMemberRole(
        req.params.workspaceId,
        req.userId,
        req.params.membershipId,
        role,
      );
      res.json({ membership });
    } catch (err) {
      next(err);
    }
  },
);

workspaceRouter.delete(
  "/:workspaceId/members/:membershipId",
  requireWorkspaceRole("admin"),
  async (req, res, next) => {
    try {
      await workspaceService.removeMember(
        req.params.workspaceId,
        req.userId,
        req.params.membershipId,
      );
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);
