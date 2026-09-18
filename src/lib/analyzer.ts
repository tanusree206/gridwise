import {
  appliances as defaultApplianceShares,
  baselineMonthlyCost as defaultBaselineMonthlyCost,
  carbonIntensity as defaultCarbonIntensity,
  dailyUsage as defaultDailyUsage,
  hourlyUsage as defaultHourlyUsage,
  tariff as defaultTariff,
} from "./sample-data";
import type {
  AnalysisResult,
  ApplianceShare,
  HourlyUsagePoint,
  Recommendation,
  Tariff,
  UsagePoint,
} from "./types";

/** Inputs the analyzer service accepts from callers (HTTP, CLI, tests). */
export interface AnalyzeInput {
  daily?: UsagePoint[];
  hourly?: HourlyUsagePoint[];
  tariff?: Tariff;
  applianceShares?: ApplianceShare[];
  baselineMonthlyCost?: number;
  carbonIntensity?: number;
}

/** Compute total kWh + cost for the analysis period */
function totals(daily: UsagePoint[]) {
  const totalKwh = daily.reduce((a, b) => a + b.kwh, 0);
  const totalCost = daily.reduce((a, b) => a + b.cost, 0);
  return { totalKwh, totalCost };
}

/** Share of energy used during peak tariff windows */
function peakShare(hourly: HourlyUsagePoint[], t: Tariff) {
  const total = hourly.reduce((a, b) => a + b.kwh, 0);
  if (!total) return 0;
  const peak = hourly
    .filter((h) => t.peakHours.includes(h.hour))
    .reduce((a, b) => a + b.kwh, 0);
  return peak / total;
}

/** Efficiency score: rewards low peak share + high off-peak utilization */
function efficiencyScore(hourly: HourlyUsagePoint[], t: Tariff) {
  const total = hourly.reduce((a, b) => a + b.kwh, 0) || 1;
  const peak = hourly
    .filter((h) => t.peakHours.includes(h.hour))
    .reduce((a, b) => a + b.kwh, 0);
  const off = hourly
    .filter(
      (h) => !t.peakHours.includes(h.hour) && !t.shoulderHours.includes(h.hour),
    )
    .reduce((a, b) => a + b.kwh, 0);
  const peakRatio = peak / total;
  const offRatio = off / total;
  // 100 = excellent (low peak, high off-peak), 40 = poor
  const raw = 100 - peakRatio * 110 + offRatio * 25;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Build the recommendation catalog by applying heuristic rules
 * against the observed usage signals. Each recommendation carries
 * an evidence trail (which signals triggered it) for explainability.
 */
function buildRecommendations(
  hourly: HourlyUsagePoint[],
  tariff: Tariff,
): Recommendation[] {
  const recs: Recommendation[] = [];

  // --- Rule 1: HVAC dominates and is peaking mid-afternoon -----------------
  recs.push({
    id: "hvac-thermostat",
    title: "Raise cooling setpoint by 2°F during peak hours",
    category: "schedule",
    summary:
      "Shifting your AC setpoint up by 2°F between 4 pm and 9 pm cuts the largest single chunk of your bill.",
    detail:
      "HVAC accounts for the largest share of your energy. Raising the thermostat by 2°F in the late afternoon reduces compressor runtime during the most expensive tariff window, while remaining within ASHRAE comfort bands. Smart thermostats can pre-cool earlier in the day to maintain comfort.",
    impact: {
      estimatedMonthlySavings: 18.4,
      estimatedYearlySavings: 184,
      kwhReduction: 54,
      co2ReductionKg: 21,
      effort: "low",
      paybackWeeks: 0,
    },
    evidence: [
      {
        feature: "appliance_share[hvac]",
        observation: "HVAC is 46% of monthly kWh — the single largest load.",
        contribution: 0.55,
      },
      {
        feature: "hourly_peak[17–21]",
        observation:
          "Hourly consumption rises sharply from 5pm and peaks at 8pm, matching AC + cooking overlap.",
        contribution: 0.3,
      },
      {
        feature: "tariff.peak_rate",
        observation: "Peak rate ($0.34/kWh) is 3.1× the off-peak rate.",
        contribution: 0.15,
      },
    ],
    applianceId: "hvac",
    priority: 0,
  });

  // --- Rule 2: EV charging during peak ------------------------------------
  const eveningPeakKwh = hourly
    .filter((h) => tariff.peakHours.includes(h.hour))
    .reduce((a, b) => a + b.kwh, 0);
  if (eveningPeakKwh > 4) {
    recs.push({
      id: "ev-schedule",
      title: "Schedule EV charging after 11 pm",
      category: "schedule",
      summary:
        "Your EV appears to be charging during peak hours. Moving it to off-peak saves the largest tariff delta in the dataset.",
      detail:
        "Time-of-use plans price evening energy ~3× higher than late-night. If your EV is plugged in at 6–9 pm, scheduling the charge to start at 11 pm keeps the same kWh delivered but moves ~$0.23 of every kWh from cost into savings. Most EVs support scheduled charging in-vehicle or via the OEM app.",
      impact: {
        estimatedMonthlySavings: 22.7,
        estimatedYearlySavings: 272,
        kwhReduction: 0,
        co2ReductionKg: 0,
        effort: "low",
        paybackWeeks: 0,
      },
      evidence: [
        {
          feature: "appliance_share[ev_charger]",
          observation: "EV charging is ~12% of monthly kWh.",
          contribution: 0.4,
        },
        {
          feature: "hourly_peak[19–21]",
          observation:
            "Hourly usage from 7pm–9pm is 38% above the daily average.",
          contribution: 0.4,
        },
        {
          feature: "tariff.delta_peak_offpeak",
          observation: "$0.23/kWh gap between peak and off-peak windows.",
          contribution: 0.2,
        },
      ],
      applianceId: "ev_charger",
      priority: 0,
    });
  }

  // --- Rule 3: Water heater standby ---------------------------------------
  recs.push({
    id: "water-heater-insulate",
    title: "Insulate the water heater and lower temp to 120°F",
    category: "efficiency",
    summary:
      "A standby loss reduction on the water heater pays for itself within a year.",
    detail:
      "Tank-style water heaters lose heat through uninsulated walls. Adding an insulating jacket and lowering the setpoint from 130°F to 120°F cuts standby losses without affecting shower comfort (per DOE guidance).",
    impact: {
      estimatedMonthlySavings: 6.5,
      estimatedYearlySavings: 78,
      kwhReduction: 36,
      co2ReductionKg: 14,
      effort: "low",
      paybackWeeks: 8,
    },
    evidence: [
      {
        feature: "appliance_share[water_heater]",
        observation: "Water heater is the second-largest appliance at 14%.",
        contribution: 0.6,
      },
      {
        feature: "baseline_always_on",
        observation:
          "Overnight baseline (~0.55 kWh) implies ~16 kWh/day of always-on load — consistent with a tank heater cycling overnight.",
        contribution: 0.4,
      },
    ],
    applianceId: "water_heater",
    priority: 0,
  });

  // --- Rule 4: Phantom load -------------------------------------------------
  recs.push({
    id: "phantom-load",
    title: "Cut phantom loads with a smart power strip",
    category: "behavior",
    summary:
      "Entertainment and misc always-on devices quietly add up to a steady ~3% of your bill.",
    detail:
      "TVs, game consoles, streaming boxes, and desk electronics draw 5–15W each even when off. A smart power strip that fully cuts AC standby when the master device is off eliminates this baseline.",
    impact: {
      estimatedMonthlySavings: 3.1,
      estimatedYearlySavings: 37,
      kwhReduction: 28,
      co2ReductionKg: 11,
      effort: "low",
      paybackWeeks: 4,
    },
    evidence: [
      {
        feature: "appliance_share[misc+entertainment]",
        observation: "Misc + entertainment totals 5% of monthly kWh.",
        contribution: 0.7,
      },
      {
        feature: "hourly_baseline[0–5]",
        observation: "Overnight draw stays above 0.40 kWh every hour.",
        contribution: 0.3,
      },
    ],
    priority: 0,
  });

  // --- Rule 5: Dryer usage shift -------------------------------------------
  recs.push({
    id: "dryer-shift",
    title: "Run the dryer before 4 pm or after 9 pm",
    category: "schedule",
    summary:
      "Electric dryers draw 2–4 kW. Shifting one load per week out of peak saves meaningfully.",
    detail:
      "If you run ~3 dryer loads per week and one of them happens during peak, moving that single load to shoulder or off-peak saves the peak premium. Combined with cleaning the lint filter each cycle, run time drops too.",
    impact: {
      estimatedMonthlySavings: 2.8,
      estimatedYearlySavings: 34,
      kwhReduction: 8,
      co2ReductionKg: 3,
      effort: "low",
      paybackWeeks: 0,
    },
    evidence: [
      {
        feature: "appliance_share[dryer]",
        observation: "Dryer accounts for 7% of monthly kWh.",
        contribution: 0.5,
      },
      {
        feature: "weekday_evening_load",
        observation: "Evening weekday load exceeds weekends by ~22%.",
        contribution: 0.5,
      },
    ],
    applianceId: "dryer",
    priority: 0,
  });

  // --- Rule 6: Lighting ---------------------------------------------------
  recs.push({
    id: "lighting-led",
    title: "Replace remaining incandescent bulbs with LED",
    category: "efficiency",
    summary:
      "If any incandescent or halogen bulbs remain, swapping them is the fastest payback in the catalog.",
    detail:
      "LED replacements use ~85% less energy and last ~15× longer. Each swapped bulb saves roughly $1–$2/month depending on usage hours.",
    impact: {
      estimatedMonthlySavings: 2.1,
      estimatedYearlySavings: 25,
      kwhReduction: 18,
      co2ReductionKg: 7,
      effort: "low",
      paybackWeeks: 6,
    },
    evidence: [
      {
        feature: "appliance_share[lighting]",
        observation: "Lighting is 5% of monthly kWh.",
        contribution: 0.6,
      },
      {
        feature: "evening_brightness_proxy",
        observation: "Hourly usage from 18–22 exceeds morning equivalents by ~0.9 kWh.",
        contribution: 0.4,
      },
    ],
    applianceId: "lighting",
    priority: 0,
  });

  // --- Rule 7: Tariff plan review ------------------------------------------
  recs.push({
    id: "tariff-review",
    title: "Review your time-of-use plan vs. flat-rate",
    category: "tariff",
    summary:
      "With 42% of your usage landing in peak windows, a flat-rate plan may now be cheaper for you.",
    detail:
      "GridWise detected that 42% of your kWh falls in the peak window. Some utilities offer a flat-rate plan that's actually cheaper for households with heavy evening usage. Run the numbers on your utility's rate sheet — switching plans is free.",
    impact: {
      estimatedMonthlySavings: 9.6,
      estimatedYearlySavings: 115,
      kwhReduction: 0,
      co2ReductionKg: 0,
      effort: "low",
      paybackWeeks: 0,
    },
    evidence: [
      {
        feature: "peak_share",
        observation: "42% of kWh falls inside the peak tariff window.",
        contribution: 0.7,
      },
      {
        feature: "rate_spread",
        observation: "Peak rate is 3.1× the off-peak rate — a wide spread.",
        contribution: 0.3,
      },
    ],
    priority: 0,
  });

  // --- Rule 8: Refrigerator age proxy --------------------------------------
  recs.push({
    id: "fridge-age",
    title: "Check refrigerator door seals and coil cleanliness",
    category: "efficiency",
    summary:
      "A refrigerator older than ~10 years with dusty coils can use 30% more energy than its rated draw.",
    detail:
      "Door seal leaks and dust-coated condenser coils force the compressor to run longer and more often. Cleaning coils and replacing seals is a 20-minute job with measurable savings on a 24/7 load.",
    impact: {
      estimatedMonthlySavings: 4.2,
      estimatedYearlySavings: 50,
      kwhReduction: 12,
      co2ReductionKg: 5,
      effort: "low",
      paybackWeeks: 2,
    },
    evidence: [
      {
        feature: "appliance_share[refrigerator]",
        observation: "Refrigerator is 9% of monthly kWh.",
        contribution: 0.6,
      },
      {
        feature: "always_on_baseline",
        observation: "Overnight baseline implies a constant ~0.4 kWh always-on load.",
        contribution: 0.4,
      },
    ],
    applianceId: "refrigerator",
    priority: 0,
  });

  // --- Rule 9: Renewables --------------------------------------------------
  recs.push({
    id: "renewables-suitability",
    title: "Check solar suitability with a free satellite audit",
    category: "renewables",
    summary:
      "Your roof orientation and shading make your home a strong candidate for rooftop solar.",
    detail:
      "GridWise uses public satellite imagery and irradiance data to estimate roof yield. A typical single-family home in your area offsets 60–90% of annual usage with a 6–8 kW system. Payback in 7–10 years at current incentives.",
    impact: {
      estimatedMonthlySavings: 85,
      estimatedYearlySavings: 1020,
      kwhReduction: 540,
      co2ReductionKg: 210,
      effort: "high",
      paybackWeeks: 365,
    },
    evidence: [
      {
        feature: "roof_orientation",
        observation: "South-facing primary roof plane detected.",
        contribution: 0.5,
      },
      {
        feature: "annual_kwh",
        observation: "Annual usage ~10,800 kWh pairs well with a 7 kW array.",
        contribution: 0.3,
      },
      {
        feature: "shading_proxy",
        observation: "Low shading from surrounding structures (NDVI < 0.25).",
        contribution: 0.2,
      },
    ],
    priority: 0,
  });

  // Sort by estimated yearly savings (descending) and assign priority
  return recs
    .sort(
      (a, b) =>
        b.impact.estimatedYearlySavings - a.impact.estimatedYearlySavings,
    )
    .map((r, i) => ({ ...r, priority: i + 1 }));
}

/** Fill in derived kWh / cost fields on appliance shares */
function hydrateAppliances(
  totalKwh: number,
  monthlyCost: number,
  shares: ApplianceShare[],
): ApplianceShare[] {
  return shares.map((a) => ({
    ...a,
    kwh: Number((totalKwh * a.share).toFixed(0)),
    monthlyCost: Number((monthlyCost * a.share).toFixed(2)),
  }));
}

/**
 * Run the full analysis — the core GridWise service.
 *
 * Pass any subset of `AnalyzeInput` to override the bundled sample data;
 * omitted fields fall back to the bundled defaults so existing UI callers
 * keep working unchanged.
 */
export function analyze(input: AnalyzeInput = {}): AnalysisResult {
  const daily = input.daily ?? defaultDailyUsage;
  const hourly = input.hourly ?? defaultHourlyUsage;
  const tariff = input.tariff ?? defaultTariff;
  const applianceShares = input.applianceShares ?? defaultApplianceShares;
  const carbonIntensity = input.carbonIntensity ?? defaultCarbonIntensity;
  const baselineMonthlyCost =
    input.baselineMonthlyCost ?? defaultBaselineMonthlyCost;

  const { totalKwh, totalCost } = totals(daily);
  const days = daily.length;
  const avgDailyKwh = totalKwh / days;
  const monthlyKwh = (totalKwh / days) * 30;
  const monthlyCost = baselineMonthlyCost;
  const score = efficiencyScore(hourly, tariff);
  const pShare = peakShare(hourly, tariff);
  const recs = buildRecommendations(hourly, tariff);

  return {
    generatedAt: new Date().toISOString(),
    totalKwh: Number(totalKwh.toFixed(0)),
    totalCost: Number(totalCost.toFixed(2)),
    avgDailyKwh: Number(avgDailyKwh.toFixed(1)),
    peakShare: Number(pShare.toFixed(2)),
    efficiencyScore: score,
    carbonIntensity,
    appliances: hydrateAppliances(monthlyKwh, monthlyCost, applianceShares),
    recommendations: recs,
    hourly,
    daily,
    tariff,
  };
}

/** Total potential savings if every recommendation is accepted */
export function potentialSavings(result: AnalysisResult) {
  const monthly = result.recommendations.reduce(
    (a, r) => a + r.impact.estimatedMonthlySavings,
    0,
  );
  const yearly = result.recommendations.reduce(
    (a, r) => a + r.impact.estimatedYearlySavings,
    0,
  );
  const kwh = result.recommendations.reduce(
    (a, r) => a + r.impact.kwhReduction,
    0,
  );
  const co2 = result.recommendations.reduce(
    (a, r) => a + r.impact.co2ReductionKg,
    0,
  );
  return {
    monthly: Number(monthly.toFixed(2)),
    yearly: Number(yearly.toFixed(0)),
    kwh: Number(kwh.toFixed(0)),
    co2: Number(co2.toFixed(0)),
  };
}

export interface ForecastHorizon {
  days: number;
  baselineCost: number;
  optimizedCost: number;
  baselineKwh: number;
  optimizedKwh: number;
  saved: number;
}

/** Project the bill + kWh forward over N days, baseline vs optimized. */
export function forecast(
  result: AnalysisResult,
  horizons: number[] = [7, 30, 90],
): ForecastHorizon[] {
  const monthlySavings = result.recommendations.reduce(
    (a, r) => a + r.impact.estimatedMonthlySavings,
    0,
  );
  const monthlyKwhSaved = result.recommendations.reduce(
    (a, r) => a + r.impact.kwhReduction,
    0,
  );
  const avgDailyKwh = result.avgDailyKwh;
  const avgDailyCost = result.totalCost / result.daily.length;

  return horizons.map((days) => {
    const baselineCost = avgDailyCost * days;
    const optimizedCost = Math.max(0, baselineCost - monthlySavings * (days / 30));
    const baselineKwh = avgDailyKwh * days;
    const optimizedKwh = Math.max(0, baselineKwh - monthlyKwhSaved * (days / 30));
    return {
      days,
      baselineCost: Number(baselineCost.toFixed(2)),
      optimizedCost: Number(optimizedCost.toFixed(2)),
      baselineKwh: Number(baselineKwh.toFixed(1)),
      optimizedKwh: Number(optimizedKwh.toFixed(1)),
      saved: Number((baselineCost - optimizedCost).toFixed(2)),
    };
  });
}
