"use client";

import { useEffect, useState } from "react";
import type { Recommendation } from "@/lib/types";
import { RecommendationCard } from "@/components/recommendation-card";
import { ExplainModal } from "@/components/explain-modal";
import { formatCurrency } from "@/lib/utils";
import { gridwise } from "@/lib/api-client";

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [selected, setSelected] = useState<Recommendation | null>(null);

  useEffect(() => {
    gridwise
      .recommendations()
      .then((r) => setRecs(r.recommendations))
      .catch(() => setRecs([]));
  }, []);

  if (!recs) {
    return (
      <div className="card animate-pulse">
        <div className="stat-label">Calling the GridWise service…</div>
      </div>
    );
  }

  const total = recs.reduce((a, r) => a + r.impact.estimatedYearlySavings, 0);

  return (
    <>
      <div className="card flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="stat-label">If you adopt all</div>
          <div className="stat mt-1 text-grid-accent">
            {formatCurrency(total)} / year
          </div>
        </div>
        <p className="max-w-md text-sm text-grid-muted">
          Every recommendation is generated from your actual usage signals. Tap
          any card to see exactly which data features drove it.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {recs.map((r) => (
          <RecommendationCard
            key={r.id}
            rec={r}
            selected={selected?.id === r.id}
            onSelect={(id) =>
              setSelected(recs.find((x) => x.id === id) ?? null)
            }
          />
        ))}
      </div>

      <ExplainModal rec={selected} onClose={() => setSelected(null)} />
    </>
  );
}
