import { runContentGraph } from "@metapulse/agents";

/** @param {{ workspaceId: string, contentItemId: string }} payload */
export async function processContentRun(router, payload) {
  await runContentGraph({ router }, payload);
}
