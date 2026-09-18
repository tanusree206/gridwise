import { analyze } from "@/lib/analyzer";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatKwh, hourLabel } from "@/lib/utils";

export const metadata = {
  title: "Forecast · GridWise",
};

function project(result: ReturnType<typeof analyze>, days: number) {
  const avgKwh = result.avgDailyKwh;
  const avgCost = result.totalCost / result.daily.length;
  const baselineCost = avgCost * days;
  const optimizedCost =
    baselineCost -
    result.recommendations.reduce((a, r) => a + r.impact.estimatedMonthlySavings, 0) *
      (days / 30);
  const baselineKwh = avgKwh * days;
  const optimizedKwh =
    baselineKwh -
    result.recommendations.reduce((a, r) => a + r.impact.kwhReduction, 0) *
      (days / 30);
  return {
    days,
    baselineCost: Number(baselineCost.toFixed(2)),
    optimizedCost: Number(Math.max(0, optimizedCost).toFixed(2)),
    baselineKwh: Number(baselineKwh.toFixed(1)),
    optimizedKwh: Number(Math.max(0, optimizedKwh).toFixed(1)),
    saved: Number((baselineCost - Math.max(0, optimizedCost)).toFixed(2)),
  };
}

export default function ForecastPage() {
  const result = analyze();
  const horizons = [7, 30, 90].map((d) => project(result, d));

  // Build a 30-day forward projection shape for the chart
  const series = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const baseline = result.avgDailyKwh * day;
    const savedPerDay =
      result.recommendations.reduce(
        (a, r) => a + r.impact.kwhReduction,
        0,
      ) / 30;
    return {
      day,
      baseline: Number(baseline.toFixed(1)),
      optimized: Number(Math.max(0, baseline - savedPerDay * day).toFixed(1)),
    };
  });

  const peakHours = result.tariff.peakHours.map(hourLabel).join(", ");
  const monthlySavings = result.recommendations.reduce(
    (a, r) => a + r.impact.estimatedMonthlySavings,
    0,
  );
  const yearlyKwh = result.recommendations.reduce(
    (a, r) => a + r.impact.kwhReduction,
    0,
  );
  const yearlyCo2 = result.recommendations.reduce(
    (a, r) => a + r.impact.co2ReductionKg,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-grid-text">Forecast</h1>
        <p className="text-sm text-grid-muted">
          Where your bill is headed if nothing changes — and where it goes if
          you accept GridWise&apos;s recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {horizons.map((h) => (
          <div key={h.days} className="card">
            <div className="stat-label">Next {h.days} days</div>
            <div className="stat mt-1">{formatCurrency(h.baselineCost)}</div>
            <div className="mt-1 text-xs text-grid-muted">
              Baseline projection at current usage
            </div>
            <div className="my-3 divider" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-grid-muted">With GridWise</span>
              <span className="font-mono text-grid-accent">
                {formatCurrency(h.optimizedCost)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-grid-muted">Saved</span>
              <span className="font-mono text-grid-accent">
                {formatCurrency(h.saved)}
              </span>
            </div>
            <div className="mt-3 text-xs text-grid-muted">
              {formatKwh(h.optimizedKwh)} projected vs{" "}
              {formatKwh(h.baselineKwh)} baseline
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-grid-text">
          30-day cumulative kWh projection
        </h3>
        <p className="mt-0.5 text-xs text-grid-muted">
          Cumulative kWh with no changes vs cumulative kWh after applying all
          recommendations.
        </p>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={series}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fcBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fcOpt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3a4" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22d3a4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#1c2540"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                stroke="#8a93b2"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                tickFormatter={(v: number) => `D${v}`}
              />
              <YAxis
                stroke="#8a93b2"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={42}
              />
              <Tooltip
                contentStyle={{
                  background: "#0c111d",
                  border: "1px solid #1c2540",
                  borderRadius: 10,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#8a93b2" }}
                formatter={(value: number, name: string) => [
                  formatKwh(value),
                  name === "baseline" ? "Baseline" : "Optimized",
                ]}
                labelFormatter={(label: number) => `Day ${label}`}
              />
              <Area
                type="monotone"
                dataKey="baseline"
                stroke="#ef4444"
                fill="url(#fcBase)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="optimized"
                stroke="#22d3a4"
                fill="url(#fcOpt)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-grid-text">
          Annual opportunity
        </h3>
        <p className="mt-0.5 text-xs text-grid-muted">
          If you adopt the entire recommendation set:
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Stat label="Money saved / yr" value={formatCurrency(monthlySavings * 12)} />
          <Stat label="kWh saved / yr" value={formatKwh(yearlyKwh * 12)} />
          <Stat label="CO₂ avoided / yr" value={`${yearlyCo2 * 12} kg`} />
          <Stat
            label="Peak window"
            value={peakHours || "—"}
            small
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-lg border border-grid-border bg-grid-surface p-3">
      <div className="text-[10px] uppercase tracking-wider text-grid-muted">
        {label}
      </div>
      <div
        className={
          small
            ? "mt-1 text-sm font-semibold text-grid-text"
            : "mt-1 text-base font-semibold text-grid-text"
        }
      >
        {value}
      </div>
    </div>
  );
}
