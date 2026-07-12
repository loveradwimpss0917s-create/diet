"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

interface WeightPoint {
  recorded_on: string;
  weight_kg: number;
  body_fat_percent: number | null;
}

export function WeightChart({
  data,
  targetWeightKg,
}: {
  data: WeightPoint[];
  targetWeightKg: number | null;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
        記録がありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="recorded_on" tick={{ fontSize: 11 }} minTickGap={24} />
        <YAxis yAxisId="weight" tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
        <YAxis
          yAxisId="fat"
          orientation="right"
          tick={{ fontSize: 11 }}
          domain={[0, 50]}
        />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {targetWeightKg && (
          <ReferenceLine
            yAxisId="weight"
            y={targetWeightKg}
            stroke="#10b981"
            strokeDasharray="4 4"
            label={{ value: "目標", fontSize: 11, fill: "#10b981" }}
          />
        )}
        <Line
          yAxisId="weight"
          type="monotone"
          dataKey="weight_kg"
          name="体重(kg)"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ r: 2 }}
          connectNulls
        />
        <Line
          yAxisId="fat"
          type="monotone"
          dataKey="body_fat_percent"
          name="体脂肪率(%)"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ r: 2 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
