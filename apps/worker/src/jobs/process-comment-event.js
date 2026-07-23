import { runEngagementGraph } from "@metapulse/agents";

/** @param {{ workspaceId: string, commentEventId: string }} payload */
export async function processCommentEvent(router, payload) {
  await runEngagementGraph({ router }, payload);
}
