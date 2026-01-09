'use client';
import ProductTable from "@/app/components/tables/producttable";
import { Product } from "@/type/producttype";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import AddFormBatch from "./addformbatch";
import { view } from "@/app/components/ui";
import Link from "next/link";
import { fetchCategoryAndSubcategory, fetchStockAlert } from "@/app/functions/admin/api/controller";

// Define enhanced product type
export interface EnhancedProduct extends Product {
  category_name?: string;
  subcategory_name?: string;
  batches?: any[];
  alert_type?: string;
}

export default function ProductList({ 
  refreshKey = 0,
  onDataLoaded
}: { 
  refreshKey?: number;
  onDataLoaded?: (
    data: EnhancedProduct[], 
    onSearch: (results: EnhancedProduct[]) => void,
    searchKeys: (keyof EnhancedProduct)[]
  ) => void;
}) {
  const [displayProducts, setDisplayProducts] = useState<EnhancedProduct[]>([]);

  const handleSearchResults = useCallback((results: EnhancedProduct[]) => {
    setDisplayProducts(results);
  }, []);

  const result = useQueries({
    queries: [
      {
        queryKey: ["products", refreshKey],
        queryFn: fetchCategoryAndSubcategory,
      },
      {
        queryKey: ["stockAlertQuery", refreshKey],
        queryFn: fetchStockAlert,
      },
    ]
  });

  const productData = result[0].data;
  const stockAlertData = result[1].data;
  const isLoading = result[0].isLoading || result[1].isLoading;
  const error = result[0].error || result[1].error;

  // Create a map for quick stock alert lookups by product_id
  const stockAlertMap = useMemo(() => {
    if (!stockAlertData) return new Map();
    const map = new Map();
    stockAlertData.forEach((alert: any) => {
      map.set(alert.product_id, alert);
    });
    return map;
  }, [stockAlertData]);


  useEffect(() => {
    if (!productData) return;

    const categoryMap = new Map(
      productData.categories.map((cat: { category_id: string; category_name: string; }) => 
        [cat.category_id, cat.category_name]
      )
    );
    
    const subcategoryMap = new Map(
      productData.subcategories.map((sub: { subcategory_id: string; subcategory_name: string; }) => 
        [sub.subcategory_id, sub.subcategory_name]
      )
    );

    const enhancedProducts: EnhancedProduct[] = productData.product.map((product: Product) => {
      const stockAlert = stockAlertMap.get(product.product_id);
      
      return {
        ...product,
        current_quantity: stockAlert?.current_quantity ?? "-",
        alert_type: stockAlert?.alert_type ?? "-",
        category_name: categoryMap.get(product.category_id) || 'Unknown',
        subcategory_name: subcategoryMap.get(product.subcategory_id) || 'Unknown',
      };
    });

    setDisplayProducts(enhancedProducts);

    if (onDataLoaded) {
      const searchKeys: (keyof EnhancedProduct)[] = [
        'product_name',
        'sku_code',
        'category_name',
        'subcategory_name'
      ];
      onDataLoaded(enhancedProducts, handleSearchResults, searchKeys);
    }
  }, [productData, stockAlertMap, onDataLoaded, handleSearchResults]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-500">Failed to load products</p>
        <button 
          onClick={() => window.location.reload()} 
          className="ml-4 text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (displayProducts.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">No products found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <ProductTable
        itemsPerPage={7}
        product={displayProducts}
        columns={[
          'product_image',
          'product_name',
          'sku-code',  
          'category_id',
          "current_quantity",
          "alert_type",
          'action'
        ]}
        form={(product) => {
          const p = product as EnhancedProduct;
          return (
            <div className="flex items-center gap-2">
              <AddFormBatch product={p} />
              <Link href={`/admin/stock/components/batchdetail/${p.product_id}`}>
                {view}
              </Link>
            </div>
          );
        }}
      />
    </div>
  );
}