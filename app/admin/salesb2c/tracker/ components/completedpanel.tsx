"use client";

import { IsLoading, RetryButton } from "@/app/components/error/error";
import { SubmitBtn } from "@/app/components/ui";
import { fetchProducts, fetchSaleItems, fetchSales } from "@/app/functions/admin/api/controller";
import { updateProcessStatus } from "@/app/functions/admin/sale/sale";
import { Product, Sale } from "@/type/producttype";
import { useQueries } from "@tanstack/react-query";
import { useMemo, useTransition } from "react";
import Barcode from "react-barcode";
import ReceiptB2C from "../../mainpage/receiptb2c";
import { styledToast } from "@/app/components/toast";

interface SaleItem {
  sale_id: number;
  product_id: number;
  quantity: number;
  product?: Product;
}

export default function DraftReceiptPanel() {
  const [isPending, startTransition] = useTransition();
  const process_status = "completed";

  const results = useQueries({
    queries: [
      {
        queryKey: ["saleQuery"],
        queryFn: fetchSales,
      },
      {
        queryKey: ["saleItemQuery"],
        queryFn: fetchSaleItems,
      },
      {
        queryKey: ["productQuery"],
        queryFn: fetchProducts,
      }
    ],
  });

  const allSaleData: Sale[] | undefined = results[0].data;
  const saleItemData: SaleItem[] | undefined = results[1].data;
  const productData: Product[] | undefined = results[2].data;

  const isLoading = results.some((r) => r.isLoading);
  const hasError = results.some((r) => r.error);

  // Filter draft sales with customertype "General"
  const saleData = useMemo(() => {
    if (!allSaleData) return [];
    return allSaleData.filter(
      (sale: Sale) => sale.process_status === "draft" && sale.customertype === "General"
    );
  }, [allSaleData]);

  // Create a product lookup map for efficient access
  const productMap = useMemo(() => {
    if (!productData) return {};
    return productData.reduce((acc: any, product: Product) => {
      acc[product.product_id] = product;
      return acc;
    }, {});
  }, [productData]);

  // Group saleItems by sale_id AND populate product data
  const saleItemsBySaleId = useMemo(() => {
    if (!saleItemData || !productMap) return {};
    
    return saleItemData.reduce((acc: any, item: SaleItem) => {
      acc[item.sale_id] = acc[item.sale_id] || [];
      
      // Ensure product data is populated
      const enrichedItem = {
        ...item,
        product: item.product || productMap[item.product_id] || {
          product_id: item.product_id,
          product_name: "Unknown Product",
          price: 0
        }
      };
      
      acc[item.sale_id].push(enrichedItem);
      return acc;
    }, {});
  }, [saleItemData, productMap]);

  // Enhance each sale with its items and item count
  const enhancedSales = useMemo(() => {
    if (!saleData || !saleItemsBySaleId) return [];
    
    return saleData.map((sale: Sale) => {
      const items = saleItemsBySaleId[sale.sale_id] || [];
      
      return {
        ...sale,
        items: items,
        itemCount: items.reduce((sum: number, item: SaleItem) => sum + (item.quantity || 0), 0),
      };
    });
  }, [saleData, saleItemsBySaleId]);

  function onUpdate(saleId: string) {
    startTransition(async () => {
      try {
        const result = await updateProcessStatus(saleId, process_status);
        if (!result) {
          styledToast.error("Failed to update status");
          return;
        }
        styledToast.success("Completed!");
        window.location.reload();
      } catch (error) {
        console.error(error);
        styledToast.error("Something went wrong");
      }
    });
  }

  const generalCustomerTypes : Record<string, string> = {
    walk_in: "Walk In",
    online: "Online",
  }

  return (
    <div>
      {isLoading && <IsLoading />}
      {hasError && <RetryButton />}
      {!isLoading && !hasError && (
                <>
                {/* Header */}
                  <div className="grid grid-cols-5 gap-4 px-4 py-2 text-sm font-semibold text-gray-600 border-b mb-5">
                    <span>Sale ID</span>
                    <span>Customer Type</span>
                    <span>Created At</span>
                    <span>Total Amount</span>
                    <span className="text-right">Action</span>
                  </div>
        
                  {/* Body */}
                  <div className="flex flex-col gap-3">
                    {enhancedSales.map((sale) => (
                      <div
                        key={sale.sale_id}
                        className="grid grid-cols-5  gap-4 items-center
                                  border rounded-lg shadow-sm p-4 bg-white hover:shadow-md transition"
                      >
                        {/* Sale ID / Barcode */}
                        <div className="flex justify-center md:justify-start">
                          <Barcode
                            value={String(sale.sale_id)}
                            fontSize={6}
                            height={18}
                            width={0.4}
                          />
                        </div>
        
                        {/* Customer Type */}
                        <div>
                          <span
                            className={`inline-flex px-3 py-1 text-sm font-medium rounded-full
                              ${
                                sale.general_customer_type === "walk_in"
                                  ? "text-green-700 bg-green-100"
                                  : sale.general_customer_type === "online"
                                  ? "text-blue-700 bg-blue-100"
                                  : "text-gray-700 bg-gray-100"
                              }
                            `}
                          >
                            {generalCustomerTypes[sale.general_customer_type as string] || "-"}
                          </span>
                        </div>
        
                        {/* Date */}
                        <div className="text-gray-500 text-sm">
                          {sale.created_at.split("T")[0]}
                        </div>
        
                        {/* Total */}
                        <div className="font-semibold text-lg text-gray-800">
                          ${sale.total_amount}
                        </div>
        
                        {/* Actions */}
                        <div className="flex md:justify-end gap-3">
                          <ReceiptB2C sale={sale} product={sale.items} />
                          <button
                            className={SubmitBtn}
                            disabled={isPending}
                            onClick={() => onUpdate(sale.sale_id)}
                          >
                            Packaged
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
        
                </>
      )}
    </div>
  );
}