"""GridWise service — FastAPI application.

This is the Python mirror of ``src/app/api/*`` from the Next.js phase.
It exposes the same five endpoints so the front-end ``gridwise`` client
works against either back-end without code changes:

    GET  /health
    POST /analyze
    POST /recommendations
    POST /appliances
    POST /forecast

Run locally with:

    uvicorn service.main:app --reload --port 8000
"""
from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from analyzer import analyze, forecast, potential_savings
from schemas import (
    AnalyzeInput,
    AnalysisResult,
    AppliancesInput,
    AppliancesResponse,
    ForecastHorizon,
    ForecastInput,
    ForecastResponse,
    HealthPayload,
    RecommendationsInput,
    RecommendationsResponse,
)

load_dotenv()

SERVICE_VERSION = "0.1.0"
ALLOWED_ORIGINS = os.getenv("GRIDWISE_ALLOWED_ORIGINS", "*").split(",")

app = FastAPI(
    title="GridWise Service",
    description=(
        "AI-powered energy analysis web service. Accepts a household's "
        "tariff and usage profile, returns efficiency scores, explainable "
        "recommendations, appliance breakdowns, and forwards forecasts."
    ),
    version=SERVICE_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS] or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Endpoints ----------------------------------------------------------


@app.get("/health", response_model=HealthPayload, tags=["meta"])
def health() -> HealthPayload:
    """Liveness probe — used by the dashboard hero card and uptime checks."""
    return HealthPayload(
        status="ok",
        service="gridwise",
        version=SERVICE_VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/analyze", response_model=AnalysisResult, tags=["analysis"])
def analyze_endpoint(payload: Optional[AnalyzeInput] = None) -> AnalysisResult:
    """Full analysis — same shape as the Next.js ``/api/analyze`` route."""
    return analyze(payload)


@app.post(
    "/recommendations",
    response_model=RecommendationsResponse,
    tags=["analysis"],
)
def recommendations_endpoint(
    payload: Optional[RecommendationsInput] = None,
) -> RecommendationsResponse:
    """Return the recommendation catalog + the potential-savings summary."""
    result = analyze(payload)
    savings = potential_savings(result)
    return RecommendationsResponse(
        recommendations=result.recommendations,
        potentialMonthlySavings=savings["monthly"],
        potentialYearlySavings=savings["yearly"],
        potentialKwhReduction=savings["kwh"],
        potentialCo2ReductionKg=savings["co2"],
        generatedAt=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/appliances", response_model=AppliancesResponse, tags=["analysis"])
def appliances_endpoint(
    payload: Optional[AppliancesInput] = None,
) -> AppliancesResponse:
    """Return the appliance breakdown for the analysis period."""
    result = analyze(payload)
    return AppliancesResponse(
        appliances=result.appliances,
        monthlyCost=result.appliances[0].monthly_cost * 0 + sum(
            a.monthly_cost for a in result.appliances
        ),
        generatedAt=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/forecast", response_model=ForecastResponse, tags=["analysis"])
def forecast_endpoint(payload: Optional[ForecastInput] = None) -> ForecastResponse:
    """Project baseline vs optimized bill and kWh forward over N-day horizons."""
    result = analyze(payload)
    horizons: List[int] = (
        list(payload.horizons)
        if payload is not None and payload.horizons
        else [7, 30, 90]
    )
    rows = forecast(result, horizons)
    return ForecastResponse(
        horizons=[ForecastHorizon(**r) for r in rows],
        generatedAt=datetime.now(timezone.utc).isoformat(),
    )


@app.get("/", tags=["meta"])
def root() -> dict:
    """Friendly root response — useful when curling the URL."""
    return {
        "service": "gridwise",
        "version": SERVICE_VERSION,
        "docs": "/docs",
        "health": "/health",
    }
