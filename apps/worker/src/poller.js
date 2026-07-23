/**
 * `tick()` is the unit that matters and the thing poller.test.js
 * exercises directly. `start()`/`stop()` are just tick() wrapped in a
 * loop — kept separate so tests never have to deal with an actual
 * infinite loop or a real timer.
 */
export function createPoller({
  dequeue,
  ack,
  fail,
  handlers,
  jobTypes,
  router,
  pollIntervalMs,
  sleep = defaultSleep,
}) {
  let running = false;

  /** Claims and processes at most one job. Returns true if it found work, false if the queue was empty. */
  async function tick() {
    const job = await dequeue(jobTypes);
    if (!job) return false;

    const handler = handlers[job.jobType];
    try {
      await handler(router, job.payload);
      await ack(job._id);
    } catch (err) {
      console.error(
        `[worker] job ${job._id} (${job.jobType}) failed: ${err.message}`,
      );
      await fail(job._id, err.message);
    }
    return true;
  }

  async function start() {
    running = true;
    while (running) {
      const didWork = await tick();
      if (!didWork) await sleep(pollIntervalMs);
    }
  }

  function stop() {
    running = false;
  }

  return { start, stop, tick };
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
