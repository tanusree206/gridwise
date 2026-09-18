import { analyze } from "@/lib/analyzer";
import { ApplianceDonut } from "@/components/charts/appliance-donut";
import {
  formatCurrency,
  formatKwh,
  formatPercent,
} from "@/lib/utils";
import type { ApplianceShare } from "@/lib/types";

export const metadata = {
  title: "Appliances · GridWise",
};

export default function AppliancesPage() {
  const result = analyze();
  const total = result.appliances.reduce((a, b) => a + b.kwh, 0);
  const totalCost = result.appliances.reduce((a, b) => a + b.monthlyCost, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-grid-text">Appliances</h1>
        <p className="text-sm text-grid-muted">
          GridWise disaggregates your total usage into per-appliance shares using
          hourly shape matching, always-on baselines, and signature spikes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card xl:col-span-1">
          <h3 className="text-sm font-semibold text-grid-text">
            Monthly share by appliance
          </h3>
          <p className="mt-0.5 text-xs text-grid-muted">
            Hover the donut for kWh and % share.
          </p>
          <div className="mt-2">
            <ApplianceDonut data={result.appliances} />
          </div>
        </div>

        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-grid-text">
                Breakdown
              </h3>
              <p className="mt-0.5 text-xs text-grid-muted">
                {formatKwh(total)} · {formatCurrency(totalCost)} this month
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-grid-muted">
                  <th className="pb-2 font-medium">Appliance</th>
                  <th className="pb-2 font-medium">Share</th>
                  <th className="pb-2 font-medium">kWh / mo</th>
                  <th className="pb-2 font-medium text-right">Cost / mo</th>
                </tr>
              </thead>
              <tbody>
                {result.appliances.map((a: ApplianceShare) => (
                  <tr
                    key={a.id}
                    className="border-t border-grid-border/60"
                  >
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: a.color }}
                        />
                        <span className="text-grid-text">{a.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-10 text-grid-muted">
                          {formatPercent(a.share, 0)}
                        </span>
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-grid-bg">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${a.share * 100}%`,
                              background: a.color,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-grid-text">
                      {formatKwh(a.kwh)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-grid-accent">
                      {formatCurrency(a.monthlyCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-grid-text">
          How GridWise disaggregates your usage
        </h3>
        <ul className="mt-3 grid gap-2 text-sm text-grid-muted sm:grid-cols-2">
          <li className="rounded-lg border border-grid-border bg-grid-surface/60 p-3">
            <span className="text-grid-text">Hourly shape matching</span> —
            HVAC, water heating, and cooking produce recognizable 24-hour
            signatures.
          </li>
          <li className="rounded-lg border border-grid-border bg-grid-surface/60 p-3">
            <span className="text-grid-text">Always-on baseline</span> —
            overnight minimum draw points to refrigerators and standby loads.
          </li>
          <li className="rounded-lg border border-grid-border bg-grid-surface/60 p-3">
            <span className="text-grid-text">Spike detection</span> — dryer
            and oven create short, high-kW spikes; EV charging creates a
            long, low-rate draw.
          </li>
          <li className="rounded-lg border border-grid-border bg-grid-surface/60 p-3">
            <span className="text-grid-text">Tariff overlay</span> — the same
            appliance can be cheap or expensive depending on when it runs.
          </li>
        </ul>
      </div>
    </div>
  );
}
