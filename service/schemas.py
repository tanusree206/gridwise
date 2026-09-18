"""Pydantic models for the GridWise service.

These are the Python mirror of ``src/lib/types.ts``.  Every model uses
``Field(alias=...)`` so the JSON shape stays identical to the TypeScript
front-end — callers that hit the FastAPI service see the same keys they
saw from the Next.js ``/api/*`` routes.
"""
from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

# ---- Primitive shapes ----------------------------------------------------


class UsagePoint(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    date: str
    kwh: float
    cost: float


class HourlyUsagePoint(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    hour: int = Field(..., ge=0, le=23)
    kwh: float


class ApplianceShare(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    share: float
    kwh: float = 0
    monthly_cost: float = Field(0, alias="monthlyCost")
    color: str = "#94a3b8"


class Tariff(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    peak: float
    shoulder: float
    off_peak: float = Field(..., alias="offPeak")
    peak_hours: List[int] = Field(..., alias="peakHours")
    shoulder_hours: List[int] = Field(..., alias="shoulderHours")


# ---- Recommendation sub-shapes -----------------------------------------

RecommendationCategory = Literal[
    "schedule", "efficiency", "behavior", "tariff", "renewables"
]
EffortLevel = Literal["low", "medium", "high"]


class RecommendationImpact(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    estimated_monthly_savings: float = Field(..., alias="estimatedMonthlySavings")
    estimated_yearly_savings: float = Field(..., alias="estimatedYearlySavings")
    kwh_reduction: float = Field(..., alias="kwhReduction")
    co2_reduction_kg: float = Field(..., alias="co2ReductionKg")
    effort: EffortLevel
    payback_weeks: float = Field(..., alias="paybackWeeks")


class RecommendationEvidence(BaseModel):
    feature: str
    observation: str
    contribution: float


class Recommendation(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    category: RecommendationCategory
    summary: str
    detail: str
    impact: RecommendationImpact
    evidence: List[RecommendationEvidence]
    appliance_id: Optional[str] = Field(None, alias="applianceId")
    priority: int


# ---- Top-level analysis output -----------------------------------------

class AnalysisResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    generated_at: str = Field(..., alias="generatedAt")
    total_kwh: float = Field(..., alias="totalKwh")
    total_cost: float = Field(..., alias="totalCost")
    avg_daily_kwh: float = Field(..., alias="avgDailyKwh")
    peak_share: float = Field(..., alias="peakShare")
    efficiency_score: int = Field(..., alias="efficiencyScore")
    carbon_intensity: float = Field(..., alias="carbonIntensity")
    appliances: List[ApplianceShare]
    recommendations: List[Recommendation]
    hourly: List[HourlyUsagePoint]
    daily: List[UsagePoint]
    tariff: Tariff


class ForecastHorizon(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    days: int
    baseline_cost: float = Field(..., alias="baselineCost")
    optimized_cost: float = Field(..., alias="optimizedCost")
    baseline_kwh: float = Field(..., alias="baselineKwh")
    optimized_kwh: float = Field(..., alias="optimizedKwh")
    saved: float


class ForecastResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    horizons: List[ForecastHorizon]
    generated_at: str = Field(..., alias="generatedAt")


class RecommendationsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    recommendations: List[Recommendation]
    potential_monthly_savings: float = Field(..., alias="potentialMonthlySavings")
    potential_yearly_savings: float = Field(..., alias="potentialYearlySavings")
    potential_kwh_reduction: float = Field(..., alias="potentialKwhReduction")
    potential_co2_reduction_kg: float = Field(..., alias="potentialCo2ReductionKg")
    generated_at: str = Field(..., alias="generatedAt")


class AppliancesResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    appliances: List[ApplianceShare]
    monthly_cost: float = Field(..., alias="monthlyCost")
    generated_at: str = Field(..., alias="generatedAt")


class HealthPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    status: str
    service: str
    version: str
    timestamp: str


# ---- Caller-supplied inputs --------------------------------------------

class AnalyzeInput(BaseModel):
    """Subset of fields a caller may override when calling the service."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    daily: Optional[List[UsagePoint]] = None
    hourly: Optional[List[HourlyUsagePoint]] = None
    tariff: Optional[Tariff] = None
    appliance_shares: Optional[List[ApplianceShare]] = Field(None, alias="applianceShares")
    baseline_monthly_cost: Optional[float] = Field(None, alias="baselineMonthlyCost")
    carbon_intensity: Optional[float] = Field(None, alias="carbonIntensity")


class ForecastInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    daily: Optional[List[UsagePoint]] = None
    hourly: Optional[List[HourlyUsagePoint]] = None
    tariff: Optional[Tariff] = None
    appliance_shares: Optional[List[ApplianceShare]] = Field(None, alias="applianceShares")
    baseline_monthly_cost: Optional[float] = Field(None, alias="baselineMonthlyCost")
    carbon_intensity: Optional[float] = Field(None, alias="carbonIntensity")
    horizons: Optional[List[int]] = None


class RecommendationsInput(AnalyzeInput):
    pass


class AppliancesInput(AnalyzeInput):
    pass
