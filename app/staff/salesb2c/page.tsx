"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { desktop, task } from "@/app/components/ui";
import SaleTableB2C from "./mainpage/saletale";
import SaleTotalPanel from "./mainpage/totalsalepanel";
import SearchBar from "@/app/components/searchbar";
import { FaS, FaSignal } from "react-icons/fa6";

export default function SalePageB2C() {
  const router = useRouter();

  // All sales loaded from API
  const [allSales, setAllSales] = useState<any[]>([]);

  // Filtered sales after search
  const [filteredSales, setFilteredSales] = useState<any[]>([]);

  return (
    <div className="space-y-4">
    <SearchBar
          data={allSales}
          onSearch={setFilteredSales}
          searchKeys={[
            "sale_id",
            "payment_method",
            "status",
            "total_price",
            "customer_name",
            "process_status"
          ]}
          placeholder="Search sales..."
          className="w-1/2"
        />
      {/* Total Panel */}
      <SaleTotalPanel />

      {/* Actions + Search */}
      <div className="flex justify-between items-center p-4">

        <div className="flex gap-2">
          <button
            onClick={() => router.push("/staff/salesb2c/pos")}
            className="p-2 bg-gray-200 rounded-full hover:bg-gray-400 text-gray-700"
          >
            {desktop}
          </button>

          <button
            onClick={() => router.push("/staff/salesb2c/tracker")}
            className="p-2 bg-gray-200 rounded-full hover:bg-gray-400 text-gray-700"
          >
            {task}
          </button>

          <button
            onClick={() => router.push("/admin/association")}
            className="p-2 bg-gray-200 rounded-full hover:bg-gray-400 text-gray-700"
          >
            <FaSignal/>
          </button>
        </div>
      </div>

      {/* Table */}
      <SaleTableB2C
        onDataLoaded={setAllSales}      // pass enhancedSales to parent
        filteredData={filteredSales}    // filtered by search
      />
    </div>
  );
}
