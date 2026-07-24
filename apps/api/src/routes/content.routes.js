import { Router } from "express";
import {
  createContentRunSchema,
  manualReviewDecisionSchema,
} from "@metapulse/schemas";
import {
  ContentItem,
  BrandBrief,
  AuditLog,
  enqueue,
  NotFoundError,
} from "@metapulse/db";
import { requireAuth } from "../middleware/auth.js";
import { requireWorkspaceRole } from "../middleware/workspace-access.js";

export const contentRouter = Router({ mergeParams: true });

contentRouter.use(requireAuth);

contentRouter.post(
  "/content-runs",
  requireWorkspaceRole("editor"),
  async (req, res, next) => {
    try {
      const { workspaceId } = req.params;
      const input = createContentRunSchema.parse(req.body);

      const brief = await BrandBrief.findOne({
        _id: input.briefId,
        workspaceId,
      });
      if (!brief)
        throw new NotFoundError("Brand brief not found in this workspace");

      const contentItem = await ContentItem.create({
        workspaceId,
        briefId: brief._id,
        platform: input.platform,
        contentType: input.contentType,
        status: "queued",
        createdBy: req.userId,
      });

      await enqueue("content_run", {
        workspaceId,
        contentItemId: contentItem._id.toString(),
      });

      res.status(202).json({ contentItem }); // 202: accepted, processing happens asynchronously in the worker
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.get(
  "/content-items",
  requireWorkspaceRole(),
  async (req, res, next) => {
    try {
      const { workspaceId } = req.params;
      const filter = { workspaceId };
      if (req.query.status) filter.status = req.query.status;

      const contentItems = await ContentItem.find(filter)
        .sort({ createdAt: -1 })
        .limit(100);
      res.json({ contentItems });
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.get(
  "/content-items/:contentItemId",
  requireWorkspaceRole(),
  async (req, res, next) => {
    try {
      const contentItem = await ContentItem.findOne({
        _id: req.params.contentItemId,
        workspaceId: req.params.workspaceId,
      });
      if (!contentItem) throw new NotFoundError("Content item not found");
      res.json({ contentItem });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * The human half of "needs review" — without this, in_review is a
 * dead end nothing can ever leave. Deliberately allowed on 'rejected'
 * too, not just 'in_review': a genuine AI rejection is a strong
 * signal, not a verdict a person can't override. Every override is
 * logged distinctly from an AI-driven outcome, same reasoning as the
 * rest of this app's audit trail — "a human decided this" and "the
 * pipeline decided this" should never be indistinguishable later.
 */
contentRouter.patch(
  "/content-items/:contentItemId/review",
  requireWorkspaceRole("editor"),
  async (req, res, next) => {
    try {
      const { decision } = manualReviewDecisionSchema.parse(req.body);
      const { workspaceId, contentItemId } = req.params;

      const contentItem = await ContentItem.findOne({
        _id: contentItemId,
        workspaceId,
      });
      if (!contentItem) throw new NotFoundError("Content item not found");

      const previousStatus = contentItem.status;
      contentItem.status = decision;
      await contentItem.save();

      await AuditLog.create({
        workspaceId,
        actorId: req.userId,
        action: "content_item.manually_reviewed",
        targetType: "content_item",
        targetId: contentItem._id,
        metadata: { from: previousStatus, to: decision },
      });

      res.json({ contentItem });
    } catch (err) {
      next(err);
    }
  },
<<<<<<< HEAD
);
=======
);
>>>>>>> 64c3c44eb5acaf338a9cfcb7bf034ad0b9d71942
