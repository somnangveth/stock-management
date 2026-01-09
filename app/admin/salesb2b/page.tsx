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
      <p className="text-center text-gray-500">
        Loading dealers...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-red-500">
        Failed to load dealers
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Actions */}
      <div className="flex justify-between items-center">
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
          placeholder="Search dealer..."
          className="w-[320px]"
        />

        <div className="flex gap-3">
          <Button
            className={ViewIconBtn}
            onClick={() => router.push("/admin/salesb2b/components/pos")}
          >
            {desktop}
          </Button>

          <AddDealerForm />
        </div>
      </div>

      {/* Dealer Table */}
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
            className={ViewIconBtn}
          >
            {view}
          </Button>
        )}
      />
    </div>
  );
}
