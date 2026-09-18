import type {
  AnalysisResult,
  ApplianceShare,
  HourlyUsagePoint,
  Recommendation,
  Tariff,
  UsagePoint,
} from "./types";

/** Mirror of AnalyzeInput — the body shape accepted by every POST endpoint. */
export interface AnalyzeInput {
  daily?: UsagePoint[];
  hourly?: HourlyUsagePoint[];
  tariff?: Tariff;
  applianceShares?: ApplianceShare[];
  baselineMonthlyCost?: number;
  carbonIntensity?: number;
}

const BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE) ||
  "";

/** Build a URL against the GridWise service (relative in browser, absolute in tests). */
function url(path: string) {
  return `${BASE}${path}`;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(url(path), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`GridWise GET ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(url(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GridWise POST ${path} failed: ${res.status} ${text}`.trim(),
    );
  }
  return (await res.json()) as T;
}

export interface HealthPayload {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
  potentialMonthlySavings: number;
  potentialYearlySavings: number;
  potentialKwhReduction: number;
  potentialCo2ReductionKg: number;
  generatedAt: string;
}

export interface ForecastResponse {
  horizons: Array<{
    days: number;
    baselineCost: number;
    optimizedCost: number;
    baselineKwh: number;
    optimizedKwh: number;
    saved: number;
  }>;
  generatedAt: string;
}

export interface AppliancesResponse {
  appliances: ApplianceShare[];
  monthlyCost: number;
  generatedAt: string;
}

/**
 * Typed wrapper for the GridWise service.
 *
 * The base URL is read from `NEXT_PUBLIC_API_BASE`. Set it in `.env.local`
 * to point at the FastAPI service, e.g.:
 *
 *   NEXT_PUBLIC_API_BASE=http://localhost:8000
 *
 * When unset, requests are made to relative paths.
 */
export const gridwise = {
  health: () => getJson<HealthPayload>("/health"),
  analyze: (input: AnalyzeInput = {}) =>
    postJson<AnalysisResult>("/analyze", input),
  recommendations: (input: AnalyzeInput = {}) =>
    postJson<RecommendationsResponse>("/recommendations", input),
  forecast: (input: AnalyzeInput & { horizons?: number[] } = {}) =>
    postJson<ForecastResponse>("/forecast", input),
  appliances: (input: AnalyzeInput = {}) =>
    postJson<AppliancesResponse>("/appliances", input),
};
