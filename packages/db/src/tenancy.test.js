import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import {
  roleAtLeast,
  assertMember,
  assertMinRole,
  getMembership,
} from "./tenancy.js";
import { ForbiddenError, NotFoundError } from "./errors.js";
import { User } from "./models/User.js";
import { Workspace } from "./models/Workspace.js";
import { WorkspaceMember } from "./models/WorkspaceMember.js";

describe("roleAtLeast (pure, no DB required)", () => {
  it("ranks owner above admin above editor above viewer", () => {
    expect(roleAtLeast("owner", "admin")).toBe(true);
    expect(roleAtLeast("admin", "owner")).toBe(false);
    expect(roleAtLeast("editor", "editor")).toBe(true); // equal clears the bar
    expect(roleAtLeast("viewer", "editor")).toBe(false);
  });
});

/**
 * These exercise the actual DB-backed enforcement path — the direct
 * equivalent of the original's positive/negative pgTAP RLS tests.
 * They need a real replica-set Mongo instance and skip cleanly without
 * one, same as the original's RLS suite needed the Supabase CLI
 * running. Point MONGODB_TEST_URI at a scratch database to run them.
 */
const testUri = process.env.MONGODB_TEST_URI;

describe.skipIf(!testUri)(
  "tenancy enforcement (requires MONGODB_TEST_URI)",
  () => {
    let owner, outsider, workspace;

    beforeAll(async () => {
      await mongoose.connect(testUri);
      owner = await User.create({
        email: "owner@test.local",
        passwordHash: "x",
        fullName: "Owner",
      });
      outsider = await User.create({
        email: "outsider@test.local",
        passwordHash: "x",
        fullName: "Outsider",
      });
      workspace = await Workspace.create({
        name: "Test Co",
        slug: "test-co",
        createdBy: owner._id,
      });
      await WorkspaceMember.create({
        workspaceId: workspace._id,
        userId: owner._id,
        role: "owner",
      });
    });

    afterAll(async () => {
      await Promise.all([
        User.deleteMany({ _id: { $in: [owner._id, outsider._id] } }),
        Workspace.deleteMany({ _id: workspace._id }),
        WorkspaceMember.deleteMany({ workspaceId: workspace._id }),
      ]);
      await mongoose.disconnect();
    });

    it("POSITIVE: a member can pass assertMember", async () => {
      const membership = await assertMember(workspace._id, owner._id);
      expect(membership.role).toBe("owner");
    });

    it("NEGATIVE: a non-member is rejected with NotFoundError, not ForbiddenError", async () => {
      await expect(
        assertMember(workspace._id, outsider._id),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("POSITIVE: an owner clears an admin-level bar", async () => {
      await expect(
        assertMinRole(workspace._id, owner._id, "admin"),
      ).resolves.toBeTruthy();
    });

    it("NEGATIVE: a viewer is rejected from an admin-level action with ForbiddenError", async () => {
      const viewer = await User.create({
        email: "viewer@test.local",
        passwordHash: "x",
        fullName: "Viewer",
      });
      await WorkspaceMember.create({
        workspaceId: workspace._id,
        userId: viewer._id,
        role: "viewer",
      });

      await expect(
        assertMinRole(workspace._id, viewer._id, "admin"),
      ).rejects.toBeInstanceOf(ForbiddenError);

      await User.deleteOne({ _id: viewer._id });
      await WorkspaceMember.deleteMany({
        workspaceId: workspace._id,
        userId: viewer._id,
      });
    });

    it("getMembership returns null (not a throw) for a non-member", async () => {
      expect(await getMembership(workspace._id, outsider._id)).toBeNull();
    });
  },
);
