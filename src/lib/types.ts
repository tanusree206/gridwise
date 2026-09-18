export type ApplianceId =
  | "hvac"
  | "water_heater"
  | "ev_charger"
  | "oven"
  | "dryer"
  | "refrigerator"
  | "lighting"
  | "entertainment"
  | "misc";

export interface UsagePoint {
  /** ISO date — daily resolution */
  date: string;
  kwh: number;
  /** USD cost for the day */
  cost: number;
}

export interface HourlyUsagePoint {
  /** 0-23 hour of day */
  hour: number;
  kwh: number;
}

export interface ApplianceShare {
  id: ApplianceId;
  name: string;
  share: number; // 0..1
  kwh: number;
  monthlyCost: number;
  color: string;
}

export interface Tariff {
  /** USD per kWh during the labeled window */
  peak: number;
  shoulder: number;
  offPeak: number;
  /** Hours (0-23) considered peak */
  peakHours: number[];
  /** Hours considered shoulder */
  shoulderHours: number[];
}

export type RecommendationCategory =
  | "schedule"
  | "efficiency"
  | "behavior"
  | "tariff"
  | "renewables";

export interface RecommendationImpact {
  estimatedMonthlySavings: number;
  estimatedYearlySavings: number;
  kwhReduction: number;
  co2ReductionKg: number;
  effort: "low" | "medium" | "high";
  paybackWeeks?: number;
}

export interface RecommendationEvidence {
  feature: string;
  observation: string;
  contribution: number; // 0..1
}

export interface Recommendation {
  id: string;
  title: string;
  category: RecommendationCategory;
  summary: string;
  detail: string;
  impact: RecommendationImpact;
  evidence: RecommendationEvidence[];
  applianceId?: ApplianceId;
  priority: number; // 1 (top) .. n
}

export interface AnalysisResult {
  generatedAt: string;
  totalKwh: number;
  totalCost: number;
  avgDailyKwh: number;
  peakShare: number;
  efficiencyScore: number; // 0..100
  carbonIntensity: number; // kg CO2 / kWh
  appliances: ApplianceShare[];
  recommendations: Recommendation[];
  hourly: HourlyUsagePoint[];
  daily: UsagePoint[];
  tariff: Tariff;
}
