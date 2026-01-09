"use client";

import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchPricesB2C, fetchPricesB2B, fetchProducts } from "@/app/functions/admin/api/controller";
import { RetryButton } from "@/app/components/error/error";
import PriceTableB2B from "./components/b2b/pricetable";
import PriceTableB2C from "./components/b2c/pricetable";


export default function PriceManagementPage() {
  const [selectedType, setSelectedType] = useState("b2c");

  const result = useQueries({
    queries: [
      { queryKey: ["productQuery"], queryFn: fetchProducts },
      { queryKey: ["priceQueryB2C"], queryFn: fetchPricesB2C },
      { queryKey: ["priceQueryB2B"], queryFn: fetchPricesB2B },
    ],
  });

  const productData = result[0].data;
  const priceDataB2C = result[1].data;
  const priceDataB2B = result[2].data;
  const isLoading = result[0].isLoading || result[1].isLoading || result[2].isLoading;
  const hasError = result[0].error || result[1].error || result[2].error;

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
    <div className="flex flex-col">
      <div className="flex justify-end p-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select member type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="b2c">B2C</SelectItem>
            <SelectItem value="b2b">B2B</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedType === "b2c" ? (
        <div className="mt-5">
          <PriceTableB2C 
            productData={productData || []} 
            priceData={priceDataB2C || []} 
          />
        </div>
      ) : (
        <div className="mt-5">
          <PriceTableB2B 
            productData={productData || []} 
            priceData={priceDataB2B || []} 
          />
        </div>
      )}
    </div>
  );
}
