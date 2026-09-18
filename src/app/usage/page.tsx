"use client";

import { useEffect, useState } from "react";
import { UsageChart } from "@/components/charts/usage-chart";
import { HourlyChart } from "@/components/charts/hourly-chart";
import { gridwise } from "@/lib/api-client";
import { formatCurrency, formatKwh, hourLabel } from "@/lib/utils";
import type { AnalysisResult } from "@/lib/types";

export default function UsagePage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    gridwise.analyze().then(setResult);
  }, []);

  if (!result) {
    return (
      <div className="card animate-pulse">
        <div className="stat-label">Calling /api/analyze…</div>
      </div>
    );
  }

  const peakHours = result.tariff.peakHours.map(hourLabel).join(", ");
  const peakTotal = result.hourly
    .filter((h) => result.tariff.peakHours.includes(h.hour))
    .reduce((a, b) => a + b.kwh, 0);
  const offTotal = result.hourly
    .filter(
      (h) =>
        !result.tariff.peakHours.includes(h.hour) &&
        !result.tariff.shoulderHours.includes(h.hour),
    )
    .reduce((a, b) => a + b.kwh, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-grid-text">Usage</h1>
        <p className="text-sm text-grid-muted">
          How, when, and how much electricity your home has been drawing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card">
          <div className="stat-label">30-day total</div>
          <div className="stat mt-1">{formatKwh(result.totalKwh)}</div>
          <div className="mt-1 text-xs text-grid-muted">
            {formatCurrency(result.totalCost)} at your tariff
          </div>
        </div>
        <div className="card">
          <div className="stat-label">Peak window</div>
          <div className="stat mt-1 text-grid-warn">{formatKwh(peakTotal)}</div>
          <div className="mt-1 text-xs text-grid-muted">
            {peakHours} · {formatCurrency(peakTotal * result.tariff.peak)}
          </div>
        </div>
        <div className="card">
          <div className="stat-label">Off-peak</div>
          <div className="stat mt-1 text-grid-accent">{formatKwh(offTotal)}</div>
          <div className="mt-1 text-xs text-grid-muted">
            Cheapest window — ideal for scheduling deferrable loads.
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-grid-text">
          Daily energy consumption
        </h3>
        <p className="mt-0.5 text-xs text-grid-muted">
          Pulled from <code className="font-mono">GET /api/analyze</code>.
        </p>
        <div className="mt-4">
          <UsageChart data={result.daily} />
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-grid-text">
          Hour-of-day profile
        </h3>
        <p className="mt-0.5 text-xs text-grid-muted">
          Two humps: morning and evening, the evening one sitting inside the
          red tariff window.
        </p>
        <div className="mt-4">
          <HourlyChart data={result.hourly} tariff={result.tariff} />
        </div>
      </div>
    </div>
  );
}
