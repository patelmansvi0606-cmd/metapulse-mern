import { AgentRun, AgentRunStep } from "@metapulse/db";

/**
 * One instance per graph invocation. Wraps every node so the audit
 * trail gets written whether the node succeeds, falls back, or throws
 * — callers don't have to remember to record anything themselves.
 *
 * This is intentionally a thin, boring wrapper. Its whole value is
 * being the one fixed seam between "whatever LangGraph does
 * internally" and "what agent_run/agent_run_steps look like in the
 * database" — see the comment in AgentRunStep.js for why that
 * decoupling matters.
 */
export class RunRecorder {
  constructor({ workspaceId, graphName, targetType, targetId }) {
    this.workspaceId = workspaceId;
    this.graphName = graphName;
    this.targetType = targetType;
    this.targetId = targetId;
    this.run = null;
  }

  async start() {
    this.run = await AgentRun.create({
      workspaceId: this.workspaceId,
      graphName: this.graphName,
      targetType: this.targetType,
      targetId: this.targetId,
      status: "running",
    });
    return this.run;
  }

  /**
   * Runs `fn(state)`, records the outcome as a step, and returns
   * whatever `fn` returned (or re-throws whatever it threw, after
   * recording it as an 'error' step — this wrapper observes, it never
   * swallows). `usedFallback` is read off the node's own return value
   * when present, since only the node itself knows whether it took the
   * fallback path.
   */
  async recordNode(nodeName, state, fn) {
    const startedAt = Date.now();
    try {
      const output = await fn(state);
      await AgentRunStep.create({
        agentRunId: this.run._id,
        workspaceId: this.workspaceId,
        nodeName,
        status: output?.usedFallback ? "fallback" : "success",
        input: sanitize(state),
        output: sanitize(output),
        usedFallback: Boolean(output?.usedFallback),
        durationMs: Date.now() - startedAt,
      });
      return output;
    } catch (err) {
      await AgentRunStep.create({
        agentRunId: this.run._id,
        workspaceId: this.workspaceId,
        nodeName,
        status: "error",
        input: sanitize(state),
        durationMs: Date.now() - startedAt,
        error: err.message,
      });
      throw err;
    }
  }

  async complete(status, error = null) {
    this.run.status = status;
    this.run.completedAt = new Date();
    if (error) this.run.error = error;
    await this.run.save();
  }
}

/** Mongoose docs and circular-ish LangGraph state objects don't serialize cleanly into Mixed fields without this. */
function sanitize(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return { note: "not serializable, omitted" };
  }
}
