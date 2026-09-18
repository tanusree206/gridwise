"use client";

import { useState } from "react";
import { HourlyChart } from "@/components/charts/hourly-chart";
import { UsageChart } from "@/components/charts/usage-chart";
import { ApplianceDonut } from "@/components/charts/appliance-donut";
import { ScoreGauge } from "@/components/charts/score-gauge";
import { ExplainModal } from "@/components/explain-modal";
import { RecommendationCard } from "@/components/recommendation-card";
import type { AnalysisResult, Recommendation } from "@/lib/types";
import {
  formatCurrency,
  formatKwh,
  formatNumber,
  formatPercent,
  hourLabel,
} from "@/lib/utils";

export function DashboardView({ result }: { result: AnalysisResult }) {
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const top = result.recommendations.slice(0, 6);

  const monthlySavings = result.recommendations.reduce(
    (a, r) => a + r.impact.estimatedMonthlySavings,
    0,
  );
  const yearlyKwhSave = result.recommendations.reduce(
    (a, r) => a + r.impact.kwhReduction,
    0,
  );
  const co2Save = result.recommendations.reduce(
    (a, r) => a + r.impact.co2ReductionKg,
    0,
  );

  return (
    <>
      {/* Top stat row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="30-day usage"
          value={formatKwh(result.totalKwh)}
          hint={`${formatCurrency(result.totalCost)} spent`}
        />
        <StatCard
          label="Daily average"
          value={`${result.avgDailyKwh} kWh`}
          hint="30-day rolling window"
        />
        <StatCard
          label="Peak share"
          value={formatPercent(result.peakShare, 0)}
          hint={`Window ${result.tariff.peakHours
            .map((h) => hourLabel(h))
            .join(" · ")}`}
          tone={
            result.peakShare > 0.35
              ? "warn"
              : result.peakShare > 0.25
                ? "neutral"
                : "good"
          }
        />
        <StatCard
          label="Potential savings"
          value={formatCurrency(monthlySavings)}
          hint={`${formatNumber(yearlyKwhSave)} kWh + ${co2Save} kg CO₂/yr`}
          tone="good"
        />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <CardHeader
            title="Daily energy usage"
            subtitle="kWh consumed per day across the analysis window"
          />
          <UsageChart data={result.daily} />
        </div>
        <div className="card">
          <CardHeader
            title="Efficiency score"
            subtitle="How you compare against an optimized baseline"
          />
          <div className="flex items-center gap-5">
            <ScoreGauge score={result.efficiencyScore} />
            <div className="flex-1 space-y-2 text-sm">
              <p className="text-grid-muted">
                <span className="text-grid-text">Score</span> weighs peak-hour
                usage against off-peak utilization on your tariff.
              </p>
              <div className="flex items-center gap-2">
                <span className="pill border-grid-border bg-grid-surface text-grid-muted">
                  Carbon intensity
                </span>
                <span className="text-grid-text">
                  {result.carbonIntensity} kg/kWh
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly + appliances */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <CardHeader
            title="Hour-of-day consumption"
            subtitle="Red = peak window · amber = shoulder · green = off-peak"
          />
          <HourlyChart data={result.hourly} tariff={result.tariff} />
        </div>
        <div className="card">
          <CardHeader
            title="Where your energy goes"
            subtitle="Monthly share by appliance"
          />
          <ApplianceDonut data={result.appliances} />
          <div className="mt-2 space-y-1.5">
            {result.appliances.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: a.color }}
                  />
                  <span className="text-grid-text">{a.name}</span>
                </div>
                <div className="flex items-center gap-3 text-grid-muted">
                  <span>{formatPercent(a.share, 0)}</span>
                  <span className="font-mono text-grid-accent">
                    {formatCurrency(a.monthlyCost)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-grid-text">
              Top recommendations
            </h2>
            <p className="text-sm text-grid-muted">
              Ranked by yearly savings. Click any card for the evidence trail.
            </p>
          </div>
          <a
            href="/recommendations"
            className="text-xs text-grid-accent hover:underline"
          >
            See all →
          </a>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {top.map((r) => (
            <RecommendationCard
              key={r.id}
              rec={r}
              onSelect={(id) =>
                setSelected(result.recommendations.find((x) => x.id === id) ?? null)
              }
            />
          ))}
        </div>
      </div>

      <ExplainModal rec={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "warn" | "neutral";
}) {
  const dot =
    tone === "good"
      ? "bg-grid-accent shadow-[0_0_8px_rgba(34,211,164,0.7)]"
      : tone === "warn"
        ? "bg-grid-warn shadow-[0_0_8px_rgba(245,158,11,0.7)]"
        : "bg-grid-muted";
  return (
    <div className="card card-hover">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      </div>
      <div className="stat mt-2">{value}</div>
      {hint && <div className="mt-1 text-xs text-grid-muted">{hint}</div>}
    </div>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-grid-text">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-grid-muted">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
