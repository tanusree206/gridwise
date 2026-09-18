"use client";

import { useState } from "react";

export default function UsagePage() {
  const [monthlyKwh, setMonthlyKwh] = useState("");
  const [monthlyBill, setMonthlyBill] = useState("");
  const [people, setPeople] = useState("");
  const [ac, setAc] = useState("No");
  const [waterHeater, setWaterHeater] = useState("No");
  const [washingMachine, setWashingMachine] = useState("No");
  const [refrigerator, setRefrigerator] = useState("Yes");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);

  async function generatePlan() {
    setLoading(true);
    setPlan("");

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monthlyKwh: Number(monthlyKwh),
          monthlyBill: Number(monthlyBill),
          people: Number(people),
          appliances: {
            ac,
            waterHeater,
            washingMachine,
            refrigerator,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate plan");
      }

      setPlan(data.plan);
    } catch (error) {
      setPlan(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-grid-text">
          My Energy Usage
        </h1>
        <p className="text-sm text-grid-muted">
          Enter your household usage and GridWise will create a personalized
          energy-saving plan.
        </p>
      </div>

      <div className="card space-y-5">
        <h2 className="text-lg font-semibold text-grid-text">
          Tell us about your electricity usage
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-grid-muted">
              Monthly electricity usage (kWh)
            </label>
            <input
              type="number"
              value={monthlyKwh}
              onChange={(e) => setMonthlyKwh(e.target.value)}
              placeholder="Example: 350"
              className="mt-1 w-full rounded-lg border border-grid-border bg-grid-surface px-3 py-2 text-grid-text"
            />
          </div>

          <div>
            <label className="text-sm text-grid-muted">
              Monthly electricity bill
            </label>
            <input
              type="number"
              value={monthlyBill}
              onChange={(e) => setMonthlyBill(e.target.value)}
              placeholder="Example: 3500"
              className="mt-1 w-full rounded-lg border border-grid-border bg-grid-surface px-3 py-2 text-grid-text"
            />
          </div>

          <div>
            <label className="text-sm text-grid-muted">
              Number of people in household
            </label>
            <input
              type="number"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              placeholder="Example: 4"
              className="mt-1 w-full rounded-lg border border-grid-border bg-grid-surface px-3 py-2 text-grid-text"
            />
          </div>

          <div>
            <label className="text-sm text-grid-muted">Air conditioner</label>
            <select
              value={ac}
              onChange={(e) => setAc(e.target.value)}
              className="mt-1 w-full rounded-lg border border-grid-border bg-grid-surface px-3 py-2 text-grid-text"
            >
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-grid-muted">Water heater</label>
            <select
              value={waterHeater}
              onChange={(e) => setWaterHeater(e.target.value)}
              className="mt-1 w-full rounded-lg border border-grid-border bg-grid-surface px-3 py-2 text-grid-text"
            >
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-grid-muted">
              Washing machine
            </label>
            <select
              value={washingMachine}
              onChange={(e) => setWashingMachine(e.target.value)}
              className="mt-1 w-full rounded-lg border border-grid-border bg-grid-surface px-3 py-2 text-grid-text"
            >
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-grid-muted">Refrigerator</label>
            <select
              value={refrigerator}
              onChange={(e) => setRefrigerator(e.target.value)}
              className="mt-1 w-full rounded-lg border border-grid-border bg-grid-surface px-3 py-2 text-grid-text"
            >
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
        </div>

        <button
          onClick={generatePlan}
          disabled={loading || !monthlyKwh || !monthlyBill || !people}
          className="rounded-lg bg-grid-accent px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate My Energy Plan"}
        </button>
      </div>

      {plan && (
        <div className="card">
          <h2 className="text-lg font-semibold text-grid-text">
            Your Personalized Energy Plan
          </h2>

          <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-grid-muted">
            {plan}
          </div>
        </div>
      )}
    </div>
  );
}