"use client";

import { useState, useCallback } from "react";
import SearchBar from "@/app/components/searchbar";
import { Product } from "@/type/producttype";
import ProductList, { EnhancedProduct } from "./components/product/productlists";
import ProductForm from "./components/product/productform";
import { Button } from "@/components/ui/button";
import { btnStyle, stockin, truck } from "@/app/components/ui";
import { useRouter } from "next/navigation";

export default function ProductManagement() {
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  // Store product list locally
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<EnhancedProduct[]>([]);

  // Store search configs coming from ProductList
  const [searchConfig, setSearchConfig] = useState<{
    searchKeys: (keyof EnhancedProduct)[];
    onSearch: (results: EnhancedProduct[]) => void;
  } | null>(null);

  /**
   * Called by ProductList when data is loaded via onDataLoaded prop
   */
  const handleDataLoaded = useCallback(
    (
      data: EnhancedProduct[],
      onSearch: (results: EnhancedProduct[]) => void,
      searchKeys: (keyof EnhancedProduct)[]
    ) => {
      setProducts(data);
      setFilteredProducts(data);
      setSearchConfig({ searchKeys, onSearch });
    },
    []
  );

  /**
   * Handle search results from SearchBar
   */
  const handleSearch = useCallback((results: EnhancedProduct[]) => {
    setFilteredProducts(results);
    if (searchConfig?.onSearch) {
      searchConfig.onSearch(results);
    }
  }, [searchConfig]);

  /**
   * When new product created → refresh ProductList
   */
  const handleProductAdded = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header with Search and Actions */}
      <h2 className="font-bold text-2xl">Product Management</h2>
      {/* Search bar - shows only after ProductList registers keys */}
          {searchConfig && (
            <div className="w-full sm:w-80">
              <SearchBar
                data={products}
                onSearch={handleSearch}
                searchKeys={searchConfig.searchKeys}
                placeholder="Search products by name, SKU, or category..."
                debounceMs={300}
              />
            </div>
          )}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">

        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
            className={btnStyle}
            onClick={() => router.push("/admin/products/components/stockin")}>
              {stockin} Stock In
            </Button>
            <Button
              className={btnStyle}
              onClick={() => router.push("/admin/products/components/importproduct")}
            >
              {truck}Track import products
            </Button>
            <ProductForm onProductAdded={handleProductAdded} />
          </div>
        </div>
      </div>

      {/* Results summary */}
      {searchConfig && filteredProducts.length !== products.length && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded">
          <div className="text-sm text-amber-900">
            <span className="font-semibold">Showing {filteredProducts.length}</span> of {products.length} products
          </div>
          <button
            onClick={() => {
              setFilteredProducts(products);
              if (searchConfig?.onSearch) {
                searchConfig.onSearch(products);
              }
            }}
            className="text-sm text-amber-700 hover:text-amber-900 font-medium underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Product list */}
      <div className="mt-6">
        <ProductList 
          refreshKey={refreshKey} 
          onDataLoaded={handleDataLoaded}
        />
      </div>
    </div>
  );
}