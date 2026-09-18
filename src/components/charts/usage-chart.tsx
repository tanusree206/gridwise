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
import type { UsagePoint } from "@/lib/types";
import { formatKwh, shortDate } from "@/lib/utils";

export function UsageChart({ data }: { data: UsagePoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3a4" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#22d3a4" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1c2540" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#8a93b2"
            tickFormatter={(v: string) => shortDate(v)}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            stroke="#8a93b2"
            tickFormatter={(v: number) => `${v}`}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={36}
          />
          <Tooltip
            cursor={{ stroke: "#22d3a4", strokeWidth: 1, strokeDasharray: "4 4" }}
            contentStyle={{
              background: "#0c111d",
              border: "1px solid #1c2540",
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: "#8a93b2" }}
            itemStyle={{ color: "#22d3a4" }}
            formatter={(value: number) => [formatKwh(value), "Usage"]}
            labelFormatter={(label: string) => shortDate(label)}
          />
          <Area
            type="monotone"
            dataKey="kwh"
            stroke="#22d3a4"
            strokeWidth={2}
            fill="url(#usageFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
