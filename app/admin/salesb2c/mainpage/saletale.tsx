"use client";

import { useMemo, useEffect } from "react";
import ProductTable from "@/app/components/tables/producttable";
import ReceiptB2C from "./receiptb2c";

import {
  fetchProducts,
  fetchSaleItems,
  fetchSales,
} from "@/app/functions/admin/api/controller";
import { Product, Sale } from "@/type/producttype";
import { useQueries } from "@tanstack/react-query";

type SaleItem = {
  product: Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
  total: number;
  product_id?: string;
  sale_id?: string;
};

type SaleTableB2CProps = {
  onDataLoaded: (data: any[]) => void;
  filteredData: any[];
};

export default function SaleTableB2C({
  onDataLoaded,
  filteredData,
}: SaleTableB2CProps) {
  const result = useQueries({
    queries: [
      { queryKey: ["saleQuery"], queryFn: fetchSales },
      { queryKey: ["productQuery"], queryFn: fetchProducts },
      { queryKey: ["saleItemQuery"], queryFn: fetchSaleItems },
    ],
  });

  const salesData = result[0].data as Sale[];
  const productData = result[1].data as Product[];
  const saleItemData = result[2].data as SaleItem[];

  const isLoading =
    result[0].isLoading || result[1].isLoading || result[2].isLoading;
  const hasError =
    result[0].error || result[1].error || result[2].error;

  /* -------------------- Filter B2C Sales -------------------- */
  const saleData = useMemo(() => {
    if (!salesData) return [];
    return salesData.filter((sale) => sale.customertype === "General");
  }, [salesData]);

  /* -------------------- Product Map -------------------- */
  const productMap = useMemo(() => {
    if (!productData) return {};
    return productData.reduce((acc: any, product: Product) => {
      acc[product.product_id] = product;
      return acc;
    }, {});
  }, [productData]);

  /* -------------------- Group Sale Items -------------------- */
  const saleItemsBySaleId = useMemo(() => {
    if (!saleItemData || !productMap) return {};

    return saleItemData.reduce((acc: any, item: any) => {
      acc[item.sale_id] = acc[item.sale_id] || [];
      acc[item.sale_id].push({
        ...item,
        product:
          item.product ||
          productMap[item.product_id] || {
            product_id: item.product_id,
            product_name: "Unknown Product",
            price: 0,
          },
      });
      return acc;
    }, {});
  }, [saleItemData, productMap]);

  /* -------------------- Enhanced Sales -------------------- */
  const enhancedSales = useMemo(() => {
    if (!saleData) return [];
    return saleData.map((sale: Sale) => {
      const items = saleItemsBySaleId[sale.sale_id] || [];
      return {
        ...sale,
        items,
        itemCount: items.reduce(
          (sum: number, item: SaleItem) => sum + (item.quantity || 0),
          0
        ),
      };
    });
  }, [saleData, saleItemsBySaleId]);

  /* -------------------- Send all sales to parent -------------------- */
  useEffect(() => {
    if (enhancedSales.length > 0) {
      onDataLoaded(enhancedSales); // sets allSales in parent
    }
  }, [enhancedSales, onDataLoaded]);

  /* -------------------- Decide what to render -------------------- */
  const tableData = filteredData.length > 0 ? filteredData : enhancedSales;

  /* -------------------- Loading & Error -------------------- */
  if (isLoading) return <p className="text-center p-8 text-gray-500">Loading...</p>;
  if (hasError) return <p className="text-center p-8 text-red-500">Error loading sales data</p>;
  if (!tableData || tableData.length === 0)
    return <p className="text-center p-8 text-gray-500">No sales found</p>;

  return (
    <ProductTable
      itemsPerPage={7}
      product={tableData}
      columns={[
        "sale_id",
        "subtotal",
        "discount",
        "total_price",
        "payment_method",
        "status",
        "action",
      ]}
      form={(sale: any) => {
        const firstProduct = sale.items?.[0]?.product || productData?.[0];
        return <ReceiptB2C sale={sale} product={firstProduct} />;
      }}
    />
  );
}
