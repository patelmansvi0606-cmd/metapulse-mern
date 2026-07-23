import { Router } from "express";
import { triageCommentSchema } from "@metapulse/schemas";
import { CommentEvent, enqueue } from "@metapulse/db";
import { requireAuth } from "../middleware/auth.js";
import { requireWorkspaceRole } from "../middleware/workspace-access.js";

export const commentRouter = Router({ mergeParams: true });

commentRouter.use(requireAuth);

/**
 * NOTE ON SCOPE: this is an authenticated creation endpoint for
 * exercising the Engagement Graph end to end — it is deliberately NOT
 * yet the original's real Meta webhook (HMAC signature verification
 * against the app secret, the subscription challenge/verify handshake,
 * page-to-workspace resolution). That's real, separate integration
 * work with Meta's platform, not something to fake here. This route
 * gets the graph and queue exercised correctly in the meantime.
 */
commentRouter.post(
  "/comment-events",
  requireWorkspaceRole("editor"),
  async (req, res, next) => {
    try {
      const { workspaceId } = req.params;
      const input = triageCommentSchema.parse({ ...req.body, workspaceId });

      // Upsert on the (workspaceId, platform, externalCommentId) unique
      // index — a redelivered comment is a no-op re-fetch, not a duplicate.
      const commentEvent = await CommentEvent.findOneAndUpdate(
        {
          workspaceId,
          platform: input.platform,
          externalCommentId: input.externalCommentId,
        },
        { $setOnInsert: { commentText: input.commentText } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      if (!commentEvent.processedAt) {
        await enqueue("comment_event", {
          workspaceId,
          commentEventId: commentEvent._id.toString(),
        });
      }

      res.status(202).json({ commentEvent });
    } catch (err) {
      next(err);
    }
  },
);

commentRouter.get(
  "/comment-events",
  requireWorkspaceRole(),
  async (req, res, next) => {
    try {
      const commentEvents = await CommentEvent.find({
        workspaceId: req.params.workspaceId,
      })
        .sort({ createdAt: -1 })
        .limit(100);
      res.json({ commentEvents });
    } catch (err) {
      next(err);
    }
  },
);
