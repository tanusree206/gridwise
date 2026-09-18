"use client";

import { useEffect, useState } from "react";
import { DashboardView } from "@/components/dashboard-view";
import { gridwise } from "@/lib/api-client";
import type { AnalysisResult } from "@/lib/types";

export default function HomePage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    gridwise
      .analyze()
      .then((r) => {
        if (alive) setResult(r);
      })
      .catch((e: Error) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <div className="card">
        <div className="stat-label">Service error</div>
        <div className="mt-2 text-sm text-grid-text">{error}</div>
        <p className="mt-2 text-xs text-grid-muted">
          Make sure the GridWise service is running and reachable.
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="card animate-pulse">
        <div className="stat-label">Calling /api/analyze…</div>
        <div className="mt-3 h-6 w-40 rounded bg-grid-surface" />
      </div>
    );
  }

  return <DashboardView result={result} />;
}
