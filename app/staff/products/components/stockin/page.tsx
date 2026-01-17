"use client";

import { fetchBatch, fetchCategory, fetchProducts, fetchVendors } from "@/app/functions/admin/api/controller";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Package, Calendar, Clock, TrendingUp } from "lucide-react";
import StockInDialogForm from "./component/stockindialogform";
import { ProductBatch } from "@/type/producttype";

interface Product {
  product_id: string;
  sku_code: string;
  product_name: string;
  slug: string;
  category_id: string | null;
  product_image: string | null;
  created_at: string;
  updated_at: string;
  units_per_package: number;
  package_type: string;
  description: string;
  created_by: string;
  product_location: string | null;
}

interface MergedImport extends ProductBatch {
  import_status: any;
  days_until_import: number;
  import_date: string | number | Date;
  product?: Product;
}

export default function StockInPage() {
  const queryClient = useQueryClient();

  const result = useQueries({
    queries: [
      {
        queryKey: ["productQuery"],
        queryFn: fetchProducts,
      },
      {
        queryKey: ["batchQuery"],
        queryFn: fetchBatch,
      },
      {
        queryKey: ["categoryQuery"],
        queryFn: fetchCategory,
      },
      {
        queryKey: ["vendorQuery"],
        queryFn: fetchVendors,
      }
    ],
  });

  const productQuery = result[0].data as Product[] | undefined;
  const batchQuery = result[1].data as ProductBatch[] | undefined;
  const isLoading = result.some((r) => r.isLoading);
  const hasError = result.some((r) => r.error);

  // Merge Batch and product data
  const pendingImports = useMemo(() => {
    if (!productQuery || !batchQuery) return [];
    
    return batchQuery
      .filter((batch:any) => batch.import_status === "stock_in")
      .map((batch) => {
        const product = productQuery.find((p) => p.product_id === batch.product_id);
        return {
          ...batch,
          product,
        } as MergedImport;
      });
  }, [productQuery, batchQuery]);

  // Get status badge color
  const getStatusBadge = (daysUntilImport: number) => {
    if (daysUntilImport <= 2) return "bg-red-100 text-red-800 border-red-200";
    if (daysUntilImport <= 5) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-600 font-medium">Loading imports...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-medium">Error loading import data. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Import Tracking</h1>
          <p className="text-slate-600">Monitor pending product imports and delivery progress</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">
                {pendingImports.length} Pending Imports
              </span>
            </div>
          </div>
        </div>

        {/* Import Cards Grid */}
        {pendingImports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Pending Imports</h3>
            <p className="text-slate-600">All imports have been completed or there are no scheduled imports.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingImports.map((importItem: MergedImport) => (
              <div
                key={importItem.batch_id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 overflow-hidden group"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg mb-1 line-clamp-1">
                        {importItem.product?.product_name || "Unknown Product"}
                      </h3>
                      <p className="text-amber-100 text-sm">
                        SKU: {importItem.product?.sku_code || "N/A"}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(importItem.days_until_import)}`}>
                      {importItem.days_until_import <= 2 ? "Urgent" : importItem.days_until_import <= 5 ? "Soon" : "On Track"}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  {/* Days Until Import */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">Delivery Timeline</span>
                      </div>
                      <span className="text-2xl font-bold text-slate-900">
                        {importItem.days_until_import}
                        <span className="text-sm font-normal text-slate-600 ml-1">days</span>
                      </span>
                    </div>
                  </div>

                  {/* Import Details */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-600">Import Date</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {new Date(importItem.import_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-600">Quantity</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {importItem.quantity} {importItem.product?.package_type || "units"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-600">Status</span>
                      </div>
                      <span className="text-sm font-medium text-amber-600 capitalize">
                        {importItem.import_status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Note Section */}
                  {importItem.note && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500 italic line-clamp-2">
                        Note: {importItem.note}
                      </p>
                    </div>
                  )}

                  {/* Stock In Dialog Form Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <StockInDialogForm batch={importItem} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}