"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HourlyUsagePoint, Tariff } from "@/lib/types";
import { hourLabel } from "@/lib/utils";

export function HourlyChart({
  data,
  tariff,
}: {
  data: HourlyUsagePoint[];
  tariff: Tariff;
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#1c2540" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="hour"
            stroke="#8a93b2"
            tickFormatter={(v: number) => hourLabel(v)}
            tickLine={false}
            axisLine={false}
            fontSize={10}
            interval={1}
          />
          <YAxis
            stroke="#8a93b2"
            tickLine={false}
            axisLine={false}
            fontSize={10}
            width={32}
          />
          <Tooltip
            cursor={{ fill: "rgba(34,211,164,0.08)" }}
            contentStyle={{
              background: "#0c111d",
              border: "1px solid #1c2540",
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: "#8a93b2" }}
            itemStyle={{ color: "#22d3a4" }}
            formatter={(value: number) => [`${value.toFixed(2)} kWh`, "Usage"]}
            labelFormatter={(label: number) => `${hourLabel(label)} (${label}:00)`}
          />
          <Bar dataKey="kwh" radius={[3, 3, 0, 0]}>
            {data.map((d) => {
              const color = tariff.peakHours.includes(d.hour)
                ? "#ef4444"
                : tariff.shoulderHours.includes(d.hour)
                  ? "#f59e0b"
                  : "#22d3a4";
              return <Cell key={d.hour} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
