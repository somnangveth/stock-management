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
  
  // Calculate total stock quantity
  const totalStockQuantity = productData?.reduce((sum, product: any) => {
    return sum + (product.stock || 0);
  }, 0) || 0;

  return (
    <PanelCard
      icon={Package}
      title="Total Stock"
      mainValue={totalProducts}
      subtitle={`Products`}
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
      {/* Divider */}
      <div className="border-t border-amber-200 pt-3 mt-3">

      </div>
    </PanelCard>
  );
}