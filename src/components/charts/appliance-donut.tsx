"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ApplianceShare } from "@/lib/types";
import { formatKwh } from "@/lib/utils";

export function ApplianceDonut({ data }: { data: ApplianceShare[] }) {
  return (
    <div className="relative h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="share"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            stroke="#06080f"
            strokeWidth={2}
          >
            {data.map((entry) => (
              <Cell key={entry.id} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#0c111d",
              border: "1px solid #1c2540",
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: "#e6ecff" }}
            itemStyle={{ color: "#22d3a4" }}
            formatter={(value: number, _name, item) => {
              const payload = item?.payload as ApplianceShare | undefined;
              return [
                `${(value * 100).toFixed(1)}% · ${formatKwh(payload?.kwh ?? 0)}`,
                payload?.name ?? "",
              ];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="stat-label">Top load</span>
        <span className="text-lg font-semibold text-grid-text">
          {data[0]?.name}
        </span>
        <span className="text-xs text-grid-accent">
          {(data[0]?.share * 100).toFixed(0)}% of usage
        </span>
      </div>
    </div>
  );
}
