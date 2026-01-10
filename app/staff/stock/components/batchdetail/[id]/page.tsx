"use client";

import { 
  fetchBatch, 
  fetchExpiredBatch, 
  fetchPricesB2C, 
  fetchProducts, 
  fetchStockAlert
} from "@/app/functions/admin/api/controller";
import { cn } from "@/lib/utils";
import { ProductBatch } from "@/type/productbatch";
import { Price, Product, StockAlert } from "@/type/producttype";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import Barcode from "react-barcode";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import AddIssueProductForm from "../../issueProduct/addissueform";
import UpdateStockLevelForm from "../../productBatch/stocklevelform";
import UpdateBatchForm from "../../productBatch/updatebatchform";
import DeleteBatch from "../../productBatch/deletebatch";

export default function BatchDetailPage(){
    const params = useParams();
    const router = useRouter();
    const id = params.id;

    const formDate = (date: string | Date | undefined) => {
      if (!date) return "-";
      const d = typeof date === "string" ? new Date(date) : date;
      if (isNaN(d.getTime())) return "-";
      return d.toISOString().split("T")[0];
    };

    const results = useQueries({
        queries:[
            { queryKey: ["productsQuery"], queryFn: fetchProducts },
            { queryKey: ["batchesQuery"], queryFn: fetchBatch },
            { queryKey: ["expiredQuery"], queryFn: fetchExpiredBatch },
            { queryKey: ["priceb2cQuery"], queryFn: fetchPricesB2C },
            { queryKey: ["stockAlertQuery"], queryFn: fetchStockAlert }
        ]
    });

    const isLoading = results.some(r => r.isLoading);
    const hasError = results.some(r => r.error);

    const productData = results[0].data;
    const batchData = results[1].data;
    const expiredData = results[2].data;
    const priceData = results[3].data;
    const stockAlertData = results[4].data;

    const products = useMemo(() => {
        if (!productData || !id || !Array.isArray(productData)) return null;
        return productData.find((p: Product) => p.product_id === id);
    }, [productData, id]);

    const batches = useMemo(() => {
        if (!batchData || !products || !Array.isArray(batchData)) return [];
        return batchData.filter((b: ProductBatch) => b.product_id === products.product_id);
    }, [batchData, products]);

    const expired = useMemo(() => {
        if (!expiredData || !products || !Array.isArray(expiredData)) return [];
        return expiredData.filter((e: ProductBatch) => e.product_id === products.product_id);
    }, [expiredData, products]);

    const prices = useMemo(() => {
      if (!priceData || !products || !Array.isArray(priceData)) return null;
      return priceData.find((p: Price) => p.product_id === products.product_id);
    }, [priceData, products]);

    const stockAlerts = useMemo(() => {
      if (!stockAlertData || !products || !Array.isArray(stockAlertData)) return null;
      return stockAlertData.find((s: StockAlert) => s.product_id === products.product_id);
    }, [stockAlertData, products]);

    if(isLoading) return (
      <div className="text-gray-500 flex justify-center items-center h-screen">
        <p className="flex items-center gap-2">Loading <AiOutlineLoading3Quarters className={cn("animate-spin")}/></p>
      </div>
    );

    if(hasError) return (
      <div className="text-gray-500 flex justify-center items-center h-screen">
        <p>Failed to Load.</p>
      </div>
    );

    if(!products) return (
      <div className="text-gray-500 flex justify-center items-center h-screen">
        <p>Product not found.</p>
      </div>
    );

    return (
      <>
        <button 
          onClick={() => router.push("/staff/stock")}
          className="flex items-center text-gray-500 gap-2 mb-3">
          <ArrowLeft/>Back to main page
        </button>

        <h2 className="text-lg font-semibold mb-5">{products.product_name} Batches</h2>

        {stockAlerts && (
          <div
            className={cn(
              "mb-6 p-4 rounded-lg border flex items-center justify-between mr-2 ml-3",
              stockAlerts.current_quantity <= stockAlerts.threshold_quantity
                ? "bg-red-50 border-red-200 text-red-700"
                : stockAlerts.current_quantity >= stockAlerts.max_stock_level
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-green-50 border-green-200 text-green-700"
            )}
          >
            <div>
              <p className="font-semibold">Stock Alert</p>
              <p className="text-sm">
                Current Stock: <b>{stockAlerts.current_quantity}</b>
              </p>
            </div>

            <div className="flex gap-3 text-sm text-right">
              <p>Min: {stockAlerts.threshold_quantity}</p>
              <p>Max: {stockAlerts.max_stock_level}</p>
            </div>

            <div className="text-lg">
              <UpdateStockLevelForm stockAlert={stockAlerts} product={products}/>
            </div>
          </div>
        )}


        <div className=" overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-7 px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-600 border border-gray-300 rounded-xl sticky top-0 m-2 mr-2 ml-3">
            <span>Batch Number</span>
            <span>Packages Qty</span>
            <span>Qty Remaining</span>
            <span className="text-left">Manufacture Date</span>
            <span className="text-center">Expiry Date</span>
            <span className="text-center">Status</span>
            <span className="text-center">Action</span>
          </div>

          <div className="flex flex-col gap-3 p-4">
          {batches.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No batches found
            </div>
          )}

          {batches.map((b: ProductBatch) => (
            <div
              key={b.batch_id}
              className="grid grid-cols-7 gap-4 items-center
                         border border-gray-500 rounded-lg 
                        hover:shadow-md transition p-4"
            >
              {/* Batch Number */}
              <div className="flex justify-center md:justify-start">
                <Barcode
                  value={String(b.batch_number)}
                  height={18}
                  width={0.4}
                  fontSize={6}
                />
              </div>

              {/* Packages */}
              <div className="text-gray-600">
                {b.packages_recieved}
              </div>

              {/* Remaining */}
              <div className="text-gray-600">
                {b.quantity_remaining}
              </div>

              {/* Manufacture Date */}
              <div className="sm:text-xs md:text-sm text-gray-700 text-left">
                {formDate(b.manufacture_date)}
              </div>

              {/* Expiry Date */}
              <div className="sm:text-xs md:text-sm text-gray-700 text-center">
                {formDate(b.expiry_date)}
              </div>

              {/* Status */}
              <div className="text-center">
                <span
                  className={cn(
                    "inline-flex px-3 py-1 rounded-full text-xs font-medium",
                    b.status === "active" && "bg-green-100 text-green-700",
                    b.status === "expired" && "bg-red-100 text-red-700",
                    b.status === "dispose" && "bg-orange-100 text-orange-700",
                    b.status === "returned" && "bg-blue-100 text-blue-700",
                    !["active", "expired", "dispose", "returned"].includes(b.status) &&
                      "bg-gray-100 text-gray-700"
                  )}
                >
                  {b.status}
                </span>
              </div>

              {/* Action */}
              <div className="flex items-center md:justify-end">
                <AddIssueProductForm
                  product={products}
                  batch={b}
                  stockAlert={stockAlerts}
                  price={prices}
                />
                <DeleteBatch batch={b} product={products}/>
                <UpdateBatchForm product={products} batch={b}/>
              </div>
            </div>
          ))}
        </div>

        </div>
      </>
    )
}
