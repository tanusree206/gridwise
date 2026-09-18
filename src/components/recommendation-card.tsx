"use client";

import { useState } from "react";
import type { Recommendation } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const categoryStyles: Record<
  Recommendation["category"],
  { label: string; color: string }
> = {
  schedule: { label: "Scheduling", color: "border-grid-info/40 text-grid-info" },
  efficiency: {
    label: "Efficiency",
    color: "border-grid-accent/40 text-grid-accent",
  },
  behavior: {
    label: "Behavior",
    color: "border-grid-violet/40 text-grid-violet",
  },
  tariff: {
    label: "Tariff",
    color: "border-grid-warn/40 text-grid-warn",
  },
  renewables: {
    label: "Renewables",
    color: "border-emerald-300/40 text-emerald-300",
  },
};

export function RecommendationCard({
  rec,
  onSelect,
  selected,
}: {
  rec: Recommendation;
  onSelect?: (id: string) => void;
  selected?: boolean;
}) {
  const style = categoryStyles[rec.category];
  return (
    <button
      onClick={() => onSelect?.(rec.id)}
      className={cn(
        "card card-hover group w-full text-left",
        selected && "ring-2 ring-grid-accent/50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "pill bg-grid-surface",
              style.color,
            )}
          >
            {style.label}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-grid-muted">
            Priority {rec.priority}
          </span>
        </div>
        <div className="text-right">
          <div className="text-base font-semibold text-grid-accent">
            {formatCurrency(rec.impact.estimatedMonthlySavings)}
            <span className="text-xs text-grid-muted">/mo</span>
          </div>
        </div>
      </div>
      <h3 className="mt-3 text-base font-medium leading-snug text-grid-text">
        {rec.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-grid-muted">
        {rec.summary}
      </p>
      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-grid-muted">
          <span className="inline-flex items-center gap-1">
            <Dot /> {rec.impact.effort} effort
          </span>
          <span className="inline-flex items-center gap-1">
            <Dot /> Saves {rec.impact.kwhReduction} kWh/mo
          </span>
          <span className="inline-flex items-center gap-1">
            <Dot /> −{rec.impact.co2ReductionKg} kg CO₂
          </span>
        </div>
        <span className="text-grid-accent opacity-0 transition group-hover:opacity-100">
          Why? →
        </span>
      </div>
    </button>
  );
}

function Dot() {
  return <span className="inline-block h-1 w-1 rounded-full bg-grid-muted" />;
}
