import { describe, it, expect, vi } from "vitest";
import { createPoller } from "./poller.js";

describe("poller.tick()", () => {
  it("returns false and touches nothing when the queue is empty", async () => {
    const dequeue = vi.fn().mockResolvedValue(null);
    const ack = vi.fn();
    const fail = vi.fn();
    const handlers = { content_run: vi.fn() };

    const poller = createPoller({
      dequeue,
      ack,
      fail,
      handlers,
      jobTypes: ["content_run"],
      router: {},
    });
    const didWork = await poller.tick();

    expect(didWork).toBe(false);
    expect(ack).not.toHaveBeenCalled();
    expect(fail).not.toHaveBeenCalled();
  });

  it("routes a job to the handler matching its jobType, then acks on success", async () => {
    const job = {
      _id: "job1",
      jobType: "content_run",
      payload: { contentItemId: "c1" },
    };
    const dequeue = vi.fn().mockResolvedValue(job);
    const ack = vi.fn();
    const fail = vi.fn();
    const contentHandler = vi.fn().mockResolvedValue(undefined);
    const commentHandler = vi.fn();

    const poller = createPoller({
      dequeue,
      ack,
      fail,
      handlers: { content_run: contentHandler, comment_event: commentHandler },
      jobTypes: ["content_run", "comment_event"],
      router: { fake: "router" },
    });
    const didWork = await poller.tick();

    expect(didWork).toBe(true);
    expect(contentHandler).toHaveBeenCalledWith(
      { fake: "router" },
      { contentItemId: "c1" },
    );
    expect(commentHandler).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalledWith("job1");
    expect(fail).not.toHaveBeenCalled();
  });

  it("calls fail() with the error message when the handler throws, never ack()", async () => {
    const job = { _id: "job2", jobType: "content_run", payload: {} };
    const dequeue = vi.fn().mockResolvedValue(job);
    const ack = vi.fn();
    const fail = vi.fn();
    const handlers = {
      content_run: vi.fn().mockRejectedValue(new Error("model unavailable")),
    };

    const poller = createPoller({
      dequeue,
      ack,
      fail,
      handlers,
      jobTypes: ["content_run"],
      router: {},
    });
    await poller.tick();

    expect(ack).not.toHaveBeenCalled();
    expect(fail).toHaveBeenCalledWith("job2", "model unavailable");
  });

  it("start() loops via tick() until stop() is called, sleeping only when the queue is empty", async () => {
    let calls = 0;
    const dequeue = vi.fn(async () => {
      calls += 1;
      // work available exactly twice, then empty forever after
      return calls <= 2
        ? { _id: `job${calls}`, jobType: "content_run", payload: {} }
        : null;
    });
    const ack = vi.fn();
    const fail = vi.fn();
    const handlers = { content_run: vi.fn().mockResolvedValue(undefined) };
    const sleep = vi.fn(async () => {
      poller.stop(); // stop as soon as it goes idle, so the test terminates
    });

    const poller = createPoller({
      dequeue,
      ack,
      fail,
      handlers,
      jobTypes: ["content_run"],
      router: {},
      sleep,
    });
    await poller.start();

    expect(ack).toHaveBeenCalledTimes(2); // both real jobs processed
    expect(sleep).toHaveBeenCalledTimes(1); // slept exactly once, on the first empty tick
  });
});
