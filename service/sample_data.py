"""Static sample data for the GridWise analyzer.

This file is the Python mirror of ``src/lib/sample-data.ts`` in the
front-end. When the FastAPI service runs without a caller-supplied
payload, these values are used as defaults so the service still
returns a sensible response.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List

from schemas import (
    ApplianceShare,
    HourlyUsagePoint,
    Tariff,
    UsagePoint,
)

# Tariff — typical US time-of-use plan.
TARIFF: Tariff = Tariff(
    peak=0.34,
    shoulder=0.18,
    off_peak=0.11,
    peak_hours=[16, 17, 18, 19, 20, 21],
    shoulder_hours=[12, 13, 14, 15, 22, 23],
)

# Daily usage profile in kWh for the last 30 days.
_DAILY_KWH_PROFILE: List[float] = [
    28.4, 30.1, 31.6, 29.2, 33.8, 24.1, 22.6,  # wk1 (Aug 19 = Wed)
    27.9, 31.0, 32.5, 30.4, 34.2, 23.8, 21.9,  # wk2
    29.6, 30.8, 33.1, 31.7, 36.4, 25.0, 22.4,  # wk3 — heat wave
    28.2, 29.9, 31.2, 30.5, 32.8, 24.6, 22.1,  # wk4
    27.4, 29.0,  # wk5
]

_START_DATE = datetime(2026, 8, 19, tzinfo=timezone.utc)


def _build_daily_usage() -> List[UsagePoint]:
    peak_share = 0.42
    shoulder_share = 0.28
    off_share = 0.30
    out: List[UsagePoint] = []
    for i, kwh in enumerate(_DAILY_KWH_PROFILE):
        d = _START_DATE + timedelta(days=i)
        cost = (
            kwh * peak_share * TARIFF.peak
            + kwh * shoulder_share * TARIFF.shoulder
            + kwh * off_share * TARIFF.off_peak
        )
        out.append(
            UsagePoint(
                date=d.isoformat(),
                kwh=round(kwh, 1),
                cost=round(cost, 2),
            )
        )
    return out


DAILY_USAGE: List[UsagePoint] = _build_daily_usage()

# Hour-of-day shape (kWh factors, normalized to the daily average).
_HOURLY_SHAPE: List[float] = [
    0.55, 0.48, 0.42, 0.40, 0.42, 0.55,  # 0-5
    0.85, 1.55, 1.95, 1.20, 0.95, 0.95,  # 6-11
    1.05, 1.15, 1.10, 1.20, 1.55, 2.10,  # 12-17
    2.45, 2.60, 2.30, 1.75, 1.05, 0.70,  # 18-23
]


def _build_hourly_usage() -> List[HourlyUsagePoint]:
    total_shape = sum(_HOURLY_SHAPE)
    daily_avg = sum(p.kwh for p in DAILY_USAGE) / len(DAILY_USAGE)
    return [
        HourlyUsagePoint(
            hour=i,
            kwh=round((s / total_shape) * daily_avg, 2),
        )
        for i, s in enumerate(_HOURLY_SHAPE)
    ]


HOURLY_USAGE: List[HourlyUsagePoint] = _build_hourly_usage()

# Appliance breakdown (share of monthly kWh).
APPLIANCES: List[ApplianceShare] = [
    ApplianceShare(id="hvac",          name="HVAC & Cooling",    share=0.46, kwh=0, monthly_cost=0, color="#22d3a4"),
    ApplianceShare(id="water_heater",  name="Water Heater",      share=0.14, kwh=0, monthly_cost=0, color="#60a5fa"),
    ApplianceShare(id="ev_charger",    name="EV Charger",        share=0.12, kwh=0, monthly_cost=0, color="#a78bfa"),
    ApplianceShare(id="refrigerator",  name="Refrigerator",      share=0.09, kwh=0, monthly_cost=0, color="#f59e0b"),
    ApplianceShare(id="dryer",         name="Dryer",             share=0.07, kwh=0, monthly_cost=0, color="#f472b6"),
    ApplianceShare(id="lighting",      name="Lighting",          share=0.05, kwh=0, monthly_cost=0, color="#fbbf24"),
    ApplianceShare(id="entertainment", name="Entertainment",     share=0.04, kwh=0, monthly_cost=0, color="#34d399"),
    ApplianceShare(id="oven",          name="Oven & Cooking",    share=0.02, kwh=0, monthly_cost=0, color="#fb7185"),
    ApplianceShare(id="misc",          name="Misc always-on",    share=0.01, kwh=0, monthly_cost=0, color="#94a3b8"),
]

# Regional grid carbon intensity (kg CO2 per kWh) — US mix ~0.39
CARBON_INTENSITY = 0.39

# Household monthly electricity price baseline.
BASELINE_MONTHLY_COST = sum(p.cost for p in DAILY_USAGE) / (len(DAILY_USAGE) / 30)
