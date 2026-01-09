"use client";
import { Product } from "@/type/producttype";
import { useCallback, useEffect, useState } from "react";
import SearchBar from "../searchbar";

//
// ─────────────────────────────────────────
//   CHILD: PRODUCT CATALOG LIST
// ─────────────────────────────────────────
//
function ProductCatalog({
  refreshKey = 0,
  onDataLoaded,
  multiple = false,
  onSelect,
  onSelectMultiple,
  selectedProducts = []
}: {
  refreshKey?: number;
  onDataLoaded?: (
    data: Product[],
    onSearch: (results: Product[]) => void,
    searchKeys: (keyof Product)[]
  ) => void;
  multiple?: boolean;
  onSelect?: (product: Product) => void;
  onSelectMultiple?: (products: Product[]) => void;
  selectedProducts?: Product[];
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //
  // Handle search callback
  //
  const handleSearchResults = useCallback((results: Product[]) => {
    setDisplayProducts(results);
  }, []);

  //
  // Fetch products
  //
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/admin/fetchProducts");
        if (!res.ok) throw new Error("Failed loading products");
        const data = await res.json();
        setProducts(data);
        setDisplayProducts(data);
        
        if (onDataLoaded) {
          onDataLoaded(
            data,
            handleSearchResults,
            ["product_id", "product_name"]
          );
        }
      } catch (err: any) {
        setError(err.message || "Error fetching products");
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [refreshKey, onDataLoaded, handleSearchResults]);

  //
  // UI States
  //
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading products…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (displayProducts.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">No products found.</p>
      </div>
    );
  }

  //
  // Handle selection
  //
  function isSelected(product: Product) {
    return selectedProducts.some((p) => p.product_id === product.product_id);
  }

  function toggleSelection(product: Product) {
    // Single selection mode
    if (!multiple) {
      onSelect?.(product);
      return;
    }

    // Multiple selection mode
    const exists = selectedProducts.some(
      (p) => p.product_id === product.product_id
    );
    const updated = exists
      ? selectedProducts.filter((p) => p.product_id !== product.product_id)
      : [...selectedProducts, product];
    
    onSelectMultiple?.(updated);
  }

  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
      {displayProducts.map((p) => {
        const selected = isSelected(p);
        return (
          <div
            key={p.product_id}
            onClick={() => toggleSelection(p)}
            className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
              selected 
                ? "bg-blue-50 border-blue-500 shadow-sm" 
                : "bg-white hover:bg-slate-50 border-slate-200"
            }`}
          >
            {/* Checkbox for multiple selection */}
            {multiple && (
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                selected 
                  ? "bg-blue-600 border-blue-600" 
                  : "border-slate-300"
              }`}>
                {selected && (
                  <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
            )}

            {/* Product Image */}
            <img
              src={p.product_image}
              alt={p.product_name}
              className="w-5 h-5 rounded object-cover"
            />

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{p.product_name}</p>
              <p className="text-sm text-slate-500">{p.product_id}</p>
            </div>

            {/* Radio indicator for single selection */}
            {!multiple && selected && (
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

//
// ─────────────────────────────────────────
//   MAIN EXPORT: SELECT PRODUCT LIST
// ─────────────────────────────────────────
//
export default function SelectProductList({
  multiple = false,
  selectedProducts = [],
  onSelect,
  onSelectMultiple,
  onClose
}: {
  multiple?: boolean;
  selectedProducts?: Product[];
  onSelect?: (product: Product) => void;
  onSelectMultiple?: (products: Product[]) => void;
  onClose?: () => void;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchConfig, setSearchConfig] = useState<{
    searchKeys: (keyof Product)[];
    onSearch: (results: Product[]) => void;
  } | null>(null);

  //
  // Callback from ProductCatalog to register search settings
  //
  const registerSearch = useCallback(
    (
      data: Product[],
      onSearch: (results: Product[]) => void,
      searchKeys: (keyof Product)[]
    ) => {
      setProducts(data);
      setSearchConfig({ searchKeys, onSearch });
    },
    []
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        {multiple && selectedProducts.length > 0 && (
          <span className="text-sm text-slate-600 bg-blue-100 px-3 py-1 rounded-full">
            {selectedProducts.length} selected
          </span>
        )}
      </div>

      {/* SearchBar */}
      {searchConfig && (
        <SearchBar
          data={products}
          onSearch={searchConfig.onSearch}
          searchKeys={searchConfig.searchKeys}
          placeholder="Search products by name or ID…"
        />
      )}

      {/* The product catalog */}
      <ProductCatalog
        refreshKey={refreshKey}
        onDataLoaded={registerSearch}
        multiple={multiple}
        selectedProducts={selectedProducts}
        onSelect={onSelect}
        onSelectMultiple={onSelectMultiple}
      />

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t">
        {multiple ? (
          <>
            <button
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 px-4 rounded-lg font-medium transition-colors"
              onClick={() => {
                onSelectMultiple?.([]);
              }}
            >
              Clear All
            </button>
            <button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onClose}
              disabled={selectedProducts.length === 0}
            >
              Done ({selectedProducts.length})
            </button>
          </>
        ) : (
          <button
            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 px-4 rounded-lg font-medium transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}