"use client";

import { useState } from "react";

export function TopBar() {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const ranges: { id: "7d" | "30d" | "90d"; label: string }[] = [
    { id: "7d", label: "7 days" },
    { id: "30d", label: "30 days" },
    { id: "90d", label: "90 days" },
  ];
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-grid-text sm:text-2xl">
          Good afternoon, Alex
        </h1>
        <p className="text-sm text-grid-muted">
          Here&apos;s how your home used energy and what GridWise recommends.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-grid-border bg-grid-card p-0.5 text-xs">
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={
                "rounded-md px-2.5 py-1 transition " +
                (range === r.id
                  ? "bg-grid-accent text-grid-bg shadow-glow"
                  : "text-grid-muted hover:text-grid-text")
              }
            >
              {r.label}
            </button>
          ))}
        </div>
        <button className="btn-ghost text-xs">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>
      </div>
    </div>
  );
}
