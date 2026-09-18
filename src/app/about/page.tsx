import { Logo } from "@/components/logo";
import { analyze } from "@/lib/analyzer";

export const metadata = {
  title: "About · GridWise",
};

export default function AboutPage() {
  const result = analyze();
  const yearlySavings = result.recommendations.reduce(
    (a, r) => a + r.impact.estimatedYearlySavings,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="card flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="rounded-2xl border border-grid-border bg-grid-surface p-3">
          <Logo size={56} />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-grid-text">
            GridWise — AI-Powered Energy Optimization
          </h1>
          <p className="mt-1 text-sm text-grid-muted">
            GridWise turns your electricity bill into a clear action plan. We
            read your usage data, find the patterns that cost you the most, and
            explain — in plain language — exactly how to fix them.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Pillar
          title="Analyze"
          body="Hourly load shapes, always-on baselines, weekday vs weekend swings, weather-correlated spikes — every signal in your data is converted into a feature."
          icon="analyze"
        />
        <Pillar
          title="Optimize"
          body="Each feature is fed into a rule-based recommendation engine that ranks actions by savings, payback, and effort, mapped to your local time-of-use tariff."
          icon="optimize"
        />
        <Pillar
          title="Explain"
          body="Every recommendation comes with the exact data signals that triggered it, weighted by contribution — no black boxes, just evidence."
          icon="explain"
        />
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-grid-text">
          How the model works
        </h3>
        <div className="mt-4 grid gap-3 text-sm text-grid-muted md:grid-cols-2">
          <Step
            n={1}
            title="Ingest"
            body="Daily kWh + cost for the last 30 days, hourly usage profile, regional tariff (peak / shoulder / off-peak rates), and a regional carbon intensity (kg CO₂/kWh)."
          />
          <Step
            n={2}
            title="Feature extraction"
            body="Hourly shape peaks, always-on floor, weekday vs weekend delta, peak-window share, appliance share estimates via shape matching."
          />
          <Step
            n={3}
            title="Rule-based recommendation engine"
            body="Each rule compares observed features against thresholds (peak share, appliance share, hourly shape, etc.) and emits a recommendation only when the signal trips it."
          />
          <Step
            n={4}
            title="Impact estimation"
            body="Savings come from a closed-form model: shifted kWh × tariff delta, or efficiency-adjusted kWh × tariff. CO₂ uses regional carbon intensity × kWh avoided."
          />
          <Step
            n={5}
            title="Evidence trail"
            body="Each recommendation carries a list of contributing features with weights — visible in the Explain modal."
          />
          <Step
            n={6}
            title="Forecast"
            body="Forward 7 / 30 / 90-day bill projections are computed by extrapolating the daily average baseline and subtracting adoption savings."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card">
          <h3 className="text-sm font-semibold text-grid-text">
            Built for trust
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-grid-muted">
            <li>
              <span className="text-grid-text">No data leaves your browser</span>{" "}
              — analysis runs on the client with a transparent sample dataset.
            </li>
            <li>
              <span className="text-grid-text">Explainability by design</span>{" "}
              — every recommendation shows the signals and weights that
              produced it.
            </li>
            <li>
              <span className="text-grid-text">Region-aware</span> — tariff
              windows, carbon intensity, and appliance mix differ by region;
              GridWise exposes them as configurable inputs.
            </li>
          </ul>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-grid-text">
            By the numbers
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Tile label="Recommendations generated" value={`${result.recommendations.length}`} />
            <Tile
              label="Avg monthly savings"
              value={formatCurrency(yearlySavings / 12)}
            />
            <Tile
              label="Peak window"
              value={result.tariff.peakHours.length + " hrs"}
            />
            <Tile
              label="Carbon intensity"
              value={`${result.carbonIntensity} kg/kWh`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Pillar({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: "analyze" | "optimize" | "explain";
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <span className="pill border-grid-accent/40 bg-grid-surface text-grid-accent">
          {icon}
        </span>
        <h3 className="text-base font-semibold text-grid-text">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-grid-muted">{body}</p>
    </div>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-grid-border bg-grid-surface/60 p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-grid-accent/15 font-mono text-xs text-grid-accent">
          {n}
        </span>
        <span className="text-sm font-medium text-grid-text">{title}</span>
      </div>
      <p className="mt-2 text-sm text-grid-muted">{body}</p>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-grid-border bg-grid-surface p-3">
      <div className="text-[10px] uppercase tracking-wider text-grid-muted">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-grid-text">{value}</div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
