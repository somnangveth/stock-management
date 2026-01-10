"use client";
import { useCallback, useState } from "react";
import ProductList, { EnhancedProduct } from "./components/productBatch/productlist"; // Import from the correct location
import SearchBar from "@/app/components/searchbar";
import TotalStockPanel from "@/app/components/chart/totalstock";
import IssuedStockPanel from "@/app/components/chart/issuedstock";
import ExpiryStockPanel from "@/app/components/chart/expirystock";
import { useQuery } from "@tanstack/react-query";
import { getExpiredBatches } from "@/app/functions/admin/stock/expiry/expiry";
import { useRouter } from "next/navigation";
import { questionMark } from "@/app/components/ui";

export default function StockPage() {
  const router = useRouter();
  const [refreshKeys, setRefreshKey] = useState(0);
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [searchConfig, setSearchConfig] = useState<{
    searchKeys: (keyof EnhancedProduct)[],
    onSearch: (results: EnhancedProduct[]) => void;
  } | null>(null);

  const registerSearch = useCallback(
    (
      data: EnhancedProduct[],
      onSearch: (results: EnhancedProduct[]) => void,
      searchKeys: (keyof EnhancedProduct)[]
    ) => {
      setProducts(data);
      setSearchConfig({ searchKeys, onSearch });
    }, []
  );

  // Fetch expired batches
  const { data: expiredBatches, isLoading, error } = useQuery({
    queryKey: ["expiredQuery"],
    queryFn: getExpiredBatches,
  });

  const handleProductAdded = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="space-y-6 p-6">
      {searchConfig && (
        <SearchBar
          data={products}
          onSearch={searchConfig.onSearch}
          searchKeys={searchConfig.searchKeys}
          placeholder="Search Products..." />
      )}

      {/* Expiry Alert Button */}
      <div className="flex justify-end">
      </div>

      <div className="grid grid-cols-3 gap-2">
        <TotalStockPanel />
        <IssuedStockPanel />
        <ExpiryStockPanel />
      </div>
      <div className="text-lg text-red bg-transparent">
        
        <button
        onClick={() => router.push("/admin/stock/components/expirypanel")}>
          {questionMark}
        </button>
      </div>
      <ProductList
        refreshKey={refreshKeys}
        onDataLoaded={registerSearch} />
    </div>
  );
}