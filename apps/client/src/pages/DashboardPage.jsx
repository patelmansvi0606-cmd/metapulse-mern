import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { AppHeader } from "../components/AppHeader.jsx";

export function DashboardPage() {
  const [workspaces, setWorkspaces] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuth();

  async function loadWorkspaces() {
    const { workspaces } = await api.get("/workspaces");
    setWorkspaces(workspaces);
  }

  useEffect(() => {
    loadWorkspaces();
  }, []);

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-plum">
              Your workspaces
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              Signed in as {user?.fullName}
            </p>
          </div>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="rounded-lg bg-plum px-4 py-2 text-sm font-medium text-canvas hover:opacity-90"
          >
            New workspace
          </button>
        </div>

        {showCreate && (
          <CreateWorkspaceForm
            onCreated={() => {
              setShowCreate(false);
              loadWorkspaces();
            }}
          />
        )}

        {workspaces === null ? (
          <p className="text-sm text-ink/60">Loading…</p>
        ) : workspaces.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-warm p-10 text-center">
            <p className="text-ink/70">
              No workspaces yet. Create one to start generating content.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {workspaces.map((w) => (
              <li key={w._id}>
                <Link
                  to={`/w/${w._id}/studio`}
                  className="flex items-center justify-between rounded-xl border border-border-warm bg-canvas p-4 transition-colors hover:border-coral"
                >
                  <div>
                    <p className="font-medium text-plum">{w.name}</p>
                    <p className="text-xs text-ink/50">/{w.slug}</p>
                  </div>
                  <span className="rounded-full bg-canvas-wash/50 px-2.5 py-1 text-xs font-medium text-plum capitalize">
                    {w.role}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function CreateWorkspaceForm({ onCreated }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { workspace } = await api.post("/workspaces", { name, slug });
      onCreated();
      navigate(`/w/${workspace._id}/studio`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not create the workspace.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 flex items-end gap-3 rounded-xl border border-border-warm p-4"
    >
      <label className="flex-1">
        <span className="mb-1 block text-xs font-medium text-ink/70">Name</span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSlug(
              e.target.value
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
            );
          }}
          required
          className="mp-field"
          placeholder="Acme Coffee"
        />
      </label>
      <label className="flex-1">
        <span className="mb-1 block text-xs font-medium text-ink/70">Slug</span>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          className="mp-field"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-berry px-4 py-2.5 text-sm font-medium text-canvas hover:opacity-90 disabled:opacity-50"
      >
        Create
      </button>
      {error && <p className="text-sm text-coral">{error}</p>}
    </form>
  );
}
