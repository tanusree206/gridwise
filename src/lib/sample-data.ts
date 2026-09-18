import type { ApplianceShare, HourlyUsagePoint, Tariff, UsagePoint } from "./types";

/** Tariff — typical US time-of-use plan */
export const tariff: Tariff = {
  peak: 0.34,
  shoulder: 0.18,
  offPeak: 0.11,
  peakHours: [16, 17, 18, 19, 20, 21],
  shoulderHours: [12, 13, 14, 15, 22, 23],
};

/** Daily usage for the last 30 days — kWh and cost */
export const dailyUsage: UsagePoint[] = (() => {
  const out: UsagePoint[] = [];
  const start = new Date("2026-08-19T00:00:00Z");
  // Pattern: weekdays higher, weekend slightly lower; some weather-driven spikes
  const profile = [
    28.4, 30.1, 31.6, 29.2, 33.8, 24.1, 22.6, // wk1 (Aug 19 = Wed)
    27.9, 31.0, 32.5, 30.4, 34.2, 23.8, 21.9, // wk2
    29.6, 30.8, 33.1, 31.7, 36.4, 25.0, 22.4, // wk3 — heat wave
    28.2, 29.9, 31.2, 30.5, 32.8, 24.6, 22.1, // wk4
    27.4, 29.0, // wk5
  ];
  for (let i = 0; i < profile.length; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const kwh = profile[i];
    // Mix of tariffs based on a synthetic 24h shape
    const peakShare = 0.42;
    const shoulderShare = 0.28;
    const offShare = 0.30;
    const cost =
      kwh * peakShare * tariff.peak +
      kwh * shoulderShare * tariff.shoulder +
      kwh * offShare * tariff.offPeak;
    out.push({
      date: d.toISOString(),
      kwh: Number(kwh.toFixed(1)),
      cost: Number(cost.toFixed(2)),
    });
  }
  return out;
})();

/** Hour-of-day average kWh usage across the period */
export const hourlyUsage: HourlyUsagePoint[] = (() => {
  // Two peaks: morning (7-9) and evening (18-22)
  const shape = [
    0.55, 0.48, 0.42, 0.40, 0.42, 0.55, // 0-5
    0.85, 1.55, 1.95, 1.20, 0.95, 0.95, // 6-11
    1.05, 1.15, 1.10, 1.20, 1.55, 2.10, // 12-17
    2.45, 2.60, 2.30, 1.75, 1.05, 0.70, // 18-23
  ];
  const total = shape.reduce((a, b) => a + b, 0);
  const dailyAvg = dailyUsage.reduce((a, b) => a + b.kwh, 0) / dailyUsage.length;
  return shape.map((s, hour) => ({
    hour,
    kwh: Number(((s / total) * dailyAvg).toFixed(2)),
  }));
})();

/** Appliance breakdown by share of monthly kWh */
export const appliances: ApplianceShare[] = [
  {
    id: "hvac",
    name: "HVAC & Cooling",
    share: 0.46,
    kwh: 0,
    monthlyCost: 0,
    color: "#22d3a4",
  },
  {
    id: "water_heater",
    name: "Water Heater",
    share: 0.14,
    kwh: 0,
    monthlyCost: 0,
    color: "#60a5fa",
  },
  {
    id: "ev_charger",
    name: "EV Charger",
    share: 0.12,
    kwh: 0,
    monthlyCost: 0,
    color: "#a78bfa",
  },
  {
    id: "refrigerator",
    name: "Refrigerator",
    share: 0.09,
    kwh: 0,
    monthlyCost: 0,
    color: "#f59e0b",
  },
  {
    id: "dryer",
    name: "Dryer",
    share: 0.07,
    kwh: 0,
    monthlyCost: 0,
    color: "#f472b6",
  },
  {
    id: "lighting",
    name: "Lighting",
    share: 0.05,
    kwh: 0,
    monthlyCost: 0,
    color: "#fbbf24",
  },
  {
    id: "entertainment",
    name: "Entertainment",
    share: 0.04,
    kwh: 0,
    monthlyCost: 0,
    color: "#34d399",
  },
  {
    id: "oven",
    name: "Oven & Cooking",
    share: 0.02,
    kwh: 0,
    monthlyCost: 0,
    color: "#fb7185",
  },
  {
    id: "misc",
    name: "Misc always-on",
    share: 0.01,
    kwh: 0,
    monthlyCost: 0,
    color: "#94a3b8",
  },
];

/** Regional grid carbon intensity (kg CO2 per kWh) — US mix ~0.39 */
export const carbonIntensity = 0.39;

/** Household monthly electricity price baseline */
export const baselineMonthlyCost =
  dailyUsage.reduce((a, b) => a + b.cost, 0) /
  (dailyUsage.length / 30);
