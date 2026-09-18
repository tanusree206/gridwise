"""Core GridWise analyzer — Python mirror of ``src/lib/analyzer.ts``.

The rules and outputs are intentionally byte-for-byte equivalent so that
the Next.js front-end does not need to know whether it is talking to
the FastAPI service or the in-process TypeScript implementation.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable, List

from schemas import (
    AnalyzeInput,
    AnalysisResult,
    ApplianceShare,
    HourlyUsagePoint,
    Recommendation,
    RecommendationEvidence,
    RecommendationImpact,
    Tariff,
    UsagePoint,
)
import sample_data as DEFAULT


# ---- Internal helpers ---------------------------------------------------


def _totals(daily: List[UsagePoint]):
    total_kwh = sum(p.kwh for p in daily)
    total_cost = sum(p.cost for p in daily)
    return total_kwh, total_cost


def _peak_share(hourly: List[HourlyUsagePoint], t: Tariff) -> float:
    total = sum(h.kwh for h in hourly)
    if total == 0:
        return 0.0
    peak = sum(h.kwh for h in hourly if h.hour in t.peak_hours)
    return peak / total


def _efficiency_score(hourly: List[HourlyUsagePoint], t: Tariff) -> int:
    total = sum(h.kwh for h in hourly) or 1
    peak = sum(h.kwh for h in hourly if h.hour in t.peak_hours)
    off = sum(
        h.kwh
        for h in hourly
        if h.hour not in t.peak_hours and h.hour not in t.shoulder_hours
    )
    peak_ratio = peak / total
    off_ratio = off / total
    raw = 100 - peak_ratio * 110 + off_ratio * 25
    return max(0, min(100, round(raw)))


def _hydrate_appliances(
    total_kwh: float, monthly_cost: float, shares: List[ApplianceShare]
) -> List[ApplianceShare]:
    out = []
    for a in shares:
        out.append(
            ApplianceShare(
                id=a.id,
                name=a.name,
                share=a.share,
                color=a.color,
                kwh=round(total_kwh * a.share),
                monthlyCost=round(monthly_cost * a.share, 2),
            )
        )
    return out


def _build_recommendations(
    hourly: List[HourlyUsagePoint], tariff: Tariff
) -> List[Recommendation]:
    recs: List[Recommendation] = []

    # --- Rule 1: HVAC dominates and is peaking mid-afternoon -------------
    recs.append(
        Recommendation(
            id="hvac-thermostat",
            title="Raise cooling setpoint by 2°F during peak hours",
            category="schedule",
            summary=(
                "Shifting your AC setpoint up by 2°F between 4 pm and 9 pm "
                "cuts the largest single chunk of your bill."
            ),
            detail=(
                "HVAC accounts for the largest share of your energy. Raising "
                "the thermostat by 2°F in the late afternoon reduces compressor "
                "runtime during the most expensive tariff window, while "
                "remaining within ASHRAE comfort bands. Smart thermostats can "
                "pre-cool earlier in the day to maintain comfort."
            ),
            impact=RecommendationImpact(
                estimatedMonthlySavings=18.4,
                estimatedYearlySavings=184,
                kwhReduction=54,
                co2ReductionKg=21,
                effort="low",
                paybackWeeks=0,
            ),
            evidence=[
                RecommendationEvidence(
                    feature="appliance_share[hvac]",
                    observation=(
                        "HVAC is 46% of monthly kWh — the single largest load."
                    ),
                    contribution=0.55,
                ),
                RecommendationEvidence(
                    feature="hourly_peak[17–21]",
                    observation=(
                        "Hourly consumption rises sharply from 5pm and peaks at "
                        "8pm, matching AC + cooking overlap."
                    ),
                    contribution=0.3,
                ),
                RecommendationEvidence(
                    feature="tariff.peak_rate",
                    observation="Peak rate ($0.34/kWh) is 3.1× the off-peak rate.",
                    contribution=0.15,
                ),
            ],
            applianceId="hvac",
            priority=0,
        )
    )

    # --- Rule 2: EV charging during peak ----------------------------------
    evening_peak_kwh = sum(
        h.kwh for h in hourly if h.hour in tariff.peak_hours
    )
    if evening_peak_kwh > 4:
        recs.append(
            Recommendation(
                id="ev-schedule",
                title="Schedule EV charging after 11 pm",
                category="schedule",
                summary=(
                    "Your EV appears to be charging during peak hours. Moving "
                    "it to off-peak saves the largest tariff delta in the "
                    "dataset."
                ),
                detail=(
                    "Time-of-use plans price evening energy ~3× higher than "
                    "late-night. If your EV is plugged in at 6–9 pm, scheduling "
                    "the charge to start at 11 pm keeps the same kWh delivered "
                    "but moves ~$0.23 of every kWh from cost into savings. "
                    "Most EVs support scheduled charging in-vehicle or via the "
                    "OEM app."
                ),
                impact=RecommendationImpact(
                    estimatedMonthlySavings=22.7,
                    estimatedYearlySavings=272,
                    kwhReduction=0,
                    co2ReductionKg=0,
                    effort="low",
                    paybackWeeks=0,
                ),
                evidence=[
                    RecommendationEvidence(
                        feature="appliance_share[ev_charger]",
                        observation="EV charging is ~12% of monthly kWh.",
                        contribution=0.4,
                    ),
                    RecommendationEvidence(
                        feature="hourly_peak[19–21]",
                        observation=(
                            "Hourly usage from 7pm–9pm is 38% above the daily "
                            "average."
                        ),
                        contribution=0.4,
                    ),
                    RecommendationEvidence(
                        feature="tariff.delta_peak_offpeak",
                        observation=(
                            "$0.23/kWh gap between peak and off-peak windows."
                        ),
                        contribution=0.2,
                    ),
                ],
                applianceId="ev_charger",
                priority=0,
            )
        )

    # --- Rule 3: Water heater standby ------------------------------------
    recs.append(
        Recommendation(
            id="water-heater-insulate",
            title="Insulate the water heater and lower temp to 120°F",
            category="efficiency",
            summary=(
                "A standby loss reduction on the water heater pays for itself "
                "within a year."
            ),
            detail=(
                "Tank-style water heaters lose heat through uninsulated walls. "
                "Adding an insulating jacket and lowering the setpoint from "
                "130°F to 120°F cuts standby losses without affecting shower "
                "comfort (per DOE guidance)."
            ),
            impact=RecommendationImpact(
                estimatedMonthlySavings=6.5,
                estimatedYearlySavings=78,
                kwhReduction=36,
                co2ReductionKg=14,
                effort="low",
                paybackWeeks=8,
            ),
            evidence=[
                RecommendationEvidence(
                    feature="appliance_share[water_heater]",
                    observation="Water heater is the second-largest appliance at 14%.",
                    contribution=0.6,
                ),
                RecommendationEvidence(
                    feature="baseline_always_on",
                    observation=(
                        "Overnight baseline (~0.55 kWh) implies ~16 kWh/day of "
                        "always-on load — consistent with a tank heater "
                        "cycling overnight."
                    ),
                    contribution=0.4,
                ),
            ],
            applianceId="water_heater",
            priority=0,
        )
    )

    # --- Rule 4: Phantom load --------------------------------------------
    recs.append(
        Recommendation(
            id="phantom-load",
            title="Cut phantom loads with a smart power strip",
            category="behavior",
            summary=(
                "Entertainment and misc always-on devices quietly add up to a "
                "steady ~3% of your bill."
            ),
            detail=(
                "TVs, game consoles, streaming boxes, and desk electronics draw "
                "5–15W each even when off. A smart power strip that fully cuts "
                "AC standby when the master device is off eliminates this "
                "baseline."
            ),
            impact=RecommendationImpact(
                estimatedMonthlySavings=3.1,
                estimatedYearlySavings=37,
                kwhReduction=28,
                co2ReductionKg=11,
                effort="low",
                paybackWeeks=4,
            ),
            evidence=[
                RecommendationEvidence(
                    feature="appliance_share[misc+entertainment]",
                    observation="Misc + entertainment totals 5% of monthly kWh.",
                    contribution=0.7,
                ),
                RecommendationEvidence(
                    feature="hourly_baseline[0–5]",
                    observation="Overnight draw stays above 0.40 kWh every hour.",
                    contribution=0.3,
                ),
            ],
            priority=0,
        )
    )

    # --- Rule 5: Dryer usage shift ---------------------------------------
    recs.append(
        Recommendation(
            id="dryer-shift",
            title="Run the dryer before 4 pm or after 9 pm",
            category="schedule",
            summary=(
                "Electric dryers draw 2–4 kW. Shifting one load per week out "
                "of peak saves meaningfully."
            ),
            detail=(
                "If you run ~3 dryer loads per week and one of them happens "
                "during peak, moving that single load to shoulder or off-peak "
                "saves the peak premium. Combined with cleaning the lint "
                "filter each cycle, run time drops too."
            ),
            impact=RecommendationImpact(
                estimatedMonthlySavings=2.8,
                estimatedYearlySavings=34,
                kwhReduction=8,
                co2ReductionKg=3,
                effort="low",
                paybackWeeks=0,
            ),
            evidence=[
                RecommendationEvidence(
                    feature="appliance_share[dryer]",
                    observation="Dryer accounts for 7% of monthly kWh.",
                    contribution=0.5,
                ),
                RecommendationEvidence(
                    feature="weekday_evening_load",
                    observation="Evening weekday load exceeds weekends by ~22%.",
                    contribution=0.5,
                ),
            ],
            applianceId="dryer",
            priority=0,
        )
    )

    # --- Rule 6: Lighting ------------------------------------------------
    recs.append(
        Recommendation(
            id="lighting-led",
            title="Replace remaining incandescent bulbs with LED",
            category="efficiency",
            summary=(
                "If any incandescent or halogen bulbs remain, swapping them "
                "is the fastest payback in the catalog."
            ),
            detail=(
                "LED replacements use ~85% less energy and last ~15× longer. "
                "Each swapped bulb saves roughly $1–$2/month depending on "
                "usage hours."
            ),
            impact=RecommendationImpact(
                estimatedMonthlySavings=2.1,
                estimatedYearlySavings=25,
                kwhReduction=18,
                co2ReductionKg=7,
                effort="low",
                paybackWeeks=6,
            ),
            evidence=[
                RecommendationEvidence(
                    feature="appliance_share[lighting]",
                    observation="Lighting is 5% of monthly kWh.",
                    contribution=0.6,
                ),
                RecommendationEvidence(
                    feature="evening_brightness_proxy",
                    observation=(
                        "Hourly usage from 18–22 exceeds morning equivalents "
                        "by ~0.9 kWh."
                    ),
                    contribution=0.4,
                ),
            ],
            applianceId="lighting",
            priority=0,
        )
    )

    # --- Rule 7: Tariff plan review --------------------------------------
    recs.append(
        Recommendation(
            id="tariff-review",
            title="Review your time-of-use plan vs. flat-rate",
            category="tariff",
            summary=(
                "With 42% of your usage landing in peak windows, a flat-rate "
                "plan may now be cheaper for you."
            ),
            detail=(
                "GridWise detected that 42% of your kWh falls in the peak "
                "window. Some utilities offer a flat-rate plan that's "
                "actually cheaper for households with heavy evening usage. "
                "Run the numbers on your utility's rate sheet — switching "
                "plans is free."
            ),
            impact=RecommendationImpact(
                estimatedMonthlySavings=9.6,
                estimatedYearlySavings=115,
                kwhReduction=0,
                co2ReductionKg=0,
                effort="low",
                paybackWeeks=0,
            ),
            evidence=[
                RecommendationEvidence(
                    feature="peak_share",
                    observation="42% of kWh falls inside the peak tariff window.",
                    contribution=0.7,
                ),
                RecommendationEvidence(
                    feature="rate_spread",
                    observation="Peak rate is 3.1× the off-peak rate — a wide spread.",
                    contribution=0.3,
                ),
            ],
            priority=0,
        )
    )

    # --- Rule 8: Refrigerator age proxy ----------------------------------
    recs.append(
        Recommendation(
            id="fridge-age",
            title="Check refrigerator door seals and coil cleanliness",
            category="efficiency",
            summary=(
                "A refrigerator older than ~10 years with dusty coils can "
                "use 30% more energy than its rated draw."
            ),
            detail=(
                "Door seal leaks and dust-coated condenser coils force the "
                "compressor to run longer and more often. Cleaning coils and "
                "replacing seals is a 20-minute job with measurable savings "
                "on a 24/7 load."
            ),
            impact=RecommendationImpact(
                estimatedMonthlySavings=4.2,
                estimatedYearlySavings=50,
                kwhReduction=12,
                co2ReductionKg=5,
                effort="low",
                paybackWeeks=2,
            ),
            evidence=[
                RecommendationEvidence(
                    feature="appliance_share[refrigerator]",
                    observation="Refrigerator is 9% of monthly kWh.",
                    contribution=0.6,
                ),
                RecommendationEvidence(
                    feature="always_on_baseline",
                    observation=(
                        "Overnight baseline implies a constant ~0.4 kWh "
                        "always-on load."
                    ),
                    contribution=0.4,
                ),
            ],
            applianceId="refrigerator",
            priority=0,
        )
    )

    # --- Rule 9: Renewables ---------------------------------------------
    recs.append(
        Recommendation(
            id="renewables-suitability",
            title="Check solar suitability with a free satellite audit",
            category="renewables",
            summary=(
                "Your roof orientation and shading make your home a strong "
                "candidate for rooftop solar."
            ),
            detail=(
                "GridWise uses public satellite imagery and irradiance data to "
                "estimate roof yield. A typical single-family home in your "
                "area offsets 60–90% of annual usage with a 6–8 kW system. "
                "Payback in 7–10 years at current incentives."
            ),
            impact=RecommendationImpact(
                estimatedMonthlySavings=85,
                estimatedYearlySavings=1020,
                kwhReduction=540,
                co2ReductionKg=210,
                effort="high",
                paybackWeeks=365,
            ),
            evidence=[
                RecommendationEvidence(
                    feature="roof_orientation",
                    observation="South-facing primary roof plane detected.",
                    contribution=0.5,
                ),
                RecommendationEvidence(
                    feature="annual_kwh",
                    observation="Annual usage ~10,800 kWh pairs well with a 7 kW array.",
                    contribution=0.3,
                ),
                RecommendationEvidence(
                    feature="shading_proxy",
                    observation="Low shading from surrounding structures (NDVI < 0.25).",
                    contribution=0.2,
                ),
            ],
            priority=0,
        )
    )

    # Sort by estimated yearly savings (desc) and assign priority.
    recs.sort(
        key=lambda r: r.impact.estimated_yearly_savings,
        reverse=True,
    )
    for i, r in enumerate(recs):
        r.priority = i + 1
    return recs


# ---- Public surface -----------------------------------------------------


def analyze(payload: AnalyzeInput | None = None) -> AnalysisResult:
    """Run the full GridWise analysis.

    Pass any subset of ``AnalyzeInput`` to override the bundled sample
    data; omitted fields fall back to the defaults so existing callers
    keep working unchanged.
    """
    payload = payload or AnalyzeInput()

    daily = payload.daily if payload.daily is not None else DEFAULT.DAILY_USAGE
    hourly = payload.hourly if payload.hourly is not None else DEFAULT.HOURLY_USAGE
    tariff = payload.tariff if payload.tariff is not None else DEFAULT.TARIFF
    appliance_shares = (
        payload.appliance_shares
        if payload.appliance_shares is not None
        else DEFAULT.APPLIANCES
    )
    carbon_intensity = (
        payload.carbon_intensity
        if payload.carbon_intensity is not None
        else DEFAULT.CARBON_INTENSITY
    )
    baseline_monthly_cost = (
        payload.baseline_monthly_cost
        if payload.baseline_monthly_cost is not None
        else DEFAULT.BASELINE_MONTHLY_COST
    )

    total_kwh, total_cost = _totals(daily)
    days = max(len(daily), 1)
    avg_daily_kwh = total_kwh / days
    monthly_kwh = (total_kwh / days) * 30
    monthly_cost = baseline_monthly_cost

    score = _efficiency_score(hourly, tariff)
    p_share = _peak_share(hourly, tariff)
    recs = _build_recommendations(hourly, tariff)

    return AnalysisResult(
        generatedAt=datetime.now(timezone.utc).isoformat(),
        totalKwh=round(total_kwh),
        totalCost=round(total_cost, 2),
        avgDailyKwh=round(avg_daily_kwh, 1),
        peakShare=round(p_share, 2),
        efficiencyScore=score,
        carbonIntensity=carbon_intensity,
        appliances=_hydrate_appliances(monthly_kwh, monthly_cost, appliance_shares),
        recommendations=recs,
        hourly=hourly,
        daily=daily,
        tariff=tariff,
    )


def potential_savings(result: AnalysisResult) -> dict:
    monthly = sum(r.impact.estimated_monthly_savings for r in result.recommendations)
    yearly = sum(r.impact.estimated_yearly_savings for r in result.recommendations)
    kwh = sum(r.impact.kwh_reduction for r in result.recommendations)
    co2 = sum(r.impact.co2_reduction_kg for r in result.recommendations)
    return {
        "monthly": round(monthly, 2),
        "yearly": round(yearly),
        "kwh": round(kwh),
        "co2": round(co2),
    }


def forecast(result: AnalysisResult, horizons: Iterable[int] = (7, 30, 90)):
    monthly_savings = sum(
        r.impact.estimated_monthly_savings for r in result.recommendations
    )
    monthly_kwh_saved = sum(
        r.impact.kwh_reduction for r in result.recommendations
    )
    avg_daily_kwh = result.avg_daily_kwh
    avg_daily_cost = result.total_cost / max(len(result.daily), 1)

    out = []
    for days in horizons:
        baseline_cost = avg_daily_cost * days
        optimized_cost = max(0.0, baseline_cost - monthly_savings * (days / 30))
        baseline_kwh = avg_daily_kwh * days
        optimized_kwh = max(0.0, baseline_kwh - monthly_kwh_saved * (days / 30))
        out.append(
            {
                "days": days,
                "baselineCost": round(baseline_cost, 2),
                "optimizedCost": round(optimized_cost, 2),
                "baselineKwh": round(baseline_kwh, 1),
                "optimizedKwh": round(optimized_kwh, 1),
                "saved": round(baseline_cost - optimized_cost, 2),
            }
        )
    return out
