import { useState } from "react";
import { api, ApiError } from "../lib/api.js";

const PLATFORMS = ["facebook", "instagram", "whatsapp"];
const CONTENT_TYPES = ["post", "story", "caption"];

export function GenerateContentForm({ workspaceId, briefId, onQueued }) {
  const [platform, setPlatform] = useState("instagram");
  const [contentType, setContentType] = useState("post");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { contentItem } = await api.post(
        `/workspaces/${workspaceId}/content-runs`,
        {
          briefId,
          platform,
          contentType,
        },
      );
      onQueued(contentItem);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not start the run.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border-warm bg-canvas p-4"
    >
      <label>
        <span className="mb-1 block text-xs font-medium text-ink/70">
          Platform
        </span>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="mp-field capitalize"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="mb-1 block text-xs font-medium text-ink/70">Type</span>
        <select
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          className="mp-field capitalize"
        >
          {CONTENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-coral px-5 py-2.5 text-sm font-medium text-canvas hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Starting…" : "Generate"}
      </button>
      {error && <p className="text-sm text-coral">{error}</p>}
    </form>
  );
}
