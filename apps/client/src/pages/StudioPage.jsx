import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, ApiError } from "../lib/api.js";
import {
  getSocket,
  joinWorkspaceRoom,
  leaveWorkspaceRoom,
} from "../lib/socket.js";
import { AppHeader } from "../components/AppHeader.jsx";
import { BriefForm } from "../components/BriefForm.jsx";
import { GenerateContentForm } from "../components/GenerateContentForm.jsx";
import { ContentCard } from "../components/ContentCard.jsx";

const COLUMNS = [
  { status: "queued", title: "Queued" },
  { status: "in_review", title: "Needs review" },
  { status: "approved", title: "Approved" },
  { status: "rejected", title: "Rejected" },
];

export function StudioPage() {
  const { workspaceId } = useParams();
  const [brief, setBrief] = useState(undefined); // undefined = loading, null = none exists yet
  const [items, setItems] = useState([]);
  const [loadError, setLoadError] = useState(null);

  const loadItems = useCallback(async () => {
    const { contentItems } = await api.get(
      `/workspaces/${workspaceId}/content-items`,
    );
    setItems(contentItems);
  }, [workspaceId]);

  const refreshOneItem = useCallback(
    async (contentItemId) => {
      try {
        const { contentItem } = await api.get(
          `/workspaces/${workspaceId}/content-items/${contentItemId}`,
        );
        setItems((prev) => {
          const exists = prev.some((i) => i._id === contentItem._id);
          return exists
            ? prev.map((i) => (i._id === contentItem._id ? contentItem : i))
            : [contentItem, ...prev];
        });
      } catch {
        // the item may belong to a run that hasn't fully committed yet — the
        // next change event for it will resolve this, nothing to surface here
      }
    },
    [workspaceId],
  );

  const handleDecide = useCallback(
    async (contentItemId, decision) => {
      const { contentItem } = await api.patch(
        `/workspaces/${workspaceId}/content-items/${contentItemId}/review`,
        { decision },
      );
      setItems((prev) =>
        prev.map((i) => (i._id === contentItem._id ? contentItem : i)),
      );
    },
    [workspaceId],
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { brief } = await api.get(
          `/workspaces/${workspaceId}/briefs/current`,
        );
        if (active) setBrief(brief);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          if (active) setBrief(null);
        } else if (active) {
          setLoadError("Could not load the workspace brief.");
        }
      }
      if (active)
        loadItems().catch(() => setLoadError("Could not load content items."));
    })();
    return () => {
      active = false;
    };
  }, [workspaceId, loadItems]);

  useEffect(() => {
    joinWorkspaceRoom(workspaceId).catch(() =>
      setLoadError("Could not connect for live updates."),
    );
    const socket = getSocket();

    const onContentChanged = (payload) => refreshOneItem(payload.contentItemId);
    socket.on("content_item:changed", onContentChanged);

    return () => {
      socket.off("content_item:changed", onContentChanged);
      leaveWorkspaceRoom(workspaceId);
    };
  }, [workspaceId, refreshOneItem]);

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-6 font-display text-3xl font-semibold text-plum">
          Studio
        </h1>

        {loadError && <p className="mb-4 text-sm text-coral">{loadError}</p>}

        {brief === undefined ? (
          <p className="text-sm text-ink/60">Loading…</p>
        ) : brief === null ? (
          <BriefForm workspaceId={workspaceId} onCreated={setBrief} />
        ) : (
          <>
            <div className="mb-6">
              <GenerateContentForm
                workspaceId={workspaceId}
                briefId={brief._id}
                onQueued={(item) => setItems((p) => [item, ...p])}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
              {COLUMNS.map((col) => {
                const columnItems = items.filter(
                  (i) => i.status === col.status,
                );
                return (
                  <div key={col.status}>
                    <h2 className="mb-3 text-sm font-semibold text-ink/70">
                      {col.title}{" "}
                      <span className="text-ink/40">
                        ({columnItems.length})
                      </span>
                    </h2>
                    <div className="space-y-3">
                      {columnItems.map((item) => (
                        <ContentCard
                          key={item._id}
                          item={item}
                          onDecide={handleDecide}
                        />
                      ))}
                      {columnItems.length === 0 && (
                        <p className="text-xs text-ink/30">Nothing here yet.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}