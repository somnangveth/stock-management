"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

import { RetryButton } from "@/app/components/error/error";
import {
  fetchImportPrice,
  fetchProducts,
  fetchSalePrice,
  fetchAttribute,
} from "@/app/functions/admin/api/controller";

import SearchBar from "@/app/components/searchbar";
import { useRouter } from "next/navigation";
import { btnStyle } from "@/app/components/ui";

export default function PriceManagementPage() {
  const router = useRouter();
  const result = useQueries({
    queries: [
      { queryKey: ["products"], queryFn: fetchProducts },
      { queryKey: ["importPrices"], queryFn: fetchImportPrice },
      { queryKey: ["salePrices"], queryFn: fetchSalePrice },
      { queryKey: ["attributes"], queryFn: fetchAttribute },
    ],
  });

  const products = result[0].data ?? [];
  const importPrices = result[1].data ?? [];
  const salePrices = result[2].data ?? [];
  const attributes = result[3].data ?? [];

  const isLoading = result.some((r) => r.isLoading);
  const hasError = result.some((r) => r.error);

  const attributeMap = useMemo(() => {
    return attributes.reduce((acc: any, attr: any) => {
      acc[attr.attribute_id] = attr;
      return acc;
    }, {});
  }, [attributes]);

  const rows = useMemo(() => {
    return salePrices.map((sale: any) => {
      const product = products.find(
        (p: any) => p.product_id === sale.product_id
      );

      const importPrice = importPrices.find(
        (imp: any) => imp.price_id === sale.sale_price_id
      );

      const attribute = attributeMap[sale.attribute_id];

      return {
        productName: product?.product_name ?? "Unknown",
        sku: product?.sku_code ?? "-",
        attributeLabel: attribute
          ? `${attribute.module} (${attribute.attribute_name})`
          : "Unknown",
        attributeValue: sale.attribute_value,
        importPrice: importPrice?.price_value ?? 0,
        salePrice: sale.price_value ?? 0,
      };
    });
  }, [products, importPrices, salePrices, attributeMap]);

  // Initialize filteredRows with rows directly
  const [filteredRows, setFilteredRows] = useState<any[]>(rows);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <AiOutlineLoading3Quarters className="animate-spin text-2xl" />
      </div>
    );
  }

  if (hasError) {
    return <RetryButton />;
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Price Management</h1>

        <div className="flex items-center gap-2">
          <SearchBar
            data={rows}
            onSearch={setFilteredRows}
            searchKeys={["productName", "sku", "attributeLabel"]}
            placeholder="Search product, SKU, attribute..."
            className="w-80"
          />

          <button
            className={btnStyle}
            onClick={() => router.push("/admin/price/components/createsaleprice")}
          >
            Add Sale Price
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-2 text-left">Product</th>
              <th className="px-4 py-2 text-left">SKU</th>
              <th className="px-4 py-2 text-left">Attribute</th>
              <th className="px-4 py-2 text-left">Value</th>
              <th className="px-4 py-2 text-right">Import Price</th>
              <th className="px-4 py-2 text-right">Sale Price</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row, index) => (
              <tr
                key={`${row.productName}-${row.attributeLabel}-${index}`}
                className="border-b hover:bg-gray-50"
              >
                <td className="px-4 py-2">{row.productName}</td>
                <td className="px-4 py-2">{row.sku}</td>
                <td className="px-4 py-2">{row.attributeLabel}</td>
                <td className="px-4 py-2">{row.attributeValue}</td>
                <td className="px-4 py-2 text-right">
                  ${row.importPrice.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right font-medium">
                  ${row.salePrice.toFixed(2)}
                </td>
              </tr>
            ))}

            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">
                  No matching results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}