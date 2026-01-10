"use client";
import { CriticalExpiryCatalog, HighExpiryCatalog, MediumExpiryCatalog } from "@/app/components/catalog/expirycatalog";
import { AdjustmentCatalog, StockMovementCatalog, ReturnCatalog, DamageCatalog } from "@/app/components/catalog/stockmovementcatalog";
import { fetchBatch, fetchPricesB2C, fetchProducts, fetchStockMovement } from "@/app/functions/admin/api/controller";
import { getExpiredBatches } from "@/app/functions/admin/stock/expiry/expiry";
import { ExpiryAlert, Product, ProductBatch } from "@/type/producttype";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import DisposeForm from "./components/adddisposeform";

type StockMovement = {
  movement_id: string | number;
  product_id: string | number;
  batch_id?: string | number;
  movement_type: "adjustment" | "return" | "damage";
  quantity: number;
  cost_loss?: number;
  movement_date: string;
  reason?: string;
};

export default function ExpiryStockMovementPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"expiry" | "movements">("expiry");
  const [movementFilter, setMovementFilter] = useState<"all" | "adjustment" | "return" | "damage">("all");
  
  const result = useQueries({
    queries: [
      {
        queryKey: ["batchQuery"],
        queryFn: fetchBatch,
      },
      {
        queryKey: ["expiryQuery"],
        queryFn: getExpiredBatches,
      },
      {
        queryKey: ["productQuery"],
        queryFn: fetchProducts,
      },
      {
        queryKey: ["priceQuery"],
        queryFn: fetchPricesB2C,
      },
      {
        queryKey: ["stockmovementQuery"],
        queryFn: fetchStockMovement
      }
    ]
  });

  const batchData = result[0].data;
  const expiryData = result[1].data;
  const productData = result[2].data;
  const priceData = result[3].data;
  const stockMovementData = result[4].data;

  const isLoading = result.some(r => r.isLoading);

  // Merge expiry data
  const getItemData = (expiry: ExpiryAlert) => {
    if (!batchData || !productData || !priceData) return null;
    
    const batch = batchData.find((b: ProductBatch) => b.batch_id === expiry.batch_id);
    const product = productData.find((p: Product) => p.product_id === expiry.product_id);
    const price = priceData.find((pr: any) => pr.product_id === expiry.product_id);
    
    return {
      ...expiry,
      ...batch,
      ...product,
      ...price,
      batch_id: expiry.batch_id,
      product_id: expiry.product_id,
      quantity_disposed: batch?.quantity || 0,
      batch_number: batch?.batch_number || "N/A",
      product_name: product?.product_name || "",
      quantity_remaining: batch?.quantity_remaining || 0,
      base_price: price?.base_price,
    };
  };

  // Merge stock movement data with product info
  const enhancedMovements = useMemo(() => {
    if (!stockMovementData || !productData || !batchData) return [];
    
    return stockMovementData.map((movement: StockMovement) => {
      const product = productData.find((p: Product) => p.product_id === movement.product_id);
      const batch = movement.batch_id 
        ? batchData.find((b: ProductBatch) => b.batch_id === movement.batch_id)
        : null;
      
      return {
        ...movement,
        product_name: product?.product_name || `Product ${movement.product_id}`,
        product_image: product?.product_image,
        batch_number: batch?.batch_number || `BATCH-${movement.movement_id}`,
      };
    });
  }, [stockMovementData, productData, batchData]);

  // Filter movements by type
  const filteredMovements = useMemo(() => {
    if (movementFilter === "all") return enhancedMovements;
    return enhancedMovements.filter((m: any) => m.movement_type === movementFilter);
  }, [enhancedMovements, movementFilter]);

  // Critical Expiry (Expired)
  const criticalExpiry = useMemo(() => {
    if (!expiryData) return [];
    return expiryData.filter((e: ExpiryAlert) => e.alert_type === "expired");
  }, [expiryData]);

  // High Expiry (Expiring Soon)
  const highExpiry = useMemo(() => {
    if (!expiryData) return [];
    return expiryData.filter((e: ExpiryAlert) => e.alert_type === "expiring_soon");
  }, [expiryData]);

  // Medium Expiry (Near Expiry)
  const mediumExpiry = useMemo(() => {
    if (!expiryData) return [];
    return expiryData.filter((e: ExpiryAlert) => e.alert_type === "near_expiry");
  }, [expiryData]);

  // Check if there are any alerts
  const hasExpiryAlerts = criticalExpiry.length > 0 || highExpiry.length > 0 || mediumExpiry.length > 0;
  const hasMovements = enhancedMovements.length > 0;

  // Count movements by type
  const movementCounts = useMemo(() => {
    return {
      all: enhancedMovements.length,
      adjustment: enhancedMovements.filter((m: any) => m.movement_type === "adjustment").length,
      return: enhancedMovements.filter((m: any) => m.movement_type === "return").length,
      damage: enhancedMovements.filter((m: any) => m.movement_type === "damage").length,
    };
  }, [enhancedMovements]);

  return (
    <>
      <button
        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        onClick={() => router.push("/admin/stock")}
      >
        <ArrowLeft className="mr-2" />
        <p>Back to main page</p>
      </button>
      
      <div className="flex-1 border-b-4 border-gray-300 mt-5"></div>

      {/* Tab Navigation */}
      <div className="mt-5 flex gap-4 border-b border-gray-300">
        <button
          onClick={() => setActiveTab("expiry")}
          className={`px-6 py-3 font-semibold transition-colors relative ${
            activeTab === "expiry"
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Expiry Alerts
          {hasExpiryAlerts && (
            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
              {criticalExpiry.length + highExpiry.length + mediumExpiry.length}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab("movements")}
          className={`px-6 py-3 font-semibold transition-colors relative ${
            activeTab === "movements"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Stock Movements
          {hasMovements && (
            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-500 rounded-full">
              {enhancedMovements.length}
            </span>
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="mt-5 text-center text-gray-500">
          Loading data...
        </div>
      ) : (
        <>
          {/* EXPIRY TAB */}
          {activeTab === "expiry" && (
            <>
              {!hasExpiryAlerts ? (
                <div className="mt-5 text-center text-gray-500 py-10">
                  <p className="text-lg font-medium">No expiry alerts at this time</p>
                  <p className="text-sm mt-2">All products are within safe expiry ranges</p>
                </div>
              ) : (
                <div className="space-y-4 mt-5">
                  {/* Show Critical first (highest priority) */}
                  {criticalExpiry.length > 0 && (
                    <CriticalExpiryCatalog 
                      expired={criticalExpiry.map(getItemData).filter(Boolean)}
                      renderForm={(item: any) => <DisposeForm dispose={item} />}
                    />
                  )}
                  
                  {/* Show High second */}
                  {highExpiry.length > 0 && (
                    <HighExpiryCatalog 
                      expired={highExpiry.map(getItemData).filter(Boolean)}
                      renderForm={(item: any) => <DisposeForm dispose={item} />}
                    />
                  )}
                  
                  {/* Show Medium last (lowest priority) */}
                  {mediumExpiry.length > 0 && (
                    <MediumExpiryCatalog 
                      expired={mediumExpiry.map(getItemData).filter(Boolean)}
                      renderForm={(item: any) => <DisposeForm dispose={item} />}
                    />
                  )}
                </div>
              )}
            </>
          )}

          {/* STOCK MOVEMENTS TAB */}
          {activeTab === "movements" && (
            <>
              {/* Movement Type Filters */}
              <div className="mt-5 flex gap-3 flex-wrap">
                <button
                  onClick={() => setMovementFilter("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    movementFilter === "all"
                      ? "bg-gray-700 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  All ({movementCounts.all})
                </button>
                
                <button
                  onClick={() => setMovementFilter("adjustment")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    movementFilter === "adjustment"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  }`}
                >
                  📊 Adjustments ({movementCounts.adjustment})
                </button>
                
                <button
                  onClick={() => setMovementFilter("return")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    movementFilter === "return"
                      ? "bg-green-600 text-white"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  ↩️ Returns ({movementCounts.return})
                </button>
                
                <button
                  onClick={() => setMovementFilter("damage")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    movementFilter === "damage"
                      ? "bg-red-600 text-white"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  ⚠️ Damages ({movementCounts.damage})
                </button>
              </div>

              {!hasMovements ? (
                <div className="mt-5 text-center text-gray-500 py-10">
                  <p className="text-lg font-medium">No stock movements recorded</p>
                  <p className="text-sm mt-2">Stock movements will appear here</p>
                </div>
              ) : filteredMovements.length === 0 ? (
                <div className="mt-5 text-center text-gray-500 py-10">
                  <p className="text-lg font-medium">No {movementFilter} movements found</p>
                </div>
              ) : (
                <div className="space-y-4 mt-5">
                  {movementFilter === "all" && (
                    <StockMovementCatalog movements={filteredMovements} />
                  )}
                  
                  {movementFilter === "adjustment" && (
                    <AdjustmentCatalog movements={filteredMovements} />
                  )}
                  
                  {movementFilter === "return" && (
                    <ReturnCatalog movements={filteredMovements} />
                  )}
                  
                  {movementFilter === "damage" && (
                    <DamageCatalog movements={filteredMovements} />
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}