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
  Legend,
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
        
        console.log("📊 API Response:", result);
        
        // 确保结果是数组
        let salesData: SaleItem[] = [];
        
        if (Array.isArray(result)) {
          salesData = result;
        } else if (result?.data && Array.isArray(result.data)) {
          salesData = result.data;
        } else if (result && typeof result === 'object') {
          salesData = Object.values(result);
        }
        
        console.log("📊 Sales data count:", salesData.length);
        
        if (!salesData || salesData.length === 0) {
          setError("No sales data available");
          setData([]);
          return;
        }
        
        // 按日期分组并聚合数据
        const groupedData: { [key: string]: number } = {};
        let validCount = 0;
        let invalidCount = 0;
        
        salesData.forEach((item, index) => {
          // 获取 created_at 字段（优先使用 created_at）
          const dateField = item.created_at || item.createdAt || item.date;
          
          // 获取金额字段
          const priceField = item.total_price ?? item.totalPrice ?? item.total ?? item.amount ?? item.subtotal;
          
          if (!dateField) {
            console.warn(`⚠️ Item ${index} missing date field:`, item);
            invalidCount++;
            return;
          }
          
          if (priceField === undefined || priceField === null) {
            console.warn(`⚠️ Item ${index} missing price field:`, item);
            invalidCount++;
            return;
          }
          
          try {
            // 解析日期
            const dateObj = new Date(dateField);
            if (isNaN(dateObj.getTime())) {
              console.warn(`⚠️ Invalid date format: ${dateField}`);
              invalidCount++;
              return;
            }
            
            const date = dateObj.toLocaleDateString("en-US");
            
            // 解析金额
            const price = parseFloat(String(priceField));
            if (isNaN(price)) {
              console.warn(`⚠️ Invalid price value: ${priceField}`);
              invalidCount++;
              return;
            }
            
            // 累加到对应日期
            groupedData[date] = (groupedData[date] || 0) + price;
            validCount++;
          } catch (e) {
            console.error(`❌ Error processing item ${index}:`, e, item);
            invalidCount++;
          }
        });

        console.log(`✅ Valid records: ${validCount}, Invalid: ${invalidCount}`);
        console.log("📊 Grouped data:", groupedData);
        
        // 转换为图表数据并排序
        const chartData = Object.entries(groupedData)
          .map(([date, total_price]) => ({
            date,
            total_price: parseFloat(total_price.toFixed(2)),
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        console.log("📊 Final chart data:", chartData);

        if (chartData.length === 0) {
          setError("No valid sales data found");
          return;
        }


        setData(chartData);
      } catch (error) {
        console.error("❌ Failed to fetch sales data:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchSaleItems();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-96 bg-white rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-600 text-sm">Loading sales data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 bg-white rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center p-4">
          <div className="text-red-500 text-2xl">⚠️</div>
          <p className="text-slate-900 font-semibold">Failed to load data</p>
          <p className="text-slate-600 text-sm">{error}</p>
          <p className="text-slate-500 text-xs mt-2">Check console for details</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-96 bg-amber-50rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-slate-300 text-4xl">📊</div>
          <p className="text-slate-600">No sales data available</p>
          <p className="text-slate-500 text-xs">Check if there are sales records in the database</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 bg-white rounded-lg shadow-md p-4 flex flex-col">
      <div className="mb-4">
        <h3 className="text-slate-800 font-bold text-base flex items-center gap-2">
          <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
          Sales Trend
        </h3>
        <p className="text-xs text-slate-500 mt-1">Daily sales amount ({data.length} days)</p>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              stroke="#cbd5e1"
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              stroke="#cbd5e1"
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
              labelFormatter={(label) => `Date: ${label}`}
              formatter={(value: any) => {
                const numValue = parseFloat(String(value));
                return [
                  isNaN(numValue) ? "N/A" : `$${numValue.toFixed(2)}`,
                  "Total Sales",
                ];
              }}
              cursor={{ stroke: "#2563eb", strokeWidth: 2 }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: "10px" }}
              formatter={() => "Daily Sales Amount"}
            />
            <Line
              type="monotone"
              dataKey="total_price"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ fill: "#2563eb", r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}