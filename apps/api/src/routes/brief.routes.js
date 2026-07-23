import { Router } from "express";
import { createBrandBriefSchema } from "@metapulse/schemas";
import { BrandBrief } from "@metapulse/db";
import { requireAuth } from "../middleware/auth.js";
import { requireWorkspaceRole } from "../middleware/workspace-access.js";

export const briefRouter = Router({ mergeParams: true });

briefRouter.use(requireAuth);

briefRouter.post(
  "/",
  requireWorkspaceRole("editor"),
  async (req, res, next) => {
    try {
      const input = createBrandBriefSchema.parse(req.body);
      const { workspaceId } = req.params;

      const previous = await BrandBrief.findOne({
        workspaceId,
        isCurrent: true,
      }).sort({ version: -1 });
      if (previous) {
        previous.isCurrent = false;
        await previous.save();
      }

      const brief = await BrandBrief.create({
        ...input,
        workspaceId,
        version: (previous?.version ?? 0) + 1,
        isCurrent: true,
        createdBy: req.userId,
      });
      res.status(201).json({ brief });
    } catch (err) {
      next(err);
    }
  },
);

briefRouter.get("/", requireWorkspaceRole(), async (req, res, next) => {
  try {
    const briefs = await BrandBrief.find({
      workspaceId: req.params.workspaceId,
    }).sort({ version: -1 });
    res.json({ briefs });
  } catch (err) {
    next(err);
  }
});

briefRouter.get("/current", requireWorkspaceRole(), async (req, res, next) => {
  try {
    const brief = await BrandBrief.findOne({
      workspaceId: req.params.workspaceId,
      isCurrent: true,
    });
    if (!brief) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "No brand brief has been created yet",
        },
      });
    }
    res.json({ brief });
  } catch (err) {
    next(err);
  }
});
