import { useState } from "react";

// Status -> brand accent. Deliberately the brand's own warm gradient
// rather than red/green/yellow — 'in_review' reads as "needs a
// considered look" (berry, not alarm-red), 'approved' reads as
// confident and settled (plum, the darkest/most assured tone) rather
// than borrowing an off-palette green that would clash with everything
// else on the page.
const STATUS_STYLES = {
  queued: {
    bg: "bg-canvas-wash/40",
    border: "border-canvas-wash",
    label: "Queued",
    text: "text-plum",
  },
  approved: {
    bg: "bg-plum/5",
    border: "border-plum",
    label: "Approved",
    text: "text-plum",
  },
  in_review: {
    bg: "bg-berry/10",
    border: "border-berry",
    label: "Needs review",
    text: "text-berry",
  },
  rejected: {
    bg: "bg-wine/10",
    border: "border-wine",
    label: "Rejected",
    text: "text-wine",
  },
};

export function ContentCard({ item, onDecide }) {
  const style = STATUS_STYLES[item.status] ?? STATUS_STYLES.queued;
  const showReasoning =
    item.status === "rejected" || item.status === "in_review";
  // A human can act on anything the pipeline hasn't already settled as
  // approved — including a genuine AI rejection, which is a strong
  // signal, not a verdict nobody's allowed to override.
  const canDecide =
    (item.status === "in_review" || item.status === "rejected") &&
    Boolean(onDecide);
  const [pending, setPending] = useState(null); // 'approved' | 'rejected' | null
  const [error, setError] = useState(null);

  async function handleDecide(decision) {
    setError(null);
    setPending(decision);
    try {
      await onDecide(item._id, decision);
    } catch (err) {
      setError(err.message ?? "Could not save that decision.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className={`rounded-xl border-l-4 ${style.border} ${style.bg} p-4`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium capitalize text-ink/60">
          {item.platform} · {item.contentType}
        </span>
        <span className={`text-xs font-semibold ${style.text}`}>
          {style.label}
        </span>
      </div>

      {item.draft?.body ? (
        <p className="text-sm text-ink/90">{item.draft.body}</p>
      ) : (
        <p className="text-sm italic text-ink/40">Generating…</p>
      )}

      {item.draft?.usedFallback && (
        <p className="mt-2 text-xs text-berry/80">
          Drafted without AI (no provider configured) — review before
          publishing.
        </p>
      )}

      {showReasoning && (
        <div className="mt-3 space-y-2 border-t border-ink/10 pt-2">
          {item.complianceResult && (
            <ReasonRow
              label="Compliance"
              usedFallback={item.complianceResult.usedFallback}
              passed={item.complianceResult.passed}
              detail={
                item.complianceResult.issues?.length > 0
                  ? item.complianceResult.issues.join("; ")
                  : item.complianceResult.usedFallback
                    ? "No AI provider configured for this check."
                    : "Passed — no issues raised."
              }
            />
          )}
          {item.qualityResult && (
            <ReasonRow
              label="Quality review"
              usedFallback={item.qualityResult.usedFallback}
              passed={item.qualityResult.approved}
              detail={item.qualityResult.feedback}
            />
          )}
        </div>
      )}

      {canDecide && (
        <div className="mt-3 flex items-center gap-2 border-t border-ink/10 pt-3">
          <button
            type="button"
            onClick={() => handleDecide("approved")}
            disabled={pending !== null}
            className="rounded-lg bg-plum px-3 py-1.5 text-xs font-medium text-canvas hover:opacity-90 disabled:opacity-50"
          >
            {pending === "approved" ? "Approving…" : "Approve"}
          </button>
          <button
            type="button"
            onClick={() => handleDecide("rejected")}
            disabled={pending !== null || item.status === "rejected"}
            className="rounded-lg border border-wine px-3 py-1.5 text-xs font-medium text-wine hover:bg-wine/10 disabled:opacity-50"
          >
            {pending === "rejected" ? "Rejecting…" : "Reject"}
          </button>
          {error && <p className="text-xs text-coral">{error}</p>}
        </div>
      )}
    </div>
  );
}

function ReasonRow({ label, usedFallback, passed, detail }) {
  const badge = usedFallback ? "Unavailable" : passed ? "Passed" : "Flagged";
  const badgeColor = usedFallback || !passed ? "text-wine" : "text-plum/60";
  return (
    <p className="text-xs text-ink/70">
      <span className="font-semibold">{label}:</span>{" "}
      <span className={badgeColor}>{badge}</span>
      {detail && <span className="text-ink/60"> — {detail}</span>}
    </p>
  );
}