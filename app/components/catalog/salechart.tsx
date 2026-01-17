"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartData = {
  date: string;
  total_price: number;
};

type SaleItem = {
  created_at?: string;
  createdAt?: string;
  date?: string;
  total_price?: number;
  totalPrice?: number;
  total?: number;
  amount?: number;
  subtotal?: number;
};

export default function SaleChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSaleItems = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/admin/fetchsales");

        if (!res.ok) {
          throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }

        const result = await res.json();
        let salesData: SaleItem[] = [];

        if (Array.isArray(result)) {
          salesData = result;
        } else if (result?.data && Array.isArray(result.data)) {
          salesData = result.data;
        } else if (result && typeof result === "object") {
          salesData = Object.values(result);
        }

        if (!salesData || salesData.length === 0) {
          setError("No sales data available");
          setData([]);
          return;
        }

        const groupedData: { [key: string]: number } = {};
        let validCount = 0;

        salesData.forEach((item) => {
          const dateField = item.created_at || item.createdAt || item.date;
          const priceField =
            item.total_price ??
            item.totalPrice ??
            item.total ??
            item.amount ??
            item.subtotal;

          if (!dateField || priceField === undefined || priceField === null) {
            return;
          }

          try {
            const dateObj = new Date(dateField);
            if (isNaN(dateObj.getTime())) return;

            const date = dateObj.toLocaleDateString("en-US");
            const price = parseFloat(String(priceField));
            if (isNaN(price)) return;

            groupedData[date] = (groupedData[date] || 0) + price;
            validCount++;
          } catch (e) {
            return;
          }
        });

        const chartData = Object.entries(groupedData)
          .map(([date, total_price]) => ({
            date,
            total_price: parseFloat(total_price.toFixed(2)),
          }))
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

        if (chartData.length === 0) {
          setError("No valid sales data found");
          return;
        }

        setData(chartData);
      } catch (error) {
        console.error("Failed to fetch sales data:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchSaleItems();
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-white rounded-xl shadow p-4 flex items-center justify-center min-h-[280px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-200 border-t-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-xl shadow p-4 flex items-center justify-center min-h-[280px]">
        <div className="text-center">
          <p className="text-amber-600 text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full bg-white rounded-xl shadow p-4 flex items-center justify-center min-h-[280px]">
        <p className="text-slate-400 text-sm">No sales data</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="mb-4">
        <h3 className="text-slate-700 font-semibold text-sm">Sales Trend</h3>
        <p className="text-xs text-slate-400 mt-1">Daily sales ({data.length} days)</p>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#cbd5e1" }}
              stroke="#e2e8f0"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#cbd5e1" }}
              stroke="#e2e8f0"
              tickFormatter={(value) => `$${value}`}
              width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              formatter={(value: any) => {
                const numValue = parseFloat(String(value));
                return [
                  isNaN(numValue) ? "N/A" : `$${numValue.toFixed(2)}`,
                  "Sales",
                ];
              }}
            />
            <Line
              type="monotone"
              dataKey="total_price"
              stroke="#d97706"
              strokeWidth={2}
              dot={{ fill: "#d97706", r: 3 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}