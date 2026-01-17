"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import PanelCard from "../catalog/panelcard";

type SaleItem = {
  created_at?: string;
  createdAt?: string;
  date?: string;
  total_price?: number;
  totalPrice?: number;
  total?: number;
  amount?: number;
  subtotal?: number;
  quantity?: number;
  qty?: number;
};

export default function AverageSalesPanel() {
  const [averageSales, setAverageSales] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 使用同一个 API 端点
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
          setAverageSales(0);
          setTotalSales(0);
          return;
        }

        // 提取销售数量
        const quantities = salesData
          .map((item) => {
            return (
              item.quantity ||
              item.qty ||
              item.amount ||
              1
            );
          })
          .filter((q) => typeof q === "number" && q > 0);

        if (quantities.length === 0) {
          setError("No valid sales data found");
          setAverageSales(0);
          setTotalSales(0);
          return;
        }

        const total = quantities.reduce((sum, q) => sum + q, 0);
        const average = parseFloat((total / quantities.length).toFixed(1));

        setTotalSales(total);
        setAverageSales(average);
      } catch (err) {
        console.error("Failed to fetch sales data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  return (
    <PanelCard
      icon={TrendingUp}
      title="Average Sales"
      mainValue={String(averageSales)}
      subtitle=""
      isLoading={loading}
      error={!!error}
      bgGradient="from-lime-50 to-green-50"
      borderColor="border-green-200"
      iconBgGradient="from-lime-400 to-green-500"
      titleColor="text-green-600"
      valueColor="text-green-600"
      errorMessage={error || "Error Loading Sales"}
    >
      <div className="border-t border-green-200 pt-3 mt-15">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-green-600">Total Sold</span>
          <span className="text-sm font-bold text-green-600">{totalSales} units</span>
        </div>
      </div>
    </PanelCard>
  );
}
