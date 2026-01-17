// ============================================
// components/admin/panels/TotalStockPanel.tsx
// ============================================

"use client";

import { fetchProducts } from "@/app/functions/admin/api/controller";
import { Product } from "@/type/producttype";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import PanelCard from "../catalog/panelcard";

export default function TotalStockPanel() {
  const { data: productData, isLoading, error } = useQuery<Product[]>({
    queryKey: ["total-stocks"],
    queryFn: fetchProducts,
  });

  const totalProducts = productData?.length || 0;
  
  // 计算总库存数量
  const totalStockQuantity = productData?.reduce((sum, product:any) => {
    return sum + (product.stock || 0);
  }, 0) || 0;

  return (
    <PanelCard
      icon={Package}
      title="Total Stock"
      mainValue={totalStockQuantity}
      subtitle=""
      isLoading={isLoading}
      error={!!error}
      onError={() => window.location.reload()}
      bgGradient="from-amber-50 to-yellow-50"
      borderColor="border-amber-200"
      iconBgGradient="from-amber-400 to-yellow-500"
      titleColor="text-amber-600"
      valueColor="text-amber-600"
      errorMessage="Error Loading Products"
    >
      {/* 分割线 */}
      <div className="border-t border-amber-200 pt-3 mt-15">
        {/* 副数据 */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-amber-600">Total Product</span>
          <span className="text-sm font-bold text-amber-600">{totalProducts}</span>
        </div>
      </div>
    </PanelCard>
  );
}
