"use client";

import { useState, useCallback } from "react";
import SearchBar from "@/app/components/searchbar";
import { Product } from "@/type/producttype";
import ProductList, { EnhancedProduct } from "./components/product/productlists";
import ProductForm from "./components/product/productform";

export default function ProductManagement() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Store product list locally
  const [products, setProducts] = useState<EnhancedProduct[]>([]);

  // Store search configs coming from ProductList
  const [searchConfig, setSearchConfig] = useState<{
    searchKeys: (keyof EnhancedProduct)[];
    onSearch: (results: EnhancedProduct[]) => void;
  } | null>(null);

  /**
   * Called by ProductList when data is loaded
   */
  const registerSearch = useCallback(
    (
      data: EnhancedProduct[],
      onSearch: (results: EnhancedProduct[]) => void,
      searchKeys: (keyof EnhancedProduct)[]
    ) => {
      setProducts(data); // store product list
      setSearchConfig({ searchKeys, onSearch });
    },
    []
  );

  /**
   * When new product created → refresh ProductList
   */
  const handleProductAdded = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="space-y-6 p-6">

      <div className="flex justify-end">
      <div className="w-1/3">
        {/* Search bar shows only after ProductList registers keys */}
      {searchConfig && (
        <SearchBar
          data={products}
          onSearch={searchConfig.onSearch}
          searchKeys={searchConfig.searchKeys}
          placeholder="Search products by name, SKU, or category..."
        />
      )}
    </div>
      </div>

      {/* Add product form */}
      <div className="flex justify-end">
        <ProductForm onProductAdded={handleProductAdded} />
      </div>

      <div className="mt-10">
        {/* Product list */}
        <ProductList refreshKey={refreshKey} onDataLoaded={registerSearch} />
      </div>
    </div>
  );
}
