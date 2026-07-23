import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { RunRecorder } from "./run-recorder.js";
import { AgentRun, AgentRunStep, Workspace, User } from "@metapulse/db";

const testUri = process.env.MONGODB_TEST_URI;

describe.skipIf(!testUri)("RunRecorder (requires MONGODB_TEST_URI)", () => {
  let workspace, user;

  beforeAll(async () => {
    await mongoose.connect(testUri);
    user = await User.create({
      email: "recorder@test.local",
      passwordHash: "x",
      fullName: "Recorder Test",
    });
    workspace = await Workspace.create({
      name: "Recorder Co",
      slug: "recorder-co",
      createdBy: user._id,
    });
  });

  afterAll(async () => {
    await AgentRun.deleteMany({ workspaceId: workspace._id });
    await AgentRunStep.deleteMany({ workspaceId: workspace._id });
    await Workspace.deleteOne({ _id: workspace._id });
    await User.deleteOne({ _id: user._id });
    await mongoose.disconnect();
  });

  it("creates an AgentRun on start() with status running", async () => {
    const recorder = new RunRecorder({
      workspaceId: workspace._id,
      graphName: "content",
      targetType: "content_item",
      targetId: new mongoose.Types.ObjectId(),
    });
    const run = await recorder.start();
    expect(run.status).toBe("running");
  });

  it('recordNode writes a "success" step and returns the node fn result unchanged', async () => {
    const recorder = new RunRecorder({
      workspaceId: workspace._id,
      graphName: "content",
      targetType: "content_item",
      targetId: new mongoose.Types.ObjectId(),
    });
    await recorder.start();

    const result = await recorder.recordNode(
      "testNode",
      { x: 1 },
      async () => ({ y: 2, usedFallback: false }),
    );
    expect(result).toEqual({ y: 2, usedFallback: false });

    const steps = await AgentRunStep.find({ agentRunId: recorder.run._id });
    expect(steps).toHaveLength(1);
    expect(steps[0].status).toBe("success");
  });

  it('recordNode writes a "fallback" step when the node result says usedFallback: true', async () => {
    const recorder = new RunRecorder({
      workspaceId: workspace._id,
      graphName: "content",
      targetType: "content_item",
      targetId: new mongoose.Types.ObjectId(),
    });
    await recorder.start();
    await recorder.recordNode("testNode", {}, async () => ({
      usedFallback: true,
    }));

    const [step] = await AgentRunStep.find({ agentRunId: recorder.run._id });
    expect(step.status).toBe("fallback");
    expect(step.usedFallback).toBe(true);
  });

  it('recordNode writes an "error" step and re-throws when the node fn throws', async () => {
    const recorder = new RunRecorder({
      workspaceId: workspace._id,
      graphName: "content",
      targetType: "content_item",
      targetId: new mongoose.Types.ObjectId(),
    });
    await recorder.start();

    await expect(
      recorder.recordNode("testNode", {}, async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    const [step] = await AgentRunStep.find({ agentRunId: recorder.run._id });
    expect(step.status).toBe("error");
    expect(step.error).toBe("boom");
  });

  it("complete() sets status and completedAt", async () => {
    const recorder = new RunRecorder({
      workspaceId: workspace._id,
      graphName: "engagement",
      targetType: "comment_event",
      targetId: new mongoose.Types.ObjectId(),
    });
    await recorder.start();
    await recorder.complete("completed");

    const run = await AgentRun.findById(recorder.run._id);
    expect(run.status).toBe("completed");
    expect(run.completedAt).not.toBeNull();
  });
});
