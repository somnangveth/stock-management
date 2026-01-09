"use client";

import { fetchExpiredBatch, fetchProducts } from "@/app/functions/admin/api/controller";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

export default function AlertExpiredPanel() {

  const result = useQueries({
    queries: [
      { queryKey: ["products"], queryFn: fetchProducts },
      { queryKey: ["expired"], queryFn: fetchExpiredBatch },
    ],
  });

  const productData = result[0].data;
  const expiredData = result[1].data;

  const isLoading = result.some(q => q.isLoading);
  const hasError = result.some(q => q.isError);

  const expiredProducts = useMemo(() => {
    if (!Array.isArray(productData) || !Array.isArray(expiredData)) return [];

    const expiredProductIds = new Set(
      expiredData.map((b: any) => b.product_id)
    );

    return productData.filter((p: any) =>
      expiredProductIds.has(p.product_id)
    );
  }, [productData, expiredData]);

  if (isLoading) return <div>Loading...</div>;
  if (hasError) return <div>Error loading data</div>;

  return (
    <div className="space-y-1 overflow-y-auto">
      {expiredProducts.length === 0 ? (
        <div className="text-gray-500 text-sm">No expired products found</div>
      ) : (
        expiredProducts.map((product: any) => (
          <div
            key={product.product_id}
            className="flex gap-2 p-2 border rounded-lg shadow-sm bg-white items-center"
          >
            <img
              src={product.product_image || "/assets/product_default.jpg"}
              alt={product.product_name || "No image"}
              className="w-10 h-10 object-cover rounded"
            />

            <div className="flex flex-col">
              <h3 className="text-gray-700 text-sm font-medium">
                {product.product_name}
              </h3>
              <p className="text-xs text-gray-500">{product.sku_code}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
