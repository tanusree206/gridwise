"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatKwh } from "@/lib/utils";

export default function ForecastChart({
  series,
}: {
  series: {
    day: number;
    baseline: number;
    optimized: number;
  }[];
}) {
  return (
    <div className="mt-4 h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={series}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="fcBase" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="fcOpt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3a4" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#22d3a4" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="#1c2540"
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="day"
            stroke="#8a93b2"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            tickFormatter={(v: number) => `D${v}`}
          />

          <YAxis
            stroke="#8a93b2"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={42}
          />

          <Tooltip
            contentStyle={{
              background: "#0c111d",
              border: "1px solid #1c2540",
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: "#8a93b2" }}
            formatter={(value: number, name: string) => [
              formatKwh(value),
              name === "baseline" ? "Baseline" : "Optimized",
            ]}
            labelFormatter={(label: number) => `Day ${label}`}
          />

          <Area
            type="monotone"
            dataKey="baseline"
            stroke="#ef4444"
            fill="url(#fcBase)"
            strokeWidth={2}
          />

          <Area
            type="monotone"
            dataKey="optimized"
            stroke="#22d3a4"
            fill="url(#fcOpt)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}