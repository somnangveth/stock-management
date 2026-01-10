
"use client";

import { useState, useEffect } from "react";
import { useQueries } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { fetchDealers } from "@/app/functions/admin/api/controller";
import MemberTable from "@/app/components/tables/membertable";
import AddDealerForm from "./components/adddealerform";
import SearchBar from "@/app/components/searchbar";

import { desktop, view, ViewIconBtn } from "@/app/components/ui";
import { Button } from "@/components/ui/button";
import { Users, BarChart3, Loader, AlertCircle } from "lucide-react";

export default function SalesPageB2B() {
  const router = useRouter();

  const [filteredDealers, setFilteredDealers] = useState<any[]>([]);

  const results = useQueries({
    queries: [
      {
        queryKey: ["dealerQuery"],
        queryFn: fetchDealers,
      },
    ],
  });

  const dealerData = results[0].data;
  const isLoading = results[0].isLoading;
  const isError = results[0].isError;

  // Initialize filtered data when API data loads
  useEffect(() => {
    if (dealerData) {
      setFilteredDealers(dealerData);
    }
  }, [dealerData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-3">
        <Loader size={40} className="text-amber-600 animate-spin" />
        <p className="text-gray-600 font-medium">加载经销商数据中...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 flex items-center gap-3">
        <AlertCircle size={32} className="text-red-600" />
        <div>
          <p className="text-red-700 font-semibold">加载失败</p>
          <p className="text-red-600 text-sm">无法加载经销商数据，请重试</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <Users size={32} className="text-amber-600" />
          <h1 className="text-3xl font-bold text-gray-800">Sale Dealer</h1>
        </div>
        <p className="text-gray-600">Have <span className="font-semibold text-amber-600">{dealerData?.length || 0}</span> sale dealers</p>
        <div className="h-1 w-16 bg-amber-500 rounded-full mt-3"></div>
      </div>

      {/* Top Actions */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        {/* 🔍 Search Bar */}
        <SearchBar
          data={dealerData}
          onSearch={setFilteredDealers}
          searchKeys={[
            "business_name",
            "dealer_name",
            "email_address",
            "businesstype",
          ]}
          placeholder="Search dealers..."
          className="flex-1 min-w-[300px]"
        />

        <div className="flex gap-3">
          <Button
            className="bg-slate-50 border-2 border-amber-500 text-slate-800 font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-slate-100 transition-all duration-300 flex items-center gap-2"
            onClick={() => router.push("/admin/salesb2b/components/pos")}
          >
            <BarChart3 size={20} className="text-amber-600" />
            Sales Overview
          </Button>

          <AddDealerForm />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-gray-800"></h2>
          <p className="text-sm text-gray-500 mt-1">Show {filteredDealers.length} dealers</p>
        </div>


        {/* Table Content */}
        {filteredDealers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No dealers found</p>
          </div>
        ) : (
          <div className="p-6">
            <MemberTable
              itemsPerPage={6}
              members={filteredDealers}
              columns={[
                "business_name",
                "dealer_name",
                "email_address",
                "businesstype",
                "action",
              ]}
              form={(dealer) => (
                <Button
                  onClick={() =>
                    router.push(
                      `/admin/salesb2b/components/dealerdetail/${dealer.dealer_id}`
                    )
                  }
                  className="bg-slate-50 border border-amber-500 text-amber-600 hover:bg-amber-50 font-medium py-1 px-3 rounded transition-all duration-300"
                  size="sm"
                >
                  View Details
                </Button>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}