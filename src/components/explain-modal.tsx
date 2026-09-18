"use client";

import { useEffect } from "react";
import type { Recommendation } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function ExplainModal({
  rec,
  onClose,
}: {
  rec: Recommendation | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!rec) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rec, onClose]);

  if (!rec) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="card max-h-[85vh] w-full max-w-2xl overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-grid-accent">
              Why this recommendation?
            </div>
            <h2 className="mt-1 text-xl font-semibold text-grid-text">
              {rec.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-grid-muted hover:bg-grid-surface hover:text-grid-text"
            aria-label="Close"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-grid-muted">
          {rec.detail}
        </p>

        <div className="my-5 divider" />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Monthly savings"
            value={formatCurrency(rec.impact.estimatedMonthlySavings)}
          />
          <Stat
            label="Yearly savings"
            value={formatCurrency(rec.impact.estimatedYearlySavings)}
          />
          <Stat
            label="Energy reduction"
            value={`${rec.impact.kwhReduction} kWh`}
          />
          <Stat
            label="CO₂ avoided"
            value={`${rec.impact.co2ReductionKg} kg`}
          />
        </div>

        <div className="mt-6">
          <div className="text-xs uppercase tracking-wider text-grid-muted">
            Explainability — signals that triggered this
          </div>
          <div className="mt-3 space-y-2.5">
            {rec.evidence.map((e, i) => (
              <div
                key={i}
                className="rounded-lg border border-grid-border bg-grid-surface/60 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <code className="rounded bg-grid-bg px-1.5 py-0.5 font-mono text-[11px] text-grid-accent">
                    {e.feature}
                  </code>
                  <span className="text-xs text-grid-muted">
                    {(e.contribution * 100).toFixed(0)}% weight
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-grid-text">
                  {e.observation}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-grid-bg">
                  <div
                    className="h-full rounded-full bg-grid-accent"
                    style={{ width: `${e.contribution * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs text-grid-muted">
            Model: gridwise-v3 · confidence ~92%
          </span>
          <button onClick={onClose} className="btn-primary text-xs">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-grid-border bg-grid-surface p-3">
      <div className="text-[10px] uppercase tracking-wider text-grid-muted">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-grid-text">{value}</div>
    </div>
  );
}
