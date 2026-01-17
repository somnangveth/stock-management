// ============================================
// 文件 4: components/admin/panels/ExpiryStockPanel.tsx
// ============================================

"use client";

import { getExpiredBatches } from "@/app/functions/admin/stock/expiry/expiry";
import { Product } from "@/type/producttype";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import PanelCard from "../catalog/panelcard";

export default function ExpiryStockPanel() {
  const { data: expiredBatches, isLoading, error } = useQuery({
    queryKey: ["expiredQuery"],
    queryFn: getExpiredBatches,
  });

  // 计算过期数量
  const expiryCount = useMemo(() => {
    if (!expiredBatches) return 0;
    const expired = expiredBatches.filter((e: Product) => e.alert_type === "expired");
    return expired.length;
  }, [expiredBatches]);

  const panelContent = (
    <div className="h-40">

      <PanelCard
        icon={AlertCircle}
        title="Expiry Stock"
        mainValue={expiryCount || 0}
        subtitle=""
        isLoading={isLoading}
        error={!!error}
        onError={() => window.location.reload()}
        bgGradient="from-red-50 to-orange-50"
        borderColor="border-red-200"
        iconBgGradient="from-red-400 to-orange-500"
        titleColor="text-red-600"
        valueColor="text-red-600"
        errorMessage="Error Loading Expiry"
      >
        
        {/* 分割线 */}
<div className="border-t border-red-200 pt-3 mt-15">
          {/* 副标题和数据 */}
          <div className=" flex items-center justify-between">
            <span className="text-xs font-medium text-red-600">Need to handle</span>
            <span className="text-sm font-bold text-red-600">{expiryCount}</span>
          </div>
        </div>
      
      </PanelCard>
      </div>
   
  );

  // 如果有错误，直接显示，不包裹在 Link 中
  if (error) {
    return panelContent;
  }

  // 正常情况下用 Link 包裹
  return (
    <Link href="/admin/stock/components/expirypanel" className="hover:opacity-90 transition-opacity block">
      {panelContent}
    </Link>
  );
}
