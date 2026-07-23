import { useState } from "react";
import { api, ApiError } from "../lib/api.js";

const TONES = ["professional", "playful", "bold", "warm"];

export function BriefForm({ workspaceId, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    industry: "",
    targetAudience: "",
    tone: "professional",
    goals: "",
    restrictedTopics: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { brief } = await api.post(`/workspaces/${workspaceId}/briefs`, {
        ...form,
        restrictedTopics: form.restrictedTopics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onCreated(brief);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not save the brief.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border-warm bg-canvas p-6">
      <h2 className="mb-1 font-display text-xl font-semibold text-plum">
        Tell us about the brand
      </h2>
      <p className="mb-5 text-sm text-ink/60">
        Every post the Content Graph writes is grounded in this — it's the one
        thing every stage of the pipeline reads from.
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <label className="col-span-2">
          <span className="mb-1 block text-xs font-medium text-ink/70">
            Brand name
          </span>
          <input
            required
            value={form.name}
            onChange={set("name")}
            className="mp-field"
            placeholder="Acme Coffee"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-ink/70">
            Industry
          </span>
          <input
            required
            value={form.industry}
            onChange={set("industry")}
            className="mp-field"
            placeholder="coffee roasting"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-ink/70">
            Tone
          </span>
          <select
            value={form.tone}
            onChange={set("tone")}
            className="mp-field capitalize"
          >
            {TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2">
          <span className="mb-1 block text-xs font-medium text-ink/70">
            Target audience
          </span>
          <input
            required
            value={form.targetAudience}
            onChange={set("targetAudience")}
            className="mp-field"
            placeholder="young professionals who care about ethical sourcing"
          />
        </label>
        <label className="col-span-2">
          <span className="mb-1 block text-xs font-medium text-ink/70">
            Goals
          </span>
          <input
            required
            value={form.goals}
            onChange={set("goals")}
            className="mp-field"
            placeholder="grow foot traffic to the new location"
          />
        </label>
        <label className="col-span-2">
          <span className="mb-1 block text-xs font-medium text-ink/70">
            Restricted topics (comma-separated, optional)
          </span>
          <input
            value={form.restrictedTopics}
            onChange={set("restrictedTopics")}
            className="mp-field"
            placeholder="health claims, competitor names"
          />
        </label>
        {error && <p className="col-span-2 text-sm text-coral">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="col-span-2 rounded-lg bg-plum px-4 py-2.5 text-sm font-medium text-canvas hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save brief"}
        </button>
      </form>
    </div>
  );
}
