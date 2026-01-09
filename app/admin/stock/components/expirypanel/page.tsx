"use client";
import { CriticalExpiryCatalog, HighExpiryCatalog, MediumExpiryCatalog } from "@/app/components/catalog/expirycatalog";
import { fetchBatch, fetchPricesB2C, fetchProducts } from "@/app/functions/admin/api/controller";
import { getExpiredBatches } from "@/app/functions/admin/stock/expiry/expiry";
import { ExpiryAlert, Product, ProductBatch } from "@/type/producttype";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import DisposeForm from "./components/adddisposeform";
import DisposedProductsView from "./components/disposeview";

export default function ExpiryPanel() {
  const router = useRouter();
  
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
      }
    ]
  });

  const batchData = result[0].data;
  const expiryData = result[1].data;
  const productData = result[2].data;
  const priceData = result[3].data;

  const isLoading = result.some(r => r.isLoading);

  // Merge data - create a function to get specific item data
  const getItemData = (expiry: ExpiryAlert) => {
    if (!batchData || !productData || !priceData) return null;
      console.log('Looking for batch_id:', expiry.batch_id);
      console.log('Available batches:', batchData);
    const batch = batchData.find((b: ProductBatch) => b.batch_id === expiry.batch_id);
    const product = productData.find((p: Product) => p.product_id === expiry.product_id);
    const price = priceData.find((pr: any) => pr.product_id === expiry.product_id);
    
    console.log('Product: ', product);
    console.log('Batch:', batch);
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

  // Check if there are any expiry alerts
  const hasExpiryAlerts = criticalExpiry.length > 0 || highExpiry.length > 0 || mediumExpiry.length > 0;

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

      {isLoading ? (
        <div className="mt-5 text-center text-gray-500">
          Loading expiry data...
        </div>
      ) : !hasExpiryAlerts ? (
        <div className="mt-5 text-center text-gray-500 py-10">
          <p className="text-lg font-medium">No expiry alerts at this time</p>
          <p className="text-sm mt-2">All products are within safe expiry ranges</p>
        </div>
      ) : (
        <div className="space-y-2 mt-5">
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
  );
}