// app/admin/purchase/page.tsx
"use client";

import { useState, useCallback } from "react";
import SearchBar from "@/app/components/searchbar";
import POList from "./components/polist";
import { PurchaseOrder } from "@/type/producttype";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import POForm from "./components/poform";

export default function PurchaseOrderPage() {
  const router = useRouter();
  const [view, setView] = useState<"list" | "create">("list");
  const [refreshKey, setRefreshKey] = useState(0);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [searchConfig, setSearchConfig] = useState<{
    searchKeys: (keyof PurchaseOrder)[];
    onSearch: (results: PurchaseOrder[]) => void;
  } | null>(null);

  // POList 数据加载回调 → 注册搜索功能
  const registerSearch = useCallback(
    (data: PurchaseOrder[], onSearch: (results: PurchaseOrder[]) => void, searchKeys: (keyof PurchaseOrder)[]) => {
      setPurchaseOrders(data);
      setSearchConfig({ searchKeys, onSearch });
    },
    []
  );

  // 新增 PO 成功 → 刷新列表
  const handleSuccess = () => {
    setView("list");
    setRefreshKey((prev) => prev + 1);
  };

  const handleBack = () => {
    setView("list");
  };

  const handleCreateNew = () => {
    setView("create");
  };

  if (view === "create") {
    return (
      <POForm 
        onSuccess={handleSuccess} 
        onCancel={handleBack} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题 + 新增按钮 */}
      <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          
          <Button
            onClick={handleCreateNew}
                    className="  bg-yellow-50 border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-700 hover:border-yellow-400 hover:text-zinc-50 font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Purchase Order
          </Button>
        </div>


      {/* 搜索栏 */}
      {searchConfig && (
        <div className="w-1/3">
          <SearchBar
            data={purchaseOrders}
            onSearch={searchConfig.onSearch}
            searchKeys={searchConfig.searchKeys}
            placeholder="Search by PO Number or Vendor Name"
          />
        </div>
      )}

      {/* PO 列表 */}
      <POList 
        refreshKey={refreshKey}
        onDataLoaded={registerSearch}
      />
    </div>
  );
}
