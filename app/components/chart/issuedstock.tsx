"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";

async function fetchStockMovement() {
    const res = await fetch("/api/admin/fetchstockmovement");

    if (!res.ok) {
        throw new Error("Failed to fetch stock movement");
    }

    return res.json(); // must return an array
}

export default function IssuedStockPanel() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["fetchstockmovement"],
        queryFn: fetchStockMovement,
    });

    const issuedTotal = Array.isArray(data) ? data.length : 0;

    return (
    <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-700" />
            </div>
            <span className="font-semibold text-gray-700">Issued Stock</span>
          </div>
          <div className="px-2 py-1 bg-blue-100 rounded-full">
            <span className="text-xs font-medium text-blue-700">Movement</span>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-blue-200 rounded-lg animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="w-20 h-6 bg-blue-200 rounded animate-pulse"></div>
            </div>
          </div>
        )}
        
        {isError && (
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-red-500">0</h1>
            <p className="text-sm text-red-600">Failed to load data</p>
          </div>
        )}
        
        {!isLoading && !isError && (
          <>
            <h1 className="text-5xl font-bold text-blue-600 mb-2 transition-transform group-hover:scale-105">
              {issuedTotal}
            </h1>
            <p className="text-sm text-gray-500">Stock movements recorded</p>
          </>
        )}
      </div>
    </div>
  );
}
