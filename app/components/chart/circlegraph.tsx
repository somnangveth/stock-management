"use client";

import { PieChart, Pie, ResponsiveContainer, Tooltip, Legend } from "recharts";

export default function CircleGraph({
  data,
  title,
  dataKeys,
  circleColor,
  isAnimatedActive = true,
}: {
  data: Record<string, any>[];  // Example: [{ admin: 10, staff: 20 }]
  title?: string;
  dataKeys: string[];           // Example: ["admin", "staff"]
  circleColor: string[];        // Example: ["#3b82f6", "#10b981"]
  isAnimatedActive?: boolean;
}) {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Title */}
      {title && (
        <h2 className="text-xl font-semibold mb-4 text-center">
          {title}
        </h2>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Tooltip />
          <Legend />

          {dataKeys.map((key, index) => (
            <Pie
              key={key}
              data={data}
              dataKey={key}
              nameKey={key}
              cx="50%"
              cy="50%"
              innerRadius={index === 0 ? 0 : 50}   // first layer = center, next layers = donut
              outerRadius={80 + index * 20}        // multiple layers expand outward
              fill={circleColor[index] || "#8884d8"}
              isAnimationActive={isAnimatedActive}
              label
            />
          ))}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
